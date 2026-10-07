"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/session";
import { guarded, invalidateContent, zodFieldErrors, type ActionResult } from "@/lib/actions";
import { zLocalized } from "@/lib/sections/fields";
import { SECTION_MAP, defaultSectionData, defaultSectionSettings, sectionSchema, sectionSettingsSchema } from "@/lib/sections/registry";
import { sanitizeByFields } from "@/lib/sections/sanitize-values";
import { buildSnapshot, type PageSnapshot } from "@/lib/sections/snapshot";

/** Paths owned by the application that a CMS page may not take over. */
const RESERVED = new Set(["admin", "api", "uploads", "brand", "preview", "search", "services", "insights", "sitemap.xml", "robots.txt", "manifest.webmanifest", "ar", "en", "_next"]);

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "required")
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$/, "invalid_slug")
  .refine((s) => !RESERVED.has(s.split("/")[0]), "reserved_slug");

const idSchema = z.string().min(1).max(64);

const seoSchema = z.object({
  title: zLocalized(120),
  description: zLocalized(320),
  ogTitle: zLocalized(120),
  ogDescription: zLocalized(320),
  ogImageId: z.string().max(64).nullable().default(null),
  noindex: z.boolean().default(false),
});

// ───────────────────────── Create / meta ─────────────────────────
const createSchema = z.object({ title: zLocalized(160, true), slug: slugSchema, kind: z.enum(["STANDARD", "LEGAL"]).default("STANDARD") });

export async function createPage(input: unknown): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const user = await authorize("pages.edit");
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    const { title, slug, kind } = parsed.data;
    const existing = await db.page.findUnique({ where: { slug } });
    if (existing && !existing.deletedAt) return { ok: false, error: "duplicate", fieldErrors: { slug: "duplicate" } };
    if (existing?.deletedAt) await db.page.delete({ where: { id: existing.id } });
    const page = await db.page.create({
      data: {
        slug,
        kind,
        title,
        seo: {},
        createdById: user.id,
        updatedById: user.id,
        sections: {
          create: [
            { type: "pageHeader", order: 0, data: { ...defaultSectionData("pageHeader"), title }, settings: defaultSectionSettings() },
            { type: kind === "LEGAL" ? "richText" : "textMedia", order: 1, data: defaultSectionData(kind === "LEGAL" ? "richText" : "textMedia") as Prisma.InputJsonValue, settings: defaultSectionSettings() },
          ],
        },
      },
    });
    await audit({ action: "page.create", userId: user.id, actorEmail: user.email, entityType: "page", entityId: page.id, metadata: { slug } });
    return { ok: true, data: { id: page.id } };
  });
}

const metaSchema = z.object({ title: zLocalized(160, true), slug: z.string(), seo: seoSchema });

export async function updatePageMeta(id: string, input: unknown): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("pages.edit");
    const page = await db.page.findFirstOrThrow({ where: { id: idSchema.parse(id), deletedAt: null } });
    const parsed = metaSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    let slug = page.slug;
    if (page.kind !== "HOME") {
      const s = slugSchema.safeParse(parsed.data.slug);
      if (!s.success) return { ok: false, error: "invalid", fieldErrors: { slug: s.error.issues[0].message } };
      slug = s.data;
    }
    await db.page.update({ where: { id }, data: { title: parsed.data.title, slug, seo: parsed.data.seo, hasUnpublishedChanges: true, updatedById: user.id } });
    await audit({ action: "page.update", userId: user.id, actorEmail: user.email, entityType: "page", entityId: id, metadata: { meta: true } });
    return { ok: true };
  });
}

