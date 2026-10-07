"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { setAdminLocaleAction } from "./actions";

export function AuthLocaleSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const target = locale === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await setAdminLocaleAction(target); router.refresh(); })}
      className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
      lang={target}
    >
      <Languages className="size-4" aria-hidden />
      {target === "ar" ? "العربية" : "English"}
    </button>
  );
}
