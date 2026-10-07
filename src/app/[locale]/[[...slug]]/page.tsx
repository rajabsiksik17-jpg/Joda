import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import { getPublishedPage } from "@/lib/content/pages";
import { buildMetadata } from "@/lib/seo";
import { SectionList } from "@/components/sections/section-renderer";

type Params = Promise<{ locale: string; slug?: string[] }>;

function slugOf(parts?: string[]) {
  if (!parts?.length) return "home";
  const slug = parts.map((p) => decodeURIComponent(p)).join("/");
  return /^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(slug) && slug.length <= 200 ? slug : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: raw, slug: parts } = await params;
  const slug = slugOf(parts);
  if (!isLocale(raw) || !slug) return {};
  const page = await getPublishedPage(slug);
  if (!page) return {};
  const locale: Locale = raw;
  const isHome = slug === "home";
  return buildMetadata({
    locale,
    path: isHome ? "" : `/${slug}`,
    title: isHome ? undefined : tr(page.seo.title, locale) || tr(page.title, locale, true),
    description: tr(page.seo.description, locale),
    ogImageId: page.seo.ogImageId,
    noindex: page.seo.noindex,
  });
}

export default async function CmsPage({ params, searchParams }: { params: Params; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, slug: parts } = await params;
  const slug = slugOf(parts);
  if (!isLocale(locale) || !slug) notFound();
  const page = await getPublishedPage(slug);
  if (!page) notFound();
  return (
    <SectionList
      sections={page.sections}
      ctx={{ locale, path: slug === "home" ? "/" : `/${slug}`, pageTitle: tr(page.title, locale, true), searchParams: await searchParams, isPreview: false }}
    />
  );
}