// ───────────────────────── Sections ─────────────────────────
const sectionInput = z.object({
  id: z.string().max(64).optional().nullable(),
  type: z.string().max(40),
  visible: z.boolean(),
  data: z.record(z.string(), z.unknown()),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export type SavedSection = { id: string; type: string; visible: boolean; data: Record<string, unknown>; settings: Record<string, unknown> };

export async function savePageSections(pageId: string, input: unknown): Promise<ActionResult<SavedSection[]>> {
  return guarded(async () => {
    const user = await authorize("pages.edit");
    const page = await db.page.findFirstOrThrow({ where: { id: idSchema.parse(pageId), deletedAt: null }, include: { sections: { select: { id: true } } } });
    const list = z.array(sectionInput).max(60).parse(input);

    // Validate every section; collect errors as "<index>.<field path>".
    const fieldErrors: Record<string, string> = {};
    const cleaned = list.map((s, i) => {
      const schema = sectionSchema(s.type);
      if (!schema) {
        fieldErrors[`${i}`] = "unknown_type";
        return null;
      }
      const data = schema.safeParse(s.data);
      const settings = sectionSettingsSchema.safeParse(s.settings ?? {});
      if (!data.success) for (const [k, v] of Object.entries(zodFieldErrors(data.error))) fieldErrors[`${i}.${k}`] = v;
      if (!settings.success) for (const [k, v] of Object.entries(zodFieldErrors(settings.error))) fieldErrors[`${i}.settings.${k}`] = v;
      if (!data.success || !settings.success) return null;
      return { ...s, data: sanitizeByFields(SECTION_MAP[s.type].fields, data.data as Record<string, unknown>), settings: settings.data };
    });
    if (Object.keys(fieldErrors).length) return { ok: false, error: "invalid", fieldErrors };

    const ownIds = new Set(page.sections.map((s) => s.id));
    const keep = new Set(cleaned.map((s) => s!.id).filter((id): id is string => !!id && ownIds.has(id)));

    const saved = await db.$transaction(async (tx) => {
      await tx.pageSection.deleteMany({ where: { pageId, id: { notIn: Array.from(keep) } } });
      const out: SavedSection[] = [];
      for (const [order, s] of cleaned.entries()) {
        const row = s!.id && keep.has(s!.id)
          ? await tx.pageSection.update({ where: { id: s!.id }, data: { order, visible: s!.visible, data: s!.data as Prisma.InputJsonValue, settings: s!.settings as Prisma.InputJsonValue } })
          : await tx.pageSection.create({ data: { pageId, type: s!.type, order, visible: s!.visible, data: s!.data as Prisma.InputJsonValue, settings: s!.settings as Prisma.InputJsonValue } });
        out.push({ id: row.id, type: row.type, visible: row.visible, data: row.data as Record<string, unknown>, settings: (row.settings as Record<string, unknown>) ?? {} });
      }
      await tx.page.update({ where: { id: pageId }, data: { hasUnpublishedChanges: true, updatedById: user.id } });
      return out;
    });
    await audit({ action: "page.update", userId: user.id, actorEmail: user.email, entityType: "page", entityId: pageId, metadata: { sections: saved.length } });
    return { ok: true, data: saved };
  });
}

// ───────────────────────── Publishing ─────────────────────────
export async function publishPage(pageId: string, note?: string): Promise<ActionResult<{ publishedAt: string }>> {
  return guarded(async () => {
    const user = await authorize("pages.publish");
    const page = await db.page.findFirstOrThrow({ where: { id: idSchema.parse(pageId), deletedAt: null }, include: { sections: { orderBy: { order: "asc" } } } });
    const snapshot = buildSnapshot(page, page.sections);
    const now = new Date();
    await db.$transaction([
      db.page.update({ where: { id: pageId }, data: { status: "PUBLISHED", publishedAt: page.publishedAt ?? now, publishedSnapshot: snapshot as unknown as Prisma.InputJsonValue, hasUnpublishedChanges: false, updatedById: user.id } }),
      db.pageRevision.create({ data: { pageId, snapshot: snapshot as unknown as Prisma.InputJsonValue, note: note?.slice(0, 200) || null, createdById: user.id } }),
    ]);
    // Keep the revision history bounded.
    const old = await db.pageRevision.findMany({ where: { pageId }, orderBy: { createdAt: "desc" }, skip: 50, select: { id: true } });
    if (old.length) await db.pageRevision.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
    await audit({ action: "page.publish", userId: user.id, actorEmail: user.email, entityType: "page", entityId: pageId, metadata: { slug: page.slug } });
    invalidateContent();
    return { ok: true, data: { publishedAt: now.toISOString() } };
  });
}

export async function unpublishPage(pageId: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("pages.publish");
    const page = await db.page.findFirstOrThrow({ where: { id: idSchema.parse(pageId), deletedAt: null } });
    if (page.kind === "HOME") return { ok: false, error: "forbidden" };
    await db.page.update({ where: { id: pageId }, data: { status: "DRAFT", hasUnpublishedChanges: true } });
    await audit({ action: "page.unpublish", userId: user.id, actorEmail: user.email, entityType: "page", entityId: pageId, metadata: { slug: page.slug } });
    invalidateContent();
    return { ok: true };
  });
}

export async function deletePage(pageId: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("pages.delete");
    const page = await db.page.findFirstOrThrow({ where: { id: idSchema.parse(pageId), deletedAt: null } });
    if (page.kind === "HOME") return { ok: false, error: "forbidden" };
    // Soft delete frees the slug for reuse by suffixing it.
    await db.page.update({ where: { id: pageId }, data: { deletedAt: new Date(), status: "ARCHIVED", slug: `${page.slug}--deleted-${Date.now()}` } });
    await audit({ action: "page.delete", userId: user.id, actorEmail: user.email, entityType: "page", entityId: pageId, metadata: { slug: page.slug } });
    invalidateContent();
    return { ok: true };
  });
}

