"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n/config";

type Ctx = { locale: Locale; tx: (en: string, ar: string) => string };

const AdminI18n = createContext<Ctx>({ locale: "ar", tx: (_en, ar) => ar });

export function AdminI18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <AdminI18n.Provider value={{ locale, tx: (en, ar) => (locale === "ar" ? ar : en) }}>{children}</AdminI18n.Provider>;
}

/** Bilingual strings in admin client components: tx("Save", "حفظ"). */
export function useAdminI18n() {
  return useContext(AdminI18n);
}
