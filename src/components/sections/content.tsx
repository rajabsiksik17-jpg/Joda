import Link from "next/link";
import { ArrowRight, Check, Plus } from "lucide-react";
import { tr, type L } from "@/lib/i18n/localized";
import { getFaqs } from "@/lib/content/collections";
import { getMedia } from "@/lib/media";
import { Icon, SocialIcon } from "@/lib/icons";
import { getSiteChrome } from "@/lib/content/site";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { isExternal, localizeHref } from "@/lib/links";
import { cn } from "@/lib/cn";
import { BrandMotif } from "../site/brand-motif";
import { JsonLd } from "../site/json-ld";
import { MediaImage } from "../site/media-image";
import { CtaLink, SectionHeading } from "../site/primitives";
import { SectionShell, type SectionProps } from "./shell";

type LinkV = { label?: L; href?: string };

// ───────────────────────── Text & media ─────────────────────────
type TextMediaData = { eyebrow?: L; title?: L; body?: L; bullets?: { text?: L }[]; visual?: string; image?: string | null; imagePosition?: string; cta?: LinkV; showSocial?: boolean };

export async function TextMediaSection({ data, settings, ctx }: SectionProps<TextMediaData>) {
  const { locale } = ctx;
  const image = data.visual === "image" ? await getMedia(data.image) : null;
  const body = tr(data.body, locale);
  const bullets = (data.bullets ?? []).map((b) => tr(b.text, locale)).filter(Boolean);
  const visual = data.visual ?? "network";
  const dark = settings.theme === "navy";
  const hasVisual = visual !== "none" && (visual !== "image" || !!image);
  const start = data.imagePosition === "start";
  const socials = data.showSocial ? (await getSiteChrome()).socials : [];
  const dict = getSiteDictionary(locale);

  return (
    <SectionShell settings={settings} className="overflow-hidden">
      <div className={cn("container-qe grid items-center gap-14 lg:gap-20", hasVisual && "lg:grid-cols-12")}>
        <div className={cn(hasVisual ? "lg:col-span-6" : "max-w-3xl", start && hasVisual && "lg:order-2")}>
          <SectionHeading eyebrow={data.eyebrow} title={data.title} locale={locale} />
          {body && <div className="prose-qe mt-7" data-reveal dangerouslySetInnerHTML={{ __html: body }} />}
          {bullets.length > 0 && (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2" data-reveal>
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-tech/10 text-tech-600"><Check className="size-3.5" aria-hidden /></span>
                  <span className={dark ? "text-white/85" : "text-ink"}>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {data.cta?.href && (
            <div className="mt-10" data-reveal>
              <CtaLink value={data.cta} locale={locale} variant={dark ? "outline-light" : "outline"} />
            </div>
          )}
          {socials.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-4" data-reveal>
              <span className={cn("text-sm font-medium", dark ? "text-white/70" : "text-muted")}>{dict.followUs}</span>
              <span className={cn("h-px w-8", dark ? "bg-white/25" : "bg-line-strong")} aria-hidden />
              <ul className="flex flex-wrap gap-1">
                {socials.map((so) => (
                  <li key={so.id}>
                    <a href={so.url} target="_blank" rel="noopener noreferrer" aria-label={so.label || so.platform} className={cn("grid size-9 place-items-center rounded-full transition-colors", dark ? "text-white/75 hover:bg-white/10 hover:text-white" : "text-muted hover:bg-sky-50 hover:text-tech-600")}>
                      <SocialIcon platform={so.platform} className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {hasVisual && (
          <div className={cn("relative lg:col-span-6", start && "lg:order-1", visual === "image" ? "max-lg:order-first" : "max-md:hidden")} data-reveal="scale">
            {visual === "image" && image ? (
              <div className="relative">
                <div className="absolute -inset-3 translate-x-6 translate-y-6 border border-tech/40 rtl:-translate-x-6" aria-hidden />
                <div className="relative aspect-[4/5] overflow-hidden bg-surface sm:aspect-[5/4]">
                  <MediaImage asset={image} locale={locale} fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
                </div>
                <div className="absolute -bottom-5 size-16 bg-tech-600 ltr:-left-5 rtl:-right-5" aria-hidden />
              </div>
            ) : visual === "squares" ? (
              <div className="relative mx-auto max-w-lg">
                <BrandMotif variant="squares" className="shadow-lift" />
              </div>
            ) : (
              <div className="relative mx-auto max-w-lg">
                <div className="absolute inset-[12%] rounded-full bg-sky/15 blur-3xl" aria-hidden />
                <BrandMotif variant="network" dark={dark} className="relative" />
              </div>
            )}
          </div>
        )}
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Rich text ─────────────────────────
export function RichTextSection({ data, settings, ctx }: SectionProps<{ title?: L; body?: L; width?: string }>) {
  const body = tr(data.body, ctx.locale);
  if (!body) return null;
  return (
    <SectionShell settings={settings}>
      <div className={cn("container-qe", data.width === "wide" ? "max-w-6xl" : "max-w-[50rem]")}>
        {tr(data.title, ctx.locale) && <h2 className="display t-title mb-8">{tr(data.title, ctx.locale)}</h2>}
        <div className="prose-qe" dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Statement (vision / quote) ─────────────────────────
export function StatementSection({ data, settings, ctx }: SectionProps<{ eyebrow?: L; text?: L; attribution?: L; showMotif?: boolean }>) {
  const text = tr(data.text, ctx.locale);
  if (!text) return null;
  const dark = (settings.theme ?? "default") === "navy";
  return (
    <SectionShell settings={settings} className="overflow-hidden">
      {data.showMotif && (
        <div className="pointer-events-none absolute top-1/2 end-[-12rem] hidden w-[34rem] -translate-y-1/2 opacity-60 lg:block" aria-hidden>
          <BrandMotif variant="network" dark={dark} />
        </div>
      )}
      <div className="container-qe relative">
        <figure className="max-w-4xl" data-reveal>
          {tr(data.eyebrow, ctx.locale) && <p className="eyebrow mb-8">{tr(data.eyebrow, ctx.locale)}</p>}
          <blockquote>
            <p className={cn("display t-statement", dark ? "text-white" : "text-ink")}>
              <span className="text-sky" aria-hidden>“</span>
              {text}
              <span className="text-sky" aria-hidden>”</span>
            </p>
          </blockquote>
          {tr(data.attribution, ctx.locale) && <figcaption className={cn("mt-8 text-lg", dark ? "text-white/70" : "text-muted")}>— {tr(data.attribution, ctx.locale)}</figcaption>}
        </figure>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Feature cards ─────────────────────────
type CardsData = { eyebrow?: L; title?: L; text?: L; columns?: string; style?: string; items?: { icon?: string; title?: L; text?: L; link?: LinkV }[] };

export function CardsSection({ data, settings, ctx }: SectionProps<CardsData>) {
  const { locale } = ctx;
  const items = (data.items ?? []).filter((i) => tr(i.title, locale));
  if (!items.length) return null;
  const cols = { "2": "md:grid-cols-2", "3": "md:grid-cols-2 lg:grid-cols-3", "4": "md:grid-cols-2 lg:grid-cols-4" }[data.columns ?? "3"] ?? "lg:grid-cols-3";
  const dark = settings.theme === "navy";
  // Short cards (values, pillars) pair up on phones instead of stacking into a long column.
  const compact = items.length > 2 && items.every((i) => tr(i.text, locale).length <= 90 && !i.link?.href);
  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
        <div className={cn("mt-9 lg:mt-14 grid gap-px", compact && "max-md:grid-cols-2 max-md:gap-2.5", cols, data.style === "outline" ? (dark ? "bg-white/10" : "bg-line") : "gap-4 bg-transparent lg:gap-5")}>
          {items.map((item, i) => {
            const href = item.link?.href;
            const inner = (
              <>
                {data.style === "numbered" ? (
                  <>
                    {/* Large watermark number and a soft corner glow give each value its own presence. */}
                    <span className={cn("pointer-events-none absolute end-4 top-3 font-[family-name:var(--font-inter)] text-[3.25rem] leading-none font-extrabold tracking-tighter select-none sm:end-6 sm:top-5 sm:text-[5rem]", dark ? "text-white/[0.05]" : "text-navy/[0.06]")} aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                    <span className="pointer-events-none absolute -bottom-20 -start-20 size-44 rounded-full bg-sky/10 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" aria-hidden />
                    <span className="relative flex items-center gap-3">
                      {item.icon && (
                        <span className={cn("size-11 rounded-sm sm:size-14", dark ? "grid place-items-center bg-white/10 text-sky ring-1 ring-white/15" : "icon-tile")}>
                          <Icon name={item.icon} className="size-5 sm:size-6" strokeWidth={1.75} />
                        </span>
                      )}
                      <span className={cn("hidden font-mono text-xs sm:inline", dark ? "text-sky/80" : "text-tech-600")} dir="ltr">{String(i + 1).padStart(2, "0")} —</span>
                    </span>
                  </>
                ) : (
                  <span className={cn("grid size-12 place-items-center rounded-sm", dark ? "bg-white/10 text-sky" : "bg-sky-50 text-tech-600")}>
                    <Icon name={item.icon} className="size-6" />
                  </span>
                )}
                <h3 className={cn("heading relative t-card", compact ? "mt-4 sm:mt-7" : "mt-6", data.style === "numbered" && "sm:text-[1.3rem]")}>{tr(item.title, locale)}</h3>
                {tr(item.text, locale) && <p className={cn("relative leading-relaxed", compact ? "mt-1.5 text-sm sm:mt-2.5 sm:text-base" : "mt-3", dark ? "text-white/70" : "text-body")}>{tr(item.text, locale)}</p>}
                {data.style === "numbered" && <span className={cn("relative mt-auto hidden pt-6 sm:block")} aria-hidden><span className={cn("block h-px w-10 transition-all duration-500 group-hover:w-20", dark ? "bg-sky/60" : "bg-tech-600/60")} /></span>}
                {href && tr(item.link?.label, locale) && (
                  <span className="mt-6 inline-flex items-center gap-2 font-semibold text-tech-600">
                    {tr(item.link?.label, locale)}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
                  </span>
                )}
              </>
            );
            const cls = cn(
              "group relative flex flex-col transition-all",
              compact ? "p-4 sm:p-8 lg:p-10" : "p-6 sm:p-8 lg:p-10",
              data.style === "filled"
                ? dark ? "bg-white/5 hover:bg-white/10" : "bg-surface hover:bg-surface-2"
                : data.style === "numbered"
                  ? cn("card-premium", dark && "!border-white/10 !bg-white/[0.04]")
                  : dark ? "bg-navy hover:bg-navy-800" : "bg-white hover:bg-sky-50/60",
            );
            return (
              <div key={i} data-reveal style={{ "--reveal-delay": `${(i % 4) * 70}ms` } as React.CSSProperties}>
                {href ? (
                  isExternal(href) ? <a href={href} target="_blank" rel="noopener noreferrer" className={cn(cls, "h-full")}>{inner}</a> : <Link href={localizeHref(locale, href)} className={cn(cls, "h-full")}>{inner}</Link>
                ) : (
                  <div className={cn(cls, "h-full")}>{inner}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Process / timeline ─────────────────────────
type ProcessData = { eyebrow?: L; title?: L; text?: L; layout?: string; steps?: { marker?: string; title?: L; text?: L }[] };

export function ProcessSection({ data, settings, ctx }: SectionProps<ProcessData>) {
  const { locale } = ctx;
  const steps = (data.steps ?? []).filter((s) => tr(s.title, locale));
  if (!steps.length) return null;
  const dark = settings.theme === "navy";

  if (data.layout === "timeline") {
    return (
      <SectionShell settings={settings}>
        <div className="container-qe grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
            </div>
          </div>
          <ol className="relative lg:col-span-7">
            <span className={cn("absolute top-2 bottom-2 w-px start-[7px]", dark ? "bg-white/15" : "bg-line-strong")} aria-hidden />
            {steps.map((s, i) => (
              <li key={i} className="relative ps-12 pb-12 last:pb-0" data-reveal>
                <span className="absolute top-1.5 start-0 size-[15px] rounded-full border-[3px] border-tech bg-white" aria-hidden />
                {s.marker && <p className="mb-2 font-semibold text-tech-600" dir="ltr">{s.marker}</p>}
                <h3 className="heading text-xl">{tr(s.title, locale)}</h3>
                {tr(s.text, locale) && <p className={cn("mt-2 leading-relaxed", dark ? "text-white/70" : "")}>{tr(s.text, locale)}</p>}
              </li>
            ))}
          </ol>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell settings={settings} className="overflow-hidden">
      {dark && <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-50" />}
      <div className="container-qe relative">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
        <ol className={cn("mt-10 lg:mt-16 grid gap-px sm:grid-cols-2", steps.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3", dark ? "bg-white/10" : "bg-line")}>
          {steps.map((s, i) => (
            <li key={i} className={cn("group relative grid grid-cols-[auto_1fr] gap-x-4 p-5 sm:flex sm:flex-col sm:p-8 lg:p-9", dark ? "bg-navy" : "bg-white")} data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}>
              <div className="row-span-2 flex items-center gap-4 self-start">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tech-600 font-bold text-white transition-transform duration-500 group-hover:scale-110 sm:size-12 sm:text-lg" dir="ltr">
                  {s.marker || i + 1}
                </span>
                {i < steps.length - 1 && <span className={cn("hidden h-px flex-1 lg:block", dark ? "bg-gradient-to-r from-sky/60 to-transparent rtl:bg-gradient-to-l" : "bg-gradient-to-r from-tech/50 to-transparent rtl:bg-gradient-to-l")} aria-hidden />}
              </div>
              <h3 className="heading t-card self-center sm:mt-7">{tr(s.title, locale)}</h3>
              {tr(s.text, locale) && <p className={cn("mt-1.5 text-[0.95rem] leading-relaxed sm:mt-3 sm:text-base", dark ? "text-white/70" : "text-body")}>{tr(s.text, locale)}</p>}
            </li>
          ))}
        </ol>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── FAQ ─────────────────────────
type FaqData = { eyebrow?: L; title?: L; text?: L; source?: string; group?: string; serviceId?: string; items?: { question?: L; answer?: L }[] };

export async function FaqSection({ data, settings, ctx }: SectionProps<FaqData>) {
  const { locale } = ctx;
  const raw = data.source === "inline" ? (data.items ?? []).map((i, idx) => ({ id: String(idx), question: i.question, answer: i.answer })) : await getFaqs(data.group || null, data.serviceId || null);
  const items = raw.map((f) => ({ id: f.id, q: tr(f.question, locale), a: tr(f.answer, locale) })).filter((f) => f.q && f.a);
  if (!items.length) return null;
  return (
    <SectionShell settings={settings}>
      <div className="container-qe grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
        </div>
        <div className="divide-y divide-line border-y border-line lg:col-span-8">
          {items.map((f) => (
            <details key={f.id} className="group" data-reveal>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-start [&::-webkit-details-marker]:hidden">
                <span className="heading text-lg text-ink">{f.q}</span>
                <Plus className="mt-1 size-5 shrink-0 text-tech-600 transition-transform duration-300 group-open:rotate-45" aria-hidden />
              </summary>
              <div className="pb-6 leading-relaxed whitespace-pre-line text-body">{f.a}</div>
            </details>
          ))}
        </div>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
    </SectionShell>
  );
}
