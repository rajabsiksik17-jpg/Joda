"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { siteDictionaries } from "@/lib/i18n/site-dictionary";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const segment = usePathname()?.split("/")[1];
  const dict = siteDictionaries[isLocale(segment) ? segment : "ar"];
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="theme-navy relative grid min-h-[70svh] place-items-center px-4 pt-28 pb-16 text-center">
      <div className="max-w-lg">
        <h1 className="display t-title text-white">{dict.errorTitle}</h1>
        <p className="mt-4 text-lg text-white/70">{dict.errorText}</p>
        {error.digest && <p className="mt-3 font-mono text-xs text-white/40" dir="ltr">Ref: {error.digest}</p>}
        <button type="button" onClick={reset} className="btn btn-primary mt-8">{dict.tryAgain}</button>
      </div>
    </section>
  );
}
