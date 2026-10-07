import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { tr, type L } from "@/lib/i18n/localized";
import { SETTINGS_GROUPS } from "@/lib/admin/settings-fields";
import { getFieldEnv } from "@/lib/admin/env";
import { readSetting } from "@/lib/settings";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "SEO" };

type Issue = { title: string; href: string; problems: string[] };

export default async function SeoPage() {
  await requirePage("seo.edit");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const [seo, env, pages, services, posts] = await Promise.all([
    readSetting("seo"),
    getFieldEnv(locale),
    db.page.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, select: { id: true, slug: true, title: true, seo: true } }),
    db.service.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, select: { id: true, title: true, summary: true, seo: true } }),
    db.blogPost.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, select: { id: true, title: true, excerpt: true, seo: true, coverId: true } }),
  ]);

  const missingDesc = (seoValue: unknown, fallback?: unknown) => {
    const d = (seoValue as { description?: L })?.description;
    return (["ar", "en"] as const).filter((l) => !tr(d, l) && !tr(fallback, l));
  };
  const issues: Issue[] = [];
  for (const p of pages) {
    const problems = [...missingDesc(p.seo).map((l) => tx(`No ${l.toUpperCase()} meta description`, `لا يوجد وصف ميتا ${l === "ar" ? "عربي" : "إنجليزي"}`)), ...(["ar", "en"] as const).filter((l) => !tr(p.title, l)).map((l) => tx(`No ${l.toUpperCase()} title`, `لا يوجد عنوان ${l === "ar" ? "عربي" : "إنجليزي"}`))];
    if (problems.length && p.slug !== "home") issues.push({ title: tr(p.title, locale, true), href: `/admin/pages/${p.id}`, problems });
  }
  for (const s of services) {
    const problems = (["ar", "en"] as const).filter((l) => !tr(s.title, l)).map((l) => tx(`No ${l.toUpperCase()} title`, `لا يوجد عنوان ${l === "ar" ? "عربي" : "إنجليزي"}`));
    problems.push(...missingDesc(s.seo, s.summary).map((l) => tx(`No ${l.toUpperCase()} description/summary`, `لا يوجد وصف أو ملخص ${l === "ar" ? "عربي" : "إنجليزي"}`)));
    if (problems.length) issues.push({ title: tr(s.title, locale, true), href: `/admin/services/${s.id}`, problems });
  }
  for (const p of posts) {
    const problems: string[] = [];
    if (!p.coverId && !(p.seo as { ogImageId?: string })?.ogImageId) problems.push(tx("No cover/sharing image", "لا توجد صورة غلاف أو مشاركة"));
    if (problems.length) issues.push({ title: tr(p.title, locale, true), href: `/admin/insights/${p.id}`, problems });
  }

  const g = SETTINGS_GROUPS.seo;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title={tx("SEO", "تحسين محركات البحث")}
        description={tx("Each page, service and insight also has its own SEO fields. Sitemap, robots, canonical URLs, hreflang and structured data are generated automatically.", "لكل صفحة وخدمة ومقال حقول خاصة لتحسين البحث. يتم إنشاء خريطة الموقع وملف robots والروابط القياسية وhreflang والبيانات المنظمة تلقائياً.")}
        actions={<a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-white px-4 text-sm font-medium text-ink hover:bg-surface"><ExternalLink className="size-4" />sitemap.xml</a>}
      />
      <SettingsForm settingKey="seo" title={locale === "ar" ? g.title.ar : g.title.en} description={locale === "ar" ? g.description.ar : g.description.en} fields={g.fields} initial={seo as Record<string, unknown>} env={env} />
      <Card>
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold text-ink">{tx("Content health", "سلامة المحتوى")}</h2>
          <p className="mt-0.5 text-sm text-muted">{tx("Published content that is missing search or sharing information.", "المحتوى المنشور الذي تنقصه معلومات البحث أو المشاركة.")}</p>
        </div>
        {issues.length === 0 ? (
          <p className="flex items-center gap-2 px-5 py-8 text-sm text-emerald-700"><CheckCircle2 className="size-4" />{tx("Everything published has titles and descriptions in both languages.", "كل المحتوى المنشور له عناوين وأوصاف باللغتين.")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {issues.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-surface/60">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{i.title}</span>
                  {i.problems.map((p) => <Badge key={p} tone="warning">{p}</Badge>)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
