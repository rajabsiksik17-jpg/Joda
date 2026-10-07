import { locales, type Locale } from "./config";

/** A localized string as stored in the database: { ar: "...", en: "..." } */
export type L = Partial<Record<Locale, string>>;

export function isLocalized(value: unknown): value is L {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Resolves a localized value for a locale.
 * Falls back to the other language only when `fallback` is true (useful in admin listings);
 * public pages should generally show nothing rather than mixing languages.
 */
export function tr(value: unknown, locale: Locale, fallback = false): string {
  if (typeof value === "string") return value;
  if (!isLocalized(value)) return "";
  const direct = value[locale];
  if (direct && direct.trim()) return direct;
  if (!fallback) return "";
  for (const l of locales) {
    const v = value[l];
    if (v && v.trim()) return v;
  }
  return "";
}

export function hasLocale(value: unknown, locale: Locale): boolean {
  return tr(value, locale).trim().length > 0;
}

export function emptyL(): L {
  return { ar: "", en: "" };
}

export function l(ar: string, en: string): L {
  return { ar, en };
}