export async function duplicatePage(pageId: string): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const user = await authorize("pages.edit");
    const page = await db.page.findFirstOrThrow({ where: { id: idSchema.parse(pageId), deletedAt: null }, include: { sections: { orderBy: { order: "asc" } } } });
    let slug = `${page.slug === "home" ? "home-copy" : `${page.slug}-copy`}`;
    for (let n = 2; await db.page.findUnique({ where: { slug } }); n++) slug = `${page.slug}-copy-${n}`;
    const title = page.title as Record<string, string>;
    const copy = await db.page.create({
      data: {
        slug,
        kind: page.kind === "HOME" ? "STANDARD" : page.kind,
        title: { ar: title.ar ? `${title.ar} (نسخة)` : "", en: title.en ? `${title.en} (copy)` : "" },
        seo: page.seo ?? {},
        createdById: user.id,
        updatedById: user.id,
        sections: { create: page.sections.map((s) => ({ type: s.type, order: s.order, visible: s.visible, data: s.data as Prisma.InputJsonValue, settings: (s.settings ?? {}) as Prisma.InputJsonValue })) },
      },
    });
    await audit({ action: "page.duplicate", userId: user.id, actorEmail: user.email, entityType: "page", entityId: copy.id, metadata: { from: pageId } });
    return { ok: true, data: { id: copy.id } };
  });
}

// ───────────────────────── Revisions ─────────────────────────
export async function listRevisions(pageId: string): Promise<ActionResult<{ id: string; note: string | null; createdAt: string; by: string | null; sections: number }[]>> {
  return guarded(async () => {
    await authorize("pages.view");
    const revisions = await db.pageRevision.findMany({ where: { pageId: idSchema.parse(pageId) }, orderBy: { createdAt: "desc" }, take: 50 });
    const users = await db.user.findMany({ where: { id: { in: revisions.map((r) => r.createdById).filter((x): x is string => !!x) } }, select: { id: true, name: true } });
    const names = new Map(users.map((u) => [u.id, u.name]));
    return {
      ok: true,
      data: revisions.map((r) => ({ id: r.id, note: r.note, createdAt: r.createdAt.toISOString(), by: r.createdById ? names.get(r.createdById) ?? null : null, sections: (r.snapshot as unknown as PageSnapshot).sections?.length ?? 0 })),
    };
  });
}

/** Restores a published revision into the editable draft (it still needs publishing). */
export async function restoreRevision(revisionId: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("pages.edit");
    const rev = await db.pageRevision.findUniqueOrThrow({ where: { id: idSchema.parse(revisionId) } });
    const snap = rev.snapshot as unknown as PageSnapshot;
    await db.$transaction([
      db.pageSection.deleteMany({ where: { pageId: rev.pageId } }),
      ...snap.sections.map((s, order) => db.pageSection.create({ data: { pageId: rev.pageId, type: s.type, order, visible: true, data: s.data as Prisma.InputJsonValue, settings: s.settings as Prisma.InputJsonValue } })),
      db.page.update({ where: { id: rev.pageId }, data: { title: snap.title, seo: snap.seo as Prisma.InputJsonValue, hasUnpublishedChanges: true, updatedById: user.id } }),
    ]);
    await audit({ action: "page.restore_revision", userId: user.id, actorEmail: user.email, entityType: "page", entityId: rev.pageId, metadata: { revisionId } });
    return { ok: true };
  });
}

// ───────────────────────── Section templates ─────────────────────────
export async function saveSectionTemplate(input: unknown): Promise<ActionResult<{ id: string; name: string; type: string }>> {
  return guarded(async () => {
    const user = await authorize("pages.edit");
    const parsed = z.object({ name: z.string().trim().min(1).max(80), type: z.string().max(40), data: z.record(z.string(), z.unknown()), settings: z.record(z.string(), z.unknown()).optional() }).parse(input);
    const schema = sectionSchema(parsed.type);
    if (!schema) return { ok: false, error: "invalid" };
    const data = sanitizeByFields(SECTION_MAP[parsed.type].fields, schema.parse(parsed.data) as Record<string, unknown>);
    const t = await db.sectionTemplate.create({ data: { name: parsed.name, type: parsed.type, data: data as Prisma.InputJsonValue, settings: sectionSettingsSchema.parse(parsed.settings ?? {}) as Prisma.InputJsonValue, createdById: user.id } });
    await audit({ action: "template.create", userId: user.id, actorEmail: user.email, entityType: "template", entityId: t.id });
    return { ok: true, data: { id: t.id, name: t.name, type: t.type } };
  });
}

export async function getSectionTemplate(id: string): Promise<ActionResult<{ type: string; data: Record<string, unknown>; settings: Record<string, unknown> }>> {
  return guarded(async () => {
    await authorize("pages.edit");
    const t = await db.sectionTemplate.findUniqueOrThrow({ where: { id: idSchema.parse(id) } });
    return { ok: true, data: { type: t.type, data: t.data as Record<string, unknown>, settings: (t.settings as Record<string, unknown>) ?? {} } };
  });
}

export async function deleteSectionTemplate(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("pages.edit");
    await db.sectionTemplate.delete({ where: { id: idSchema.parse(id) } });
    await audit({ action: "template.delete", userId: user.id, actorEmail: user.email, entityType: "template", entityId: id });
    return { ok: true };
  });
}
