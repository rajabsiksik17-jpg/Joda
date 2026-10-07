import type { Locale } from "./i18n/config";

const loc = (l: Locale) => (l === "ar" ? "ar-JO-u-nu-latn" : "en-GB");

export function formatDateTime(value: Date | string | null | undefined, locale: Locale) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(loc(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatDate(value: Date | string | null | undefined, locale: Locale) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(loc(locale), { dateStyle: "medium" }).format(new Date(value));
}

export function relativeTime(value: Date | string, locale: Locale) {
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(loc(locale), { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(value, locale);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
