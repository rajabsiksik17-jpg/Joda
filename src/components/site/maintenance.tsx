import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import { NetworkGlobe } from "./network-globe";

export function MaintenanceScreen({ locale, title, message, logo }: { locale: Locale; title: string; message: string; logo: { url: string; width: number; height: number } }) {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-navy px-6 text-center text-white">
      <div className="grid-texture-dark absolute inset-0 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute inset-0 opacity-50"><NetworkGlobe className="size-full" mirrored={locale === "ar"} /></div>
      <div className="relative max-w-xl">
        <Image src={logo.url} alt="" width={logo.width} height={logo.height} className="mx-auto h-16 w-auto" priority />
        <h1 className="display t-section mt-12 text-white">{title}</h1>
        {message && <p className="mt-5 text-lg text-white/75">{message}</p>}
      </div>
    </main>
  );
}
