import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { tr, type L } from "@/lib/i18n/localized";
import { isExternal, localizeHref } from "@/lib/links";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  text,
  locale,
  align = "start",
  as: Tag = "h2",
  className,
  size = "lg",
}: {
  eyebrow?: unknown;
  title?: unknown;
  text?: unknown;
  locale: Locale;
  align?: "start" | "center";
  as?: "h1" | "h2";
  className?: string;
  size?: "lg" | "xl";
}) {
  const e = tr(eyebrow, locale);
  const t = tr(title, locale);
  const x = tr(text, locale);
  if (!e && !t && !x) return null;
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)} data-reveal>
      {e && <p className={cn("eyebrow mb-5", align === "center" && "justify-center")}>{e}</p>}
      {t && (
        <Tag className={cn("display whitespace-pre-line", size === "xl" ? "t-page" : "t-section")}>{t}</Tag>
      )}
      {x && <p className="lede mt-6 whitespace-pre-line">{x}</p>}
    </div>
  );
}

type LinkValue = { label?: L; href?: string } | null | undefined;

/** Renders a CMS link value as a button. Renders nothing when label or href is missing. */
export function CtaLink({ value, locale, variant = "primary", className, arrow = true }: { value: LinkValue; locale: Locale; variant?: "primary" | "outline" | "navy" | "outline-light"; className?: string; arrow?: boolean }) {
  const label = tr(value?.label, locale);
  const href = value?.href;
  if (!label || !href) return null;
  const external = isExternal(href);
  const cls = cn("btn", `btn-${variant}`, className);
  const icon = external ? <ArrowUpRight className="size-4" aria-hidden /> : arrow ? <ArrowRight className="btn-arrow size-4" aria-hidden /> : null;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {label}
        {icon}
      </a>
    );
  }
  return (
    <Link href={localizeHref(locale, href)} className={cls}>
      {label}
      {icon}
    </Link>
  );
}

/** Splits multi-paragraph plain text (blank lines) into <p> elements. */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  );
}
