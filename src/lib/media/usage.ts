import "server-only";
import { db } from "../db";

export type MediaUsage = { kind: string; label: string; href: string };

/** Finds where a media item is referenced so editors are warned before deleting it. */
export async function findMediaUsage(id: string): Promise<MediaUsage[]> {
  const like = `%${id}%`;
  const [sections, services, posts, team, partners, clients, testimonials, settings] = await Promise.all([
    db.$queryRaw<{ pageId: string; slug: string }[]>`SELECT DISTINCT s."pageId", p.slug FROM "PageSection" s JOIN "Page" p ON p.id = s."pageId" WHERE p."deletedAt" IS NULL AND (s.data::text LIKE ${like} OR p.seo::text LIKE ${like})`,
    db.$queryRaw<{ id: string; slug: string }[]>`SELECT id, slug FROM "Service" WHERE "deletedAt" IS NULL AND ("imageId" = ${id} OR seo::text LIKE ${like})`,
    db.$queryRaw<{ id: string; slug: string }[]>`SELECT id, slug FROM "BlogPost" WHERE "deletedAt" IS NULL AND ("coverId" = ${id} OR seo::text LIKE ${like})`,
    db.teamMember.findMany({ where: { photoId: id }, select: { id: true } }),
    db.partner.findMany({ where: { logoId: id }, select: { id: true } }),
    db.client.findMany({ where: { logoId: id }, select: { id: true } }),
    db.testimonial.findMany({ where: { photoId: id }, select: { id: true } }),
    db.$queryRaw<{ key: string }[]>`SELECT key FROM "Setting" WHERE value::text LIKE ${like}`,
  ]);
  return [
    ...sections.map((s) => ({ kind: "page", label: `/${s.slug === "home" ? "" : s.slug}`, href: `/admin/pages/${s.pageId}` })),
    ...services.map((s) => ({ kind: "service", label: s.slug, href: `/admin/services/${s.id}` })),
    ...posts.map((p) => ({ kind: "post", label: p.slug, href: `/admin/insights/${p.id}` })),
    ...team.map(() => ({ kind: "team", label: "Team", href: "/admin/collections/team" })),
    ...partners.map(() => ({ kind: "partner", label: "Partners", href: "/admin/collections/partners" })),
    ...clients.map(() => ({ kind: "client", label: "Clients", href: "/admin/collections/clients" })),
    ...testimonials.map(() => ({ kind: "testimonial", label: "Testimonials", href: "/admin/collections/testimonials" })),
    ...settings.map((s) => ({ kind: "settings", label: s.key, href: "/admin/settings?tab=brand" })),
  ];
}
