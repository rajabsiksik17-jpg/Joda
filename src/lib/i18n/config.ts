export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";
export const LOCALE_COOKIE = "qe_locale";

export const localeMeta: Record<Locale, { label: string; nativeLabel: string; dir: "rtl" | "ltr"; ogLocale: string }> = {
  ar: { label: "Arabic", nativeLabel: "العربية", dir: "rtl", ogLocale: "ar_JO" },
  en: { label: "English", nativeLabel: "English", dir: "ltr", ogLocale: "en_US" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function dirOf(locale: Locale) {
  return localeMeta[locale].dir;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

/** Picks the best supported locale from an Accept-Language header. */
export function matchAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}
