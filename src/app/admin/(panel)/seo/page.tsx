import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink, FileSearch, ImageOff, Map as MapIcon, Plug, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { tr, type L } from "@/lib/i18n/localized";
import { SETTINGS_GROUPS } from "@/lib/admin/settings-fields";
import { getFieldEnv } from "@/lib/admin/env";
import { readSetting } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";
import sitemap from "@/app/sitemap";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "SEO" };

type Seo = { title?: L; description?: L; ogImageId?: string | null; noindex?: boolean } | null;
type Item = { kind: "page" | "service" | "post"; title: L; seo: Seo; fallbackDesc?: unknown; href: string; image?: string | null };
type Problem = { text: string; tone: "warning" | "danger" | "info" };

const LANGS = ["ar", "en"] as const;

export default async function SeoPage() {
  await requirePage("seo.edit");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const [seo, env, pages, services, posts, mediaNoAlt, urls, google] = await Promise.all([
    readSetting("seo"),
    getFieldEnv(locale),
    db.page.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, select: { id: true, slug: true, title: true, seo: true } }),
    db.service.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, select: { id: true, title: true, summary: true, seo: true, imageId: true } }),
    db.blogPost.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, select: { id: true, title: true, excerpt: true, seo: true, coverId: true } }),
    db.media.count({ where: { mimeType: { startsWith: "image/" }, OR: [{ alt: { equals: { ar: "", en: "" } } }] } }),
    sitemap().catch(() => []),
    readSetting("google"),
  ]);

  const items: Item[] = [
    ...pages.map((p) => ({ kind: "page" as const, title: p.title as L, seo: p.seo as Seo, href: `/admin/pages/${p.id}`, image: (p.seo as Seo)?.ogImageId })),
    ...services.map((s) => ({ kind: "service" as const, title: s.title as L, seo: s.seo as Seo, fallbackDesc: s.summary, href: `/admin/services/${s.id}`, image: (s.seo as Seo)?.ogImageId ?? s.imageId })),
    ...posts.map((p) => ({ kind: "post" as const, title: p.title as L, seo: p.seo as Seo, fallbackDesc: p.excerpt, href: `/admin/insights/${p.id}`, image: (p.seo as Seo)?.ogImageId ?? p.coverId })),
  ];

  // Effective values as rendered in search results (page title falls back to the item title).
  const titleOf = (i: Item, l: "ar" | "en") => tr(i.seo?.title, l) || tr(i.title, l);
  const descOf = (i: Item, l: "ar" | "en") => tr(i.seo?.description, l) || tr(i.fallbackDesc as L, l);
  const count = (key: (i: Item, l: "ar" | "en") => string) => {
    const m = new Map<string, number>();
    for (const i of items) for (const l of LANGS) {
      const v = key(i, l).trim().toLowerCase();
      if (v) m.set(`${l}:${v}`, (m.get(`${l}:${v}`) ?? 0) + 1);
    }
    return m;
  };
  const titleCount = count(titleOf);
  const descCount = count(descOf);
  const lang = (l: string) => (l === "ar" ? tx("Arabic", "العربية") : tx("English", "الإنجليزية"));

  const report = items
    .map((i) => {
      const problems: Problem[] = [];
      for (const l of LANGS) {
        const t = titleOf(i, l);
        const d = descOf(i, l);
        if (!tr(i.title, l)) continue; // not published in this language
        if (t.length > 65) problems.push({ tone: "warning", text: tx(`${lang(l)} title is long (${t.length} chars)`, `عنوان ${lang(l)} طويل (${t.length} حرفاً)`) });
        if (!d) problems.push({ tone: "danger", text: tx(`No ${lang(l)} description`, `لا يوجد وصف ${lang(l)}`) });
        else if (d.length < 70) problems.push({ tone: "warning", text: tx(`${lang(l)} description is short (${d.length})`, `وصف ${lang(l)} قصير (${d.length})`) });
        else if (d.length > 170) problems.push({ tone: "warning", text: tx(`${lang(l)} description is long (${d.length})`, `وصف ${lang(l)} طويل (${d.length})`) });
        if ((titleCount.get(`${l}:${t.trim().toLowerCase()}`) ?? 0) > 1) problems.push({ tone: "warning", text: tx(`Duplicate ${lang(l)} title`, `عنوان ${lang(l)} مكرر`) });
        if (d && (descCount.get(`${l}:${d.trim().toLowerCase()}`) ?? 0) > 1) problems.push({ tone: "warning", text: tx(`Duplicate ${lang(l)} description`, `وصف ${lang(l)} مكرر`) });
      }
      if (i.kind === "post" && !i.image) problems.push({ tone: "warning", text: tx("No cover / sharing image", "لا توجد صورة غلاف أو مشاركة") });
      if (i.seo?.noindex) problems.push({ tone: "info", text: tx("Hidden from search (noindex)", "مخفي عن البحث (noindex)") });
      return { i, problems };
    })
    .filter((r) => r.problems.length);

  const kindLabel = { page: tx("Page", "صفحة"), service: tx("Service", "خدمة"), post: tx("Article", "مقال") };
  const g = SETTINGS_GROUPS.seo;
  const errors = report.reduce((n, r) => n + r.problems.filter((p) => p.tone !== "info").length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title={tx("SEO", "تحسين محركات البحث")}
        description={tx(
          "Global search settings, crawl status and a content health report. Every page, service and article also has its own bilingual SEO fields (title, description, social sharing, noindex). Canonical URLs, hreflang, the sitemap and structured data are generated automatically.",
          "إعدادات البحث العامة وحالة الأرشفة وتقرير سلامة المحتوى. لكل صفحة وخدمة ومقال حقول خاصة باللغتين (العنوان والوصف والمشاركة الاجتماعية و noindex). تُنشأ الروابط القياسية و hreflang وخريطة الموقع والبيانات المنظمة تلقائياً.",
        )}
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <li className="rounded-lg border border-line bg-white p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink"><MapIcon className="size-4 text-tech-600" />{tx("Sitemap", "خريطة الموقع")}</p>
          <p className="mt-1 text-2xl font-bold text-ink" dir="ltr">{urls.length}</p>
          <p className="text-xs text-muted">{tx("indexable URLs (both languages)", "رابطاً قابلاً للأرشفة (باللغتين)")}</p>
          <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-tech-600">sitemap.xml <ExternalLink className="size-3" /></a>
        </li>
        <li className="rounded-lg border border-line bg-white p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink"><FileSearch className="size-4 text-tech-600" />robots.txt</p>
          <p className="mt-1">{seo.allowIndexing ? <Badge tone="success">{tx("Indexing allowed", "الأرشفة مسموحة")}</Badge> : <Badge tone="danger">{tx("Whole site hidden", "الموقع بالكامل مخفي")}</Badge>}</p>
          <p className="mt-1 text-xs text-muted">{tx("Admin, APIs, previews and search results are always excluded.", "لوحة التحكم والواجهات البرمجية والمعاينات ونتائج البحث مستثناة دائماً.")}</p>
          <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-tech-600">robots.txt <ExternalLink className="size-3" /></a>
        </li>
        <li className="rounded-lg border border-line bg-white p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink"><ShieldCheck className="size-4 text-tech-600" />{tx("Verification", "التحقق")}</p>
          <p className="mt-1 flex flex-wrap gap-1">
            <Badge tone={seo.googleVerification ? "success" : "neutral"}>Google</Badge>
            <Badge tone={seo.bingVerification ? "success" : "neutral"}>Bing</Badge>
          </p>
          <Link href="/admin/integrations" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-tech-600"><Plug className="size-3" />{google.refreshTokenEnc ? tx("Google connected", "Google مرتبط") : tx("Connect Google", "ربط Google")}</Link>
        </li>
        <li className="rounded-lg border border-line bg-white p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink"><ImageOff className="size-4 text-tech-600" />{tx("Image alt text", "النص البديل للصور")}</p>
          <p className="mt-1 text-2xl font-bold text-ink" dir="ltr">{mediaNoAlt}</p>
          <p className="text-xs text-muted">{tx("images without alt text", "صورة بلا نص بديل")}</p>
          <Link href="/admin/media" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-tech-600">{tx("Media library", "مكتبة الوسائط")}</Link>
        </li>
      </ul>

      <SettingsForm settingKey="seo" title={locale === "ar" ? g.title.ar : g.title.en} description={locale === "ar" ? g.description.ar : g.description.en} fields={g.fields} initial={seo as Record<string, unknown>} env={env} />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-semibold text-ink">{tx("Content health", "سلامة المحتوى")}</h2>
            <p className="mt-0.5 text-sm text-muted">{tx("Checks titles (≤ 60–65 characters), descriptions (70–160), duplicates, sharing images and noindex for everything published.", "يفحص العناوين (حتى 60–65 حرفاً) والأوصاف (70–160) والتكرار وصور المشاركة و noindex لكل المحتوى المنشور.")}</p>
          </div>
          <Badge tone={errors ? "warning" : "success"}>{errors ? tx(`${errors} to review`, `${errors} للمراجعة`) : tx("All good", "كل شيء سليم")}</Badge>
        </div>
        {report.length === 0 ? (
          <p className="flex items-center gap-2 px-5 py-8 text-sm text-emerald-700"><CheckCircle2 className="size-4" />{tx("Everything published has complete, unique search information in both languages.", "كل المحتوى المنشور له معلومات بحث كاملة وفريدة باللغتين.")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {report.map(({ i, problems }) => (
              <li key={i.href}>
                <Link href={i.href} className="flex flex-col gap-2 px-5 py-3 hover:bg-surface/60 sm:flex-row sm:items-center sm:gap-3">
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <Badge>{kindLabel[i.kind]}</Badge>
                    <span className="truncate text-sm font-semibold text-ink">{tr(i.title, locale, true)}</span>
                  </span>
                  <span className="flex flex-wrap gap-1">{problems.map((p) => <Badge key={p.text} tone={p.tone === "danger" ? "danger" : p.tone === "info" ? "info" : "warning"}>{p.text}</Badge>)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="text-xs text-muted">{tx("Public site:", "الموقع العام:")} <span dir="ltr">{siteUrl()}</span></p>
    </div>
  );
}
