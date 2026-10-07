import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { getServices } from "@/lib/content/collections";
import { getPublishedPageIndex } from "@/lib/content/pages";
import { getPublishedPostIndex } from "@/lib/content/posts";
import { pagePath } from "@/lib/links";
import { getSetting } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";
import { hasLocale } from "@/lib/i18n/localized";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSetting("seo");
  if (!seo.allowIndexing) return [];
  const base = siteUrl();
  const [pages, services, posts] = await Promise.all([getPublishedPageIndex(), getServices(), getPublishedPostIndex()]);
  const entries: MetadataRoute.Sitemap = [];

  const add = (path: string, lastModified: string, available: readonly string[], priority: number) => {
    const languages = Object.fromEntries(available.map((l) => [l, `${base}/${l}${path}`]));
    for (const l of available) entries.push({ url: `${base}/${l}${path}`, lastModified, alternates: { languages }, priority });
  };

  for (const p of pages) {
    const path = pagePath(p.slug) === "/" ? "" : pagePath(p.slug);
    add(path, p.updatedAt, locales, p.slug === "home" ? 1 : 0.8);
  }
  for (const s of services) add(`/services/${s.slug}`, s.updatedAt, locales.filter((l) => hasLocale(s.title, l)), 0.9);
  for (const p of posts) add(`/insights/${p.slug}`, p.updatedAt, locales.filter((l) => hasLocale(p.title, l)), 0.6);
  return entries;
}
