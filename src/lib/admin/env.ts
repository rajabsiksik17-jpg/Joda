import "server-only";
import { db } from "../db";
import type { Locale } from "../i18n/config";
import { tr } from "../i18n/localized";
import { pagePath } from "../links";

/** Reference options and link suggestions for admin editors. */
export async function getFieldEnv(locale: Locale) {
  const [services, team, serviceCategories, blogCategories, clientGroups, pages] = await Promise.all([
    db.service.findMany({ where: { deletedAt: null }, orderBy: { order: "asc" }, select: { id: true, slug: true, title: true } }),
    db.teamMember.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, position: true } }),
    db.serviceCategory.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    db.blogCategory.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    db.clientGroup.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    db.page.findMany({ where: { deletedAt: null }, orderBy: { slug: "asc" }, select: { id: true, slug: true, title: true } }),
  ]);
  return {
    refs: {
      services: services.map((s) => ({ value: s.id, label: tr(s.title, locale, true) })),
      teamMembers: team.map((m) => ({ value: m.id, label: `${tr(m.name, locale, true)} — ${tr(m.position, locale, true)}` })),
      serviceCategories: serviceCategories.map((c) => ({ value: c.id, label: tr(c.name, locale, true) })),
      blogCategories: blogCategories.map((c) => ({ value: c.id, label: tr(c.name, locale, true) })),
      clientGroups: clientGroups.map((c) => ({ value: c.id, label: tr(c.name, locale, true) })),
      pages: pages.map((p) => ({ value: p.id, label: `${tr(p.title, locale, true)} (${pagePath(p.slug)})` })),
    },
    links: [
      ...pages.map((p) => ({ label: tr(p.title, locale, true), href: pagePath(p.slug) })),
      ...services.map((s) => ({ label: tr(s.title, locale, true), href: `/services/${s.slug}` })),
      { label: "Search", href: "/search" },
    ],
  };
}
