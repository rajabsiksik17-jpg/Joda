import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "../db";
import type { L } from "../i18n/localized";
import { CONTENT_TAG } from "../settings";
import { buildSnapshot, type PageSnapshot } from "../sections/snapshot";

export type { PageSeo, PageSnapshot, RenderSection } from "../sections/snapshot";

export const getPublishedPage = unstable_cache(
  async (slug: string): Promise<(PageSnapshot & { slug: string; publishedAt: string | null }) | null> => {
    const page = await db.page.findFirst({ where: { slug, status: "PUBLISHED", deletedAt: null } });
    if (!page?.publishedSnapshot) return null;
    return { ...(page.publishedSnapshot as unknown as PageSnapshot), slug: page.slug, publishedAt: page.publishedAt?.toISOString() ?? null };
  },
  ["published-page"],
  { tags: [CONTENT_TAG] },
);

/** Live (draft) state of a page, for authenticated preview only. */
export async function getDraftPage(id: string) {
  const page = await db.page.findFirst({ where: { id, deletedAt: null }, include: { sections: { orderBy: { order: "asc" } } } });
  if (!page) return null;
  return { ...buildSnapshot(page, page.sections), slug: page.slug };
}

export const getPublishedPageIndex = unstable_cache(
  async () => {
    const pages = await db.page.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, title: true, updatedAt: true, publishedSnapshot: true } });
    return pages
      .filter((p) => !(p.publishedSnapshot as unknown as PageSnapshot)?.seo?.noindex)
      .map((p) => ({ slug: p.slug, title: p.title as L, updatedAt: p.updatedAt.toISOString() }));
  },
  ["page-index"],
  { tags: [CONTENT_TAG] },
);
