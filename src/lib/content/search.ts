import "server-only";
import { db } from "../db";
import type { Locale } from "../i18n/config";
import { tr, type L } from "../i18n/localized";
import { toPlainText } from "../sanitize";
import type { PageSnapshot } from "../sections/snapshot";
import { pagePath } from "../links";

export type SearchHit = { kind: "service" | "post" | "page"; title: string; snippet: string; href: string };

function escapeLike(q: string) {
  return `%${q.replace(/[%_\\]/g, "\\$&")}%`;
}

/** Collects text from a published page snapshot for matching and snippets. */
function snapshotText(snapshot: PageSnapshot | null, locale: Locale) {
  if (!snapshot) return "";
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (!v) return;
    if (typeof v === "object" && !Array.isArray(v) && ("ar" in (v as object) || "en" in (v as object))) {
      const s = tr(v, locale);
      if (s) out.push(s);
      return;
    }
    if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") Object.values(v as object).forEach(walk);
  };
  snapshot.sections.forEach((s) => walk(s.data));
  return toPlainText(out.join(" "), 100_000);
}

function snippetAround(text: string, q: string, size = 180) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text.slice(0, size);
  const start = Math.max(0, i - 60);
  return `${start > 0 ? "…" : ""}${text.slice(start, start + size)}${start + size < text.length ? "…" : ""}`;
}

/**
 * Site search across published services, insights and pages using PostgreSQL ILIKE on the
 * localized JSON fields. Adequate for a corporate site; can be upgraded to full-text search
 * (tsvector + GIN index) without changing callers.
 */
export async function searchSite(rawQuery: string, locale: Locale): Promise<SearchHit[]> {
  const q = rawQuery.trim().slice(0, 100);
  if (q.length < 2) return [];
  const pattern = escapeLike(q);

  const [services, posts, pages] = await Promise.all([
    db.$queryRaw<{ slug: string; title: L; summary: L | null; description: L | null }[]>`
      SELECT slug, title, summary, description FROM "Service"
      WHERE status = 'PUBLISHED' AND "deletedAt" IS NULL AND (
        title->>${locale} ILIKE ${pattern} OR summary->>${locale} ILIKE ${pattern} OR description->>${locale} ILIKE ${pattern} OR capabilities::text ILIKE ${pattern})
      ORDER BY "order" LIMIT 20`,
    db.$queryRaw<{ slug: string; title: L; excerpt: L | null; content: L }[]>`
      SELECT slug, title, excerpt, content FROM "BlogPost"
      WHERE status = 'PUBLISHED' AND "deletedAt" IS NULL AND "publishedAt" <= NOW() AND COALESCE(title->>${locale}, '') <> '' AND (
        title->>${locale} ILIKE ${pattern} OR excerpt->>${locale} ILIKE ${pattern} OR content->>${locale} ILIKE ${pattern})
      ORDER BY "publishedAt" DESC LIMIT 20`,
    db.$queryRaw<{ slug: string; publishedSnapshot: PageSnapshot | null }[]>`
      SELECT slug, "publishedSnapshot" FROM "Page"
      WHERE status = 'PUBLISHED' AND "deletedAt" IS NULL AND "publishedSnapshot"::text ILIKE ${pattern}
      LIMIT 20`,
  ]);

  const hits: SearchHit[] = [];
  for (const s of services) {
    const body = [tr(s.summary, locale), tr(s.description, locale)].join(" ");
    if (tr(s.title, locale)) hits.push({ kind: "service", title: tr(s.title, locale), snippet: snippetAround(body, q), href: `/${locale}/services/${s.slug}` });
  }
  for (const p of posts) {
    const body = tr(p.excerpt, locale) || toPlainText(tr(p.content, locale), 5000);
    hits.push({ kind: "post", title: tr(p.title, locale), snippet: snippetAround(body, q), href: `/${locale}/insights/${p.slug}` });
  }
  for (const p of pages) {
    const text = snapshotText(p.publishedSnapshot, locale);
    if (!text.toLowerCase().includes(q.toLowerCase()) && !tr(p.publishedSnapshot?.title, locale).toLowerCase().includes(q.toLowerCase())) continue;
    if (p.publishedSnapshot?.seo?.noindex) continue;
    hits.push({ kind: "page", title: tr(p.publishedSnapshot?.title, locale, true), snippet: snippetAround(text, q), href: `/${locale}${pagePath(p.slug) === "/" ? "" : pagePath(p.slug)}` });
  }
  return hits;
}
