import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { absoluteUrl } from "@/lib/seo";
import { JsonLd } from "./json-ld";

export type Crumb = { label: string; href?: string };

/** Visible breadcrumb trail plus BreadcrumbList structured data. */
export function Breadcrumbs({ locale, items, dark = true }: { locale: Locale; items: Crumb[]; dark?: boolean }) {
  const dict = getSiteDictionary(locale);
  const all: Crumb[] = [{ label: dict.home, href: `/${locale}` }, ...items];
  return (
    <>
      <nav aria-label={dict.breadcrumb} className="mb-8">
        <ol className={`flex flex-wrap items-center gap-1.5 text-sm ${dark ? "text-white/60" : "text-muted"}`}>
          {all.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 opacity-60 rtl:-scale-x-100" aria-hidden />}
              {c.href && i < all.length - 1 ? (
                <Link href={c.href} className={dark ? "hover:text-white" : "hover:text-ink"}>{c.label}</Link>
              ) : (
                <span aria-current={i === all.length - 1 ? "page" : undefined} className={dark ? "text-white/90" : "text-ink"}>{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, ...(c.href ? { item: absoluteUrl(c.href) } : {}) })),
        }}
      />
    </>
  );
}
