"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/session";
import { guarded, invalidateContent, zodFieldErrors, type ActionResult } from "@/lib/actions";
import { SAFE_HREF, zLocalized } from "@/lib/sections/fields";

const itemSchema = z
  .object({
    id: z.string().max(64).optional().nullable(),
    label: zLocalized(80, true),
    description: zLocalized(200),
    linkType: z.enum(["PAGE", "SERVICE", "INTERNAL", "EXTERNAL", "SERVICES_MENU"]),
    pageId: z.string().max(64).nullable().default(null),
    serviceId: z.string().max(64).nullable().default(null),
    url: z.string().trim().max(500).default(""),
    openInNewTab: z.boolean().default(false),
    visible: z.boolean().default(true),
    depth: z.number().int().min(0).max(1),
  })
  .superRefine((v, ctx) => {
    if (v.linkType === "PAGE" && !v.pageId) ctx.addIssue({ code: "custom", path: ["pageId"], message: "required" });
    if (v.linkType === "SERVICE" && !v.serviceId) ctx.addIssue({ code: "custom", path: ["serviceId"], message: "required" });
    if (v.linkType === "INTERNAL" && !/^\/(?!\/)[^\s]*$/.test(v.url)) ctx.addIssue({ code: "custom", path: ["url"], message: "invalid_href" });
    if (v.linkType === "EXTERNAL" && !(/^https?:\/\//i.test(v.url) || /^(mailto|tel):/i.test(v.url)) ) ctx.addIssue({ code: "custom", path: ["url"], message: "invalid_url" });
    if (v.url && !SAFE_HREF.test(v.url)) ctx.addIssue({ code: "custom", path: ["url"], message: "invalid_href" });
  });

export async function saveMenu(key: string, input: unknown): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("navigation.edit");
    const menu = await db.menu.findUniqueOrThrow({ where: { key: z.enum(["header", "footer", "legal"]).parse(key) } });
    const parsed = z.array(itemSchema).max(60).safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    const items = parsed.data;
    if (items[0]?.depth === 1) return { ok: false, error: "invalid", fieldErrors: { "0.depth": "invalid" } };

    const existing = await db.menuItem.findMany({ where: { menuId: menu.id }, select: { id: true } });
    const own = new Set(existing.map((e) => e.id));
    await db.$transaction(async (tx) => {
      const keep = items.map((i) => i.id).filter((id): id is string => !!id && own.has(id));
      // Children first (cascade would remove them anyway), then the rest.
      await tx.menuItem.deleteMany({ where: { menuId: menu.id, id: { notIn: keep } } });
      await tx.menuItem.updateMany({ where: { menuId: menu.id }, data: { parentId: null } });
      let currentParent: string | null = null;
      for (const [order, item] of items.entries()) {
        const data: Prisma.MenuItemUncheckedUpdateInput & { order: number } = {
          label: item.label,
          description: item.description,
          linkType: item.linkType,
          pageId: item.linkType === "PAGE" ? item.pageId : null,
          serviceId: item.linkType === "SERVICE" ? item.serviceId : null,
          url: ["INTERNAL", "EXTERNAL", "SERVICES_MENU"].includes(item.linkType) ? item.url || null : null,
          openInNewTab: item.openInNewTab,
          visible: item.visible,
          order,
          parentId: item.depth === 1 ? currentParent : null,
        };
        const row: { id: string } = item.id && own.has(item.id)
          ? await tx.menuItem.update({ where: { id: item.id }, data })
          : await tx.menuItem.create({ data: { ...(data as Prisma.MenuItemUncheckedCreateInput), menuId: menu.id } });
        if (item.depth === 0) currentParent = row.id;
      }
    });
    await audit({ action: "navigation.update", userId: user.id, actorEmail: user.email, entityType: "menu", entityId: menu.id, metadata: { key, items: items.length } });
    invalidateContent();
    return { ok: true };
  });
}
