import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "../db";
import type { L } from "../i18n/localized";
import { pagePath } from "../links";
import { CONTENT_TAG } from "../settings";

export type NavLink = {
  id: string;
  label: L;
  description: L | null;
  href: string;
  external: boolean;
  newTab: boolean;
  isServicesMenu: boolean;
  children: NavLink[];
};

export type ServiceNavItem = { id: string; slug: string; title: L; summary: L | null; icon: string; categoryId: string | null };
export type ServiceCategoryNav = { id: string; slug: string; name: L; order: number };

export type Channel = { id: string; type: string; label: L | null; value: string; href: string | null; isPrimary: boolean; showInFooter: boolean };
export type Social = { id: string; platform: string; url: string; label: string | null };

type MenuItemRow = Awaited<ReturnType<typeof loadMenuRows>>[number];

async function loadMenuRows(key: string) {
  return db.menuItem.findMany({
    where: { menu: { key }, visible: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { page: { select: { slug: true, status: true, deletedAt: true } }, service: { select: { slug: true, status: true, deletedAt: true } } },
  });
}

function resolveItem(row: MenuItemRow): { href: string; ok: boolean } {
  switch (row.linkType) {
    case "PAGE":
      return row.page && row.page.status === "PUBLISHED" && !row.page.deletedAt ? { href: pagePath(row.page.slug), ok: true } : { href: "", ok: false };
    case "SERVICE":
      return row.service && row.service.status === "PUBLISHED" && !row.service.deletedAt ? { href: `/services/${row.service.slug}`, ok: true } : { href: "", ok: false };
    case "SERVICES_MENU":
      return { href: row.url || "/services", ok: true };
    default:
      return { href: row.url ?? "", ok: !!row.url };
  }
}

function buildTree(rows: MenuItemRow[]): NavLink[] {
  const byParent = new Map<string | null, MenuItemRow[]>();
  for (const r of rows) {
    const list = byParent.get(r.parentId) ?? [];
    list.push(r);
    byParent.set(r.parentId, list);
  }
  const walk = (parentId: string | null, depth: number): NavLink[] =>
    (byParent.get(parentId) ?? []).flatMap((r) => {
      const { href, ok } = resolveItem(r);
      const children = depth < 2 ? walk(r.id, depth + 1) : [];
      if (!ok && children.length === 0) return [];
      return [{
        id: r.id,
        label: r.label as L,
        description: (r.description as L) ?? null,
        href,
        external: /^https?:\/\//i.test(href),
        newTab: r.openInNewTab,
        isServicesMenu: r.linkType === "SERVICES_MENU",
        children,
      }];
    });
  return walk(null, 0);
}

export const getSiteChrome = unstable_cache(
  async () => {
    const [header, footer, legal, services, categories, channels, socials] = await Promise.all([
      loadMenuRows("header"),
      loadMenuRows("footer"),
      loadMenuRows("legal"),
      db.service.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        orderBy: [{ order: "asc" }],
        select: { id: true, slug: true, title: true, summary: true, icon: true, categoryId: true },
      }),
      db.serviceCategory.findMany({ orderBy: { order: "asc" }, select: { id: true, slug: true, name: true, order: true } }),
      db.contactChannel.findMany({ where: { visible: true }, orderBy: [{ order: "asc" }] }),
      db.socialLink.findMany({ where: { visible: true }, orderBy: [{ order: "asc" }] }),
    ]);
    return {
      header: buildTree(header),
      footer: buildTree(footer),
      legal: buildTree(legal),
      services: services.map((s) => ({ ...s, title: s.title as L, summary: s.summary as L | null })) as ServiceNavItem[],
      categories: categories.map((c) => ({ ...c, name: c.name as L })) as ServiceCategoryNav[],
      channels: channels.map((c) => ({ id: c.id, type: c.type, label: c.label as L | null, value: c.value, href: c.href, isPrimary: c.isPrimary, showInFooter: c.showInFooter })) as Channel[],
      socials: socials.map((s) => ({ id: s.id, platform: s.platform, url: s.url, label: s.label })) as Social[],
    };
  },
  ["site-chrome"],
  { tags: [CONTENT_TAG] },
);

export type SiteChrome = Awaited<ReturnType<typeof getSiteChrome>>;
