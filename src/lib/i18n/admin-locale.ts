import "server-only";
import { cookies } from "next/headers";
import { isLocale, type Locale } from "./config";

export const ADMIN_LOCALE_COOKIE = "qe_admin_locale";

/** Admin interface language: explicit cookie choice, then Arabic. */
export async function getAdminLocale(): Promise<Locale> {
  const v = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : "ar";
}

/** Tiny bilingual helper for admin server components. */
export function makeTx(locale: Locale) {
  return (en: string, ar: string) => (locale === "ar" ? ar : en);
}
