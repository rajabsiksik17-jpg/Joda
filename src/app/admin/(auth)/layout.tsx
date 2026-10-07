import Image from "next/image";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { NetworkGlobe } from "@/components/site/network-globe";
import { AuthLocaleSwitch } from "./locale-switch";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grid-texture-dark absolute inset-0 opacity-60" aria-hidden />
        <div className="pointer-events-none absolute inset-0 opacity-80"><NetworkGlobe className="size-full" mirrored={locale === "ar"} /></div>
        <Image src="/brand/logo-white.png" alt="Quality Consulting & Training" width={1000} height={342} className="relative h-14 w-auto self-start" priority />
        <div className="relative max-w-md">
          <p className="display text-4xl leading-tight text-white">{tx("Content management", "إدارة المحتوى")}</p>
          <p className="mt-4 text-white/70">{tx("Manage pages, services, insights and settings for the Quality Experts website.", "إدارة صفحات وخدمات ومقالات وإعدادات موقع خبراء الجودة.")}</p>
        </div>
      </aside>
      <main className="relative flex flex-col items-center justify-center bg-white px-5 py-12">
        <div className="absolute top-5 end-5"><AuthLocaleSwitch locale={locale} /></div>
        <div className="w-full max-w-sm">
          <Image src="/brand/logo-color.png" alt="Quality Consulting & Training" width={1000} height={342} className="mb-10 h-12 w-auto lg:hidden" priority />
          {children}
        </div>
      </main>
    </div>
  );
}
