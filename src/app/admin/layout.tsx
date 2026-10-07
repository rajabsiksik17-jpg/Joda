import type { Metadata } from "next";
import { Toaster } from "sonner";
import { fontVariables } from "../fonts";
import "../globals.css";
import { dirOf } from "@/lib/i18n/config";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { AdminI18nProvider } from "@/components/admin/i18n";

export const metadata: Metadata = {
  title: { default: "CMS — Quality Experts", template: "%s — CMS" },
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.ico" },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAdminLocale();
  return (
    <html lang={locale} dir={dirOf(locale)} className={fontVariables}>
      <body className="min-h-svh bg-surface text-ink antialiased [html[lang=ar]_&]:text-[0.95rem]">
        <AdminI18nProvider locale={locale}>
          {children}
          <Toaster position={locale === "ar" ? "bottom-left" : "bottom-right"} dir={dirOf(locale)} richColors closeButton toastOptions={{ className: "font-sans" }} />
        </AdminI18nProvider>
      </body>
    </html>
  );
}
