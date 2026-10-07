import type { Locale } from "./i18n/config";

/** Prefixes internal paths with the locale; leaves external links and anchors untouched. */
export function localizeHref(locale: Locale, href: string | null | undefined): string {
  if (!href) return `/${locale}`;
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  if (!href.startsWith("/")) return href;
  if (href === "/") return `/${locale}`;
  if (/^\/(ar|en)(\/|$)/.test(href)) return href;
  return `/${locale}${href}`;
}

export function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

export function pagePath(slug: string) {
  return slug === "home" ? "/" : `/${slug}`;
}

export function channelHref(type: string, value: string, href?: string | null) {
  if (href) return href;
  const digits = value.replace(/[^\d+]/g, "");
  switch (type) {
    case "PHONE":
    case "FAX":
      return `tel:${digits}`;
    case "EMAIL":
      return `mailto:${value.trim()}`;
    case "WHATSAPP":
      return `https://wa.me/${digits.replace(/^\+/, "")}`;
    default:
      return null;
  }
}
