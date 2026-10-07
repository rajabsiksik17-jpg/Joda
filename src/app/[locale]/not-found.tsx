"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import { siteDictionaries } from "@/lib/i18n/site-dictionary";

export default function NotFound() {
  const segment = usePathname()?.split("/")[1];
  const locale = isLocale(segment) ? segment : "ar";
  const dict = siteDictionaries[locale];
  return (
    <section className="theme-navy relative grid min-h-[80svh] place-items-center overflow-hidden px-4 pt-28 pb-16 text-center">
      <div className="grid-texture-dark absolute inset-0 opacity-60" aria-hidden />
      <div className="relative max-w-xl">
        <p className="display text-[clamp(6rem,4rem+10vw,11rem)] leading-none text-sky/90" dir="ltr">404</p>
        <h1 className="display t-title mt-4 text-white">{dict.notFoundTitle}</h1>
        <p className="mt-4 text-lg text-white/70">{dict.notFoundText}</p>
        <Link href={`/${locale}`} className="btn btn-primary mt-10">
          {dict.backHome}
          <ArrowRight className="btn-arrow size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
