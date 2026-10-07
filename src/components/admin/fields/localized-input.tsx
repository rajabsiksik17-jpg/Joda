"use client";

import { cn } from "@/lib/cn";
import { inputCls } from "../ui";
import { useAdminI18n } from "../i18n";

type L = { ar?: string; en?: string };

/**
 * Side-by-side Arabic and English inputs so editors always see both versions together.
 * Arabic is right-to-left, English left-to-right regardless of the admin language.
 */
export function LocalizedInput({
  id,
  value,
  onChange,
  multiline,
  rows = 3,
  max,
  invalid,
  placeholder,
}: {
  id: string;
  value: L | undefined;
  onChange: (v: L) => void;
  multiline?: boolean;
  rows?: number;
  max?: number;
  invalid?: boolean;
  placeholder?: { ar?: string; en?: string };
}) {
  const { tx } = useAdminI18n();
  const v = value ?? {};
  const langs = [
    { key: "ar" as const, label: "العربية", dir: "rtl" as const },
    { key: "en" as const, label: "English", dir: "ltr" as const },
  ];
  return (
    <div className="@container">
    <div className="grid gap-2 @md:grid-cols-2">
      {langs.map((lang) => {
        const val = v[lang.key] ?? "";
        const common = {
          id: `${id}-${lang.key}`,
          value: val,
          dir: lang.dir,
          lang: lang.key,
          maxLength: max,
          placeholder: placeholder?.[lang.key],
          "aria-invalid": invalid || undefined,
          "aria-label": `${lang.label}`,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...v, [lang.key]: e.target.value }),
        };
        return (
          <div key={lang.key} className="relative">
            <span className={cn("pointer-events-none absolute top-2 z-10 rounded bg-surface-2 px-1.5 py-0.5 text-[0.65rem] font-bold text-slate", lang.dir === "rtl" ? "left-2" : "right-2")}>
              {lang.key.toUpperCase()}
            </span>
            {multiline ? (
              <textarea {...common} rows={rows} className={cn(inputCls, "resize-y py-2 leading-relaxed", lang.dir === "rtl" ? "pl-10 font-[family-name:var(--font-tajawal)] text-[0.95rem]" : "pr-10")} />
            ) : (
              <input {...common} type="text" className={cn(inputCls, "h-10", lang.dir === "rtl" ? "pl-10 font-[family-name:var(--font-tajawal)] text-[0.95rem]" : "pr-10")} />
            )}
            {!val.trim() && (
              <span className="sr-only">{tx(`${lang.label} version is empty`, `النسخة ${lang.label} فارغة`)}</span>
            )}
          </div>
        );
      })}
    </div>
    </div>
  );
}
