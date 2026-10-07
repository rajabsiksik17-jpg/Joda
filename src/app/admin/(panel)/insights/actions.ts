"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/session";
import { guarded, invalidateContent, zodFieldErrors, type ActionResult } from "@/lib/actions";
import { POST_MAIN_FIELDS, POST_SEO_FIELDS, POST_SIDE_FIELDS } from "@/lib/admin/entity-fields";
import { buildSchema } from "@/lib/sections/fields";
import { sanitizeRichText, toPlainText } from "@/lib/sanitize";

const schema = buildSchema([...POST_MAIN_FIELDS, ...POST_SIDE_FIELDS, ...POST_SEO_FIELDS]);
const idSchema = z.string().min(1).max(64);
type L = { ar: string; en: string };

export async function savePost(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const user = await authorize("blog.edit");
    const parsed = schema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    const v = parsed.data as Record<string, unknown>;
    const status = v.status as "DRAFT" | "PUBLISHED";
    const existing = id ? await db.blogPost.findFirstOrThrow({ where: { id: idSchema.parse(id), deletedAt: null } }) : null;

    // Publishing (or changing a live article) requires the publish permission.
    if ((status === "PUBLISHED" || existing?.status === "PUBLISHED") && !user.permissions.has("blog.publish")) return { ok: false, error: "forbidden" };

    const slugTaken = await db.blogPost.findFirst({ where: { slug: v.slug as string, ...(id ? { id: { not: id } } : {}) } });
    if (slugTaken) return { ok: false, error: "invalid", fieldErrors: { slug: "duplicate" } };

    const rawContent = v.content as L;
    const content = { ar: sanitizeRichText(rawContent.ar ?? ""), en: sanitizeRichText(rawContent.en ?? "") };
    const excerptIn = v.excerpt as L;
    const excerpt = { ar: excerptIn.ar || toPlainText(content.ar, 220), en: excerptIn.en || toPlainText(content.en, 220) };
    const title = v.title as L;
    // Ensure each language has a title when content exists in that language.
    for (const l of ["ar", "en"] as const) if (toPlainText(content[l], 10) && !title[l]) return { ok: false, error: "invalid", fieldErrors: { title: "required" } };

    const publishedAt = v.publishedAt ? new Date(v.publishedAt as string) : status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : null;
    const data = {
      slug: v.slug as string,
      title,
      excerpt,
      content,
      coverId: (v.coverId as string | null) ?? null,
      categoryId: (v.categoryId as string | null) || null,
      tags: v.tags as string[],
      authorName: (v.authorName as string) || null,
      status,
      publishedAt,
      featured: !!v.featured,
      seo: { title: v.seoTitle, description: v.seoDescription, ogImageId: v.ogImageId } as Prisma.InputJsonValue,
      updatedById: user.id,
    };
    const saved = id ? await db.blogPost.update({ where: { id }, data }) : await db.blogPost.create({ data: { ...data, createdById: user.id } });
    await audit({ action: id ? "post.update" : "post.create", userId: user.id, actorEmail: user.email, entityType: "post", entityId: saved.id, metadata: { slug: saved.slug, status, publishedAt: publishedAt?.toISOString() } });
    invalidateContent();
    return { ok: true, data: { id: saved.id } };
  });
}

export async function deletePost(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("blog.edit");
    const p = await db.blogPost.findFirstOrThrow({ where: { id: idSchema.parse(id), deletedAt: null } });
    if (p.status === "PUBLISHED" && !user.permissions.has("blog.publish")) return { ok: false, error: "forbidden" };
    await db.blogPost.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED", slug: `${p.slug}--deleted-${Date.now()}` } });
    await audit({ action: "post.delete", userId: user.id, actorEmail: user.email, entityType: "post", entityId: id, metadata: { slug: p.slug } });
    invalidateContent();
    return { ok: true };
  });
}
