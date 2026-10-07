import { db } from "@/lib/db";
import { apiAuthorize } from "@/lib/api-guard";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { tr, type L } from "@/lib/i18n/localized";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await apiAuthorize(request, ["dashboard.view"]);
  if (user instanceof Response) return user;
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return Response.json({ hits: [] });
  const locale = await getAdminLocale();
  const pattern = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  const can = (p: Parameters<typeof user.permissions.has>[0]) => user.permissions.has(p);

  const [pages, services, posts, messages, media, users] = await Promise.all([
    can("pages.view")
      ? db.$queryRaw<{ id: string; slug: string; title: L }[]>`SELECT id, slug, title FROM "Page" WHERE "deletedAt" IS NULL AND (slug ILIKE ${pattern} OR title::text ILIKE ${pattern}) LIMIT 6`
      : [],
    can("services.edit")
      ? db.$queryRaw<{ id: string; slug: string; title: L }[]>`SELECT id, slug, title FROM "Service" WHERE "deletedAt" IS NULL AND (slug ILIKE ${pattern} OR title::text ILIKE ${pattern} OR summary::text ILIKE ${pattern}) LIMIT 6`
      : [],
    can("blog.edit")
      ? db.$queryRaw<{ id: string; slug: string; title: L }[]>`SELECT id, slug, title FROM "BlogPost" WHERE "deletedAt" IS NULL AND (slug ILIKE ${pattern} OR title::text ILIKE ${pattern}) LIMIT 6`
      : [],
    can("messages.view")
      ? db.contactMessage.findMany({ where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }, { company: { contains: q, mode: "insensitive" } }] }, take: 6, orderBy: { createdAt: "desc" } })
      : [],
    can("media.manage") ? db.media.findMany({ where: { originalName: { contains: q, mode: "insensitive" } }, take: 4, orderBy: { createdAt: "desc" } }) : [],
    can("users.manage") ? db.user.findMany({ where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }, take: 4 }) : [],
  ]);

  return Response.json({
    hits: [
      ...pages.map((p) => ({ kind: "page", title: tr(p.title, locale, true), subtitle: `/${p.slug === "home" ? "" : p.slug}`, href: `/admin/pages/${p.id}` })),
      ...services.map((s) => ({ kind: "service", title: tr(s.title, locale, true), subtitle: `/services/${s.slug}`, href: `/admin/services/${s.id}` })),
      ...posts.map((p) => ({ kind: "post", title: tr(p.title, locale, true), subtitle: `/insights/${p.slug}`, href: `/admin/insights/${p.id}` })),
      ...messages.map((m) => ({ kind: "message", title: m.subject || m.name, subtitle: `${m.name} · ${m.email}`, href: `/admin/messages?open=${m.id}` })),
      ...media.map((m) => ({ kind: "media", title: m.originalName, subtitle: m.mimeType, href: `/admin/media?open=${m.id}` })),
      ...users.map((u) => ({ kind: "user", title: u.name, subtitle: u.email, href: `/admin/users?open=${u.id}` })),
    ],
  });
}
