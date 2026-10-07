"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/session";
import { guarded, invalidateContent, zodFieldErrors, type ActionResult } from "@/lib/actions";
import { SERVICE_MAIN_FIELDS, SERVICE_SEO_FIELDS, SERVICE_SIDE_FIELDS } from "@/lib/admin/entity-fields";
import { buildSchema } from "@/lib/sections/fields";

const schema = buildSchema([...SERVICE_MAIN_FIELDS, ...SERVICE_SIDE_FIELDS, ...SERVICE_SEO_FIELDS]);
const idSchema = z.string().min(1).max(64);

type L = { ar: string; en: string };
type FormGroup = { title: L; text: L; items: { text: L }[] };

export async function saveService(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const user = await authorize("services.edit");
    const parsed = schema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    const v = parsed.data as Record<string, unknown>;
    const slugTaken = await db.service.findFirst({ where: { slug: v.slug as string, ...(id ? { id: { not: id } } : {}) } });
    if (slugTaken) return { ok: false, error: "invalid", fieldErrors: { slug: "duplicate" } };

    // Form shape → storage shape (capability items are stored as plain localized strings).
    const capabilities = (v.capabilities as FormGroup[]).map((g) => ({ title: g.title, text: g.text, items: g.items.map((i) => i.text).filter((t) => t.ar || t.en) }));
    const relatedIds = (v.relatedIds as string[]).filter((r) => r !== id);
    const status = v.status as "DRAFT" | "PUBLISHED";
    const data = {
      slug: v.slug as string,
      title: v.title as L,
      summary: v.summary as L,
      description: v.description as L,
      icon: (v.icon as string) || "sparkles",
      imageId: (v.imageId as string | null) ?? null,
      capabilities: capabilities as Prisma.InputJsonValue,
      steps: v.steps as Prisma.InputJsonValue,
      ctaLabel: v.ctaLabel as L,
      whyItMatters: v.whyItMatters as L,
      outcomes: v.outcomes as Prisma.InputJsonValue,
      visual: (v.visual as string) || "auto",
      capabilityLayout: (v.capabilityLayout as string) || "grid",
      seo: { title: v.seoTitle, description: v.seoDescription, ogImageId: v.ogImageId } as Prisma.InputJsonValue,
      featured: !!v.featured,
      status,
      categoryId: (v.categoryId as string | null) || null,
      updatedById: user.id,
    };
    let saved;
    if (id) {
      const existing = await db.service.findFirstOrThrow({ where: { id: idSchema.parse(id), deletedAt: null } });
      saved = await db.service.update({
        where: { id },
        data: { ...data, publishedAt: status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt, related: { set: relatedIds.map((r) => ({ id: r })) } },
      });
    } else {
      const max = await db.service.aggregate({ _max: { order: true } });
      saved = await db.service.create({
        data: { ...data, order: (max._max.order ?? -1) + 1, createdById: user.id, publishedAt: status === "PUBLISHED" ? new Date() : null, related: { connect: relatedIds.map((r) => ({ id: r })) } },
      });
    }
    await audit({ action: id ? "service.update" : "service.create", userId: user.id, actorEmail: user.email, entityType: "service", entityId: saved.id, metadata: { slug: saved.slug, status } });
    invalidateContent();
    return { ok: true, data: { id: saved.id } };
  });
}

export async function deleteService(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("services.edit");
    const s = await db.service.findFirstOrThrow({ where: { id: idSchema.parse(id), deletedAt: null } });
    await db.service.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED", slug: `${s.slug}--deleted-${Date.now()}`, related: { set: [] } } });
    await audit({ action: "service.delete", userId: user.id, actorEmail: user.email, entityType: "service", entityId: id, metadata: { slug: s.slug } });
    invalidateContent();
    return { ok: true };
  });
}

export async function reorderServices(ids: string[]): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("services.edit");
    const list = z.array(idSchema).max(200).parse(ids);
    await db.$transaction(list.map((id, order) => db.service.update({ where: { id }, data: { order } })));
    await audit({ action: "collection.reorder", userId: user.id, actorEmail: user.email, entityType: "service" });
    invalidateContent();
    return { ok: true };
  });
}

export async function setServiceStatus(id: string, published: boolean): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("services.edit");
    const s = await db.service.findFirstOrThrow({ where: { id: idSchema.parse(id), deletedAt: null } });
    await db.service.update({ where: { id }, data: { status: published ? "PUBLISHED" : "DRAFT", publishedAt: published ? s.publishedAt ?? new Date() : s.publishedAt } });
    await audit({ action: "service.update", userId: user.id, actorEmail: user.email, entityType: "service", entityId: id, metadata: { status: published ? "PUBLISHED" : "DRAFT" } });
    invalidateContent();
    return { ok: true };
  });
}
