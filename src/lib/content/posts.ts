import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "../db";
import type { Locale } from "../i18n/config";
import type { L } from "../i18n/localized";
import { CONTENT_TAG } from "../settings";

export type PostCard = {
  id: string;
  slug: string;
  title: L;
  excerpt: L | null;
  coverId: string | null;
  category: { slug: string; name: L } | null;
  publishedAt: string;
  authorName: string | null;
  tags: string[];
};

const cardSelect = {
  id: true, slug: true, title: true, excerpt: true, coverId: true, publishedAt: true, authorName: true, tags: true,
  category: { select: { slug: true, name: true } },
} as const;

/** Published = status PUBLISHED and publication time reached (future dates are scheduled). */
function visibleWhere(locale: Locale) {
  return {
    status: "PUBLISHED" as const,
    deletedAt: null,
    publishedAt: { lte: new Date() },
    // Only list posts written in the requested language (the editor always stores every locale key).
    NOT: { title: { path: [locale], equals: "" } },
  };
}

type CardRow = { id: string; slug: string; title: unknown; excerpt: unknown; coverId: string | null; publishedAt: Date | null; authorName: string | null; tags: string[]; category: { slug: string; name: unknown } | null };

function toCard(p: CardRow): PostCard {
  return {
    id: p.id, slug: p.slug, title: p.title as L, excerpt: p.excerpt as L | null, coverId: p.coverId,
    category: p.category ? { slug: p.category.slug, name: p.category.name as L } : null,
    publishedAt: (p.publishedAt ?? new Date()).toISOString(), authorName: p.authorName, tags: p.tags,
  };
}

// Short revalidation window so scheduled posts appear without a manual action.
const SCHEDULE_WINDOW = 120;

export const listPosts = unstable_cache(
  async (opts: { locale: Locale; q?: string; category?: string; page?: number; pageSize?: number }) => {
    const pageSize = Math.min(Math.max(opts.pageSize ?? 9, 1), 30);
    const page = Math.max(opts.page ?? 1, 1);
    const q = opts.q?.trim().slice(0, 100);
    let idFilter: string[] | undefined;
    if (q) {
      const pattern = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
      const rows = await db.$queryRaw<{ id: string }[]>`
        SELECT id FROM "BlogPost"
        WHERE "deletedAt" IS NULL AND (
          title->>${opts.locale} ILIKE ${pattern} OR excerpt->>${opts.locale} ILIKE ${pattern} OR content->>${opts.locale} ILIKE ${pattern}
          OR array_to_string(tags, ' ') ILIKE ${pattern})
        LIMIT 500`;
      idFilter = rows.map((r) => r.id);
    }
    const where = {
      ...visibleWhere(opts.locale),
      ...(opts.category ? { category: { slug: opts.category } } : {}),
      ...(idFilter ? { id: { in: idFilter } } : {}),
    };
    const [total, rows] = await Promise.all([
      db.blogPost.count({ where }),
      db.blogPost.findMany({ where, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize, select: cardSelect }),
    ]);
    return { posts: rows.map(toCard), total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  },
  ["posts-list"],
  { tags: [CONTENT_TAG], revalidate: SCHEDULE_WINDOW },
);

export const latestPosts = unstable_cache(
  async (locale: Locale, limit: number, excludeId?: string) =>
    (
      await db.blogPost.findMany({
        where: { ...visibleWhere(locale), ...(excludeId ? { id: { not: excludeId } } : {}) },
        orderBy: { publishedAt: "desc" },
        take: limit,
        select: cardSelect,
      })
    ).map(toCard),
  ["posts-latest"],
  { tags: [CONTENT_TAG], revalidate: SCHEDULE_WINDOW },
);

export const getPost = unstable_cache(
  async (slug: string, locale: Locale) => {
    const p = await db.blogPost.findFirst({ where: { slug, ...visibleWhere(locale) }, include: { category: true } });
    if (!p) return null;
    return {
      ...toCard({ ...p, category: p.category }),
      content: p.content as L,
      seo: p.seo as { title?: L; description?: L; ogImageId?: string | null } | null,
      categoryId: p.categoryId,
      updatedAt: p.updatedAt.toISOString(),
    };
  },
  ["post"],
  { tags: [CONTENT_TAG], revalidate: SCHEDULE_WINDOW },
);

export async function relatedPosts(post: { id: string; categoryId: string | null; tags: string[] }, locale: Locale, limit = 3) {
  const rows = await db.blogPost.findMany({
    where: {
      ...visibleWhere(locale),
      id: { not: post.id },
      OR: [...(post.categoryId ? [{ categoryId: post.categoryId }] : []), ...(post.tags.length ? [{ tags: { hasSome: post.tags } }] : [])],
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  if (rows.length >= limit || (!post.categoryId && !post.tags.length)) return rows.map(toCard);
  return [...rows.map(toCard), ...(await latestPosts(locale, limit + 1, post.id)).filter((p) => !rows.some((r) => r.id === p.id))].slice(0, limit);
}

export const getBlogCategories = unstable_cache(
  async () => (await db.blogCategory.findMany({ orderBy: { order: "asc" } })).map((c) => ({ id: c.id, slug: c.slug, name: c.name as L })),
  ["blog-categories"],
  { tags: [CONTENT_TAG] },
);

export const getPublishedPostIndex = unstable_cache(
  async () =>
    (await db.blogPost.findMany({ where: { status: "PUBLISHED", deletedAt: null, publishedAt: { lte: new Date() } }, select: { slug: true, title: true, updatedAt: true } })).map((p) => ({
      slug: p.slug, title: p.title as L, updatedAt: p.updatedAt.toISOString(),
    })),
  ["post-index"],
  { tags: [CONTENT_TAG], revalidate: SCHEDULE_WINDOW },
);
