import "server-only";
import type { Metadata } from "next";
import { locales, localeMeta, type Locale } from "./i18n/config";
import { tr, type L } from "./i18n/localized";
import { getMedia } from "./media";
import { getSetting } from "./settings";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${siteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

type BuildInput = {
  locale: Locale;
  /** Path without locale prefix, e.g. "/services/governance" ("" for home) */
  path: string;
  title?: string;
  description?: string;
  /** Social sharing overrides (default to title/description) */
  ogTitle?: string;
  ogDescription?: string;
  ogImageId?: string | null;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  /** Locales in which this content exists (defaults to all) */
  availableLocales?: readonly Locale[];
  absoluteTitle?: boolean;
};

export async function buildMetadata(input: BuildInput): Promise<Metadata> {
  const [seo, brand, general] = await Promise.all([getSetting("seo"), getSetting("brand"), getSetting("general")]);
  const description = input.description || tr(seo.defaultDescription, input.locale);
  const ogMedia = (await getMedia(input.ogImageId)) ?? (await getMedia(brand.ogImageId));
  const ogImage = ogMedia && !ogMedia.isVideo ? { url: absoluteUrl(ogMedia.url), width: ogMedia.width ?? undefined, height: ogMedia.height ?? undefined } : { url: absoluteUrl("/brand/og-default.jpg"), width: 1200, height: 630 };
  const path = input.path === "/" ? "" : input.path;
  const available = input.availableLocales ?? locales;
  const languages: Record<string, string> = {};
  for (const l of available) languages[l] = `/${l}${path}`;
  if (available.includes("ar")) languages["x-default"] = `/ar${path}`;
  const siteName = tr(general.siteName, input.locale, true);

  return {
    title: input.title ? (input.absoluteTitle ? { absolute: input.title } : input.title) : undefined,
    description,
    alternates: { canonical: `/${input.locale}${path}`, languages },
    openGraph: {
      type: input.type ?? "website",
      title: input.ogTitle || input.title || siteName,
      description: input.ogDescription || description,
      url: `/${input.locale}${path}`,
      siteName,
      locale: localeMeta[input.locale].ogLocale,
      alternateLocale: available.filter((l) => l !== input.locale).map((l) => localeMeta[l].ogLocale),
      images: [ogImage],
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.ogTitle || input.title || siteName,
      description: input.ogDescription || description,
      images: [ogImage.url],
      ...(seo.twitterHandle ? { site: seo.twitterHandle } : {}),
    },
    robots: input.noindex || !seo.allowIndexing ? { index: false, follow: false } : undefined,
  };
}

export function seoText(value: L | undefined | null, locale: Locale) {
  return value ? tr(value, locale) : "";
}

export type SeoFields = { title?: L; description?: L; ogTitle?: L; ogDescription?: L; ogImageId?: string | null; noindex?: boolean };

/** Localized SEO values for buildMetadata, with sensible fallbacks. */
export function seoFor(seo: SeoFields | null | undefined, locale: Locale) {
  return {
    title: seo?.title ? tr(seo.title, locale) : "",
    description: seo?.description ? tr(seo.description, locale) : "",
    ogTitle: seo?.ogTitle ? tr(seo.ogTitle, locale) : "",
    ogDescription: seo?.ogDescription ? tr(seo.ogDescription, locale) : "",
    ogImageId: seo?.ogImageId ?? null,
    noindex: !!seo?.noindex,
  };
}
