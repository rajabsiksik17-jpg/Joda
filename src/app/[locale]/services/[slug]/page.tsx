import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowRight, Check, LayoutGrid, ListChecks, Route } from "lucide-react";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { getFaqs, getService, getServices, type ServiceView } from "@/lib/content/collections";
import { postsForService } from "@/lib/content/posts";
import { PostCard } from "@/components/site/post-card";
import { getMedia } from "@/lib/media";
import { Icon } from "@/lib/icons";
import { absoluteUrl, buildMetadata, seoFor } from "@/lib/seo";
import { getSetting } from "@/lib/settings";
import { cn } from "@/lib/cn";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { MediaImage } from "@/components/site/media-image";
import { FaqSection } from "@/components/sections/content";
import { ServiceVisual } from "@/components/services/service-visual";
import { ServiceSubnav } from "@/components/services/service-subnav";
import { CapabilityTabs } from "@/components/services/capability-tabs";

type Params = Promise<{ locale: string; slug: string }>;
type Group = { title: string; text: string; items: string[] };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const service = await getService(slug);
  if (!service || !tr(service.title, locale)) return {};
  const seo = seoFor(service.seo, locale);
  return buildMetadata({
    locale,
    path: `/services/${slug}`,
    title: seo.title || tr(service.title, locale),
    description: seo.description || tr(service.summary, locale) || tr(service.description, locale).slice(0, 300),
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImageId: seo.ogImageId ?? service.imageId,
    noindex: seo.noindex,
  });
}

// ───────────────────────── Capability layouts ─────────────────────────

function NumberedGrid({ groups }: { groups: Group[] }) {
  const all = groups.flatMap((g) => g.items);
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {all.map((item, i) => (
        <li key={item} data-reveal style={{ "--reveal-delay": `${(i % 3) * 80}ms` } as React.CSSProperties} className="group relative overflow-hidden rounded-sm border border-line bg-white p-7 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-tech-600/50 hover:shadow-lift">
          <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-tech-600 transition-transform duration-500 group-hover:scale-x-100 rtl:origin-right" aria-hidden />
          <span className="display t-title text-tech-600/80" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
          <p className="mt-4 leading-relaxed font-semibold text-ink">{item}</p>
        </li>
      ))}
    </ol>
  );
}

function Matrix({ groups }: { groups: Group[] }) {
  return (
    <div className={cn("grid gap-5 md:grid-cols-2", groups.length >= 3 && "xl:grid-cols-3")}>
      {groups.map((g, gi) => (
        <section key={g.title} data-reveal style={{ "--reveal-delay": `${gi * 90}ms` } as React.CSSProperties} className="flex flex-col overflow-hidden rounded-sm border border-line bg-white">
          <header className="flex items-center justify-between gap-4 bg-navy px-6 py-5 text-white">
            <h3 className="heading text-lg text-white">{g.title}</h3>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-sm text-sky" dir="ltr">{g.items.length}</span>
          </header>
          {g.text && <p className="border-b border-line px-6 py-4 text-body">{g.text}</p>}
          <ul className="flex-1 divide-y divide-line">
            {g.items.map((item) => (
              <li key={item} className="flex gap-3 px-6 py-4 transition-colors hover:bg-sky-50/60">
                <Check className="mt-1 size-4 shrink-0 text-tech-600" aria-hidden />
                <span className="leading-relaxed text-ink">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Timeline({ groups }: { groups: Group[] }) {
  // With a single group, each capability becomes a stage of its own.
  const stages = groups.length === 1 ? groups[0].items.map((i) => ({ title: i, text: "", items: [] as string[] })) : groups;
  return (
    <ol className="relative mx-auto max-w-4xl">
      <span className="absolute top-3 bottom-3 start-[1.15rem] w-px bg-gradient-to-b from-tech-600 via-line-strong to-transparent sm:start-1/2" aria-hidden />
      {stages.map((g, i) => (
        <li key={g.title} data-reveal className={cn("relative grid gap-4 pb-10 ps-14 last:pb-0 sm:grid-cols-2 sm:gap-14 sm:ps-0")}>
          <span className="absolute top-1 start-0 z-10 grid size-[2.3rem] place-items-center rounded-full border-4 border-white bg-tech-600 font-mono text-xs font-bold text-white shadow-soft sm:start-1/2 sm:-translate-x-1/2 rtl:sm:translate-x-1/2" dir="ltr">{i + 1}</span>
          <div className={cn("rounded-sm border border-line bg-white p-6 shadow-soft", i % 2 ? "sm:col-start-2" : "sm:text-end")}>
            <h3 className="heading text-lg text-ink">{g.title}</h3>
            {g.text && <p className="mt-2 text-body">{g.text}</p>}
            {g.items.length > 0 && (
              <ul className={cn("mt-4 flex flex-wrap gap-2", !(i % 2) && "sm:justify-end")}>
                {g.items.map((it) => <li key={it} className="rounded-full bg-surface px-3 py-1.5 text-sm text-ink">{it}</li>)}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Standards({ groups }: { groups: Group[] }) {
  const [certs, ...rest] = groups;
  const parse = (s: string) => {
    const m = s.match(/ISO(?:\/IEC)?\s*\d+/);
    return { code: m?.[0] ?? "", name: s.replace(/\s*[—–-]\s*ISO(?:\/IEC)?\s*\d+\s*$/, "").trim() };
  };
  return (
    <div className="space-y-12">
      <div>
        <h3 className="heading mb-6 text-xl text-ink" data-reveal>{certs.title}</h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {certs.items.map((item, i) => {
            const { code, name } = parse(item);
            return (
              <li key={item} data-reveal style={{ "--reveal-delay": `${(i % 4) * 60}ms` } as React.CSSProperties} className="group relative overflow-hidden rounded-sm border border-line bg-white p-5 transition-all duration-500 hover:-translate-y-1 hover:border-navy hover:bg-navy">
                <span className="pointer-events-none absolute -end-6 -top-6 size-20 rounded-full border border-tech-600/20 transition-colors group-hover:border-sky/40" aria-hidden />
                <p className="font-mono text-lg font-bold text-tech-600 transition-colors group-hover:text-sky" dir="ltr">{code || "ISO"}</p>
                <p className="mt-2 text-sm leading-snug font-medium text-ink transition-colors group-hover:text-white">{name || item}</p>
              </li>
            );
          })}
        </ul>
      </div>
      {rest.map((g) => (
        <div key={g.title} className="grid gap-8 overflow-hidden rounded-sm bg-navy p-8 text-white lg:grid-cols-12 lg:p-12" data-reveal>
          <div className="lg:col-span-5">
            <h3 className="display t-title text-white">{g.title}</h3>
            {g.text && <p className="mt-4 leading-relaxed text-white/75">{g.text}</p>}
          </div>
          <ul className="grid gap-3 lg:col-span-7">
            {g.items.map((it, i) => (
              <li key={it} className="flex items-start gap-4 rounded-sm border border-white/10 bg-white/5 p-4">
                <span className="font-mono text-sm text-sky" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-white/90">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Capabilities({ layout, groups }: { layout: string; groups: Group[] }) {
  if (layout === "standards" && groups.length) return <Standards groups={groups} />;
  if (layout === "tabs" && groups.length > 1) return <CapabilityTabs groups={groups} />;
  if (layout === "matrix" && groups.length > 1) return <Matrix groups={groups} />;
  if (layout === "timeline") return <Timeline groups={groups} />;
  return <NumberedGrid groups={groups} />;
}

// ───────────────────────── Page ─────────────────────────

export default async function ServicePage({ params }: { params: Params }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const [service, all, general] = await Promise.all([getService(slug), getServices(), getSetting("general")]);
  if (!service || !tr(service.title, locale)) notFound();

  const dict = getSiteDictionary(locale);
  const index = all.findIndex((s) => s.id === service.id);
  const number = String(index + 1).padStart(2, "0");
  const total = String(all.length).padStart(2, "0");
  const title = tr(service.title, locale);
  const summary = tr(service.summary, locale);
  const description = tr(service.description, locale);
  const why = tr(service.whyItMatters, locale);
  const [image, faqs, insights] = await Promise.all([getMedia(service.imageId), getFaqs(null, service.id), postsForService(service.id, locale)]);
  const groups: Group[] = service.capabilities
    .map((g) => ({ title: tr(g.title, locale), text: tr(g.text, locale), items: g.items.map((i) => tr(i, locale)).filter(Boolean) }))
    .filter((g) => g.items.length);
  const steps = service.steps.map((s) => ({ title: tr(s.title, locale), text: tr(s.text, locale) })).filter((s) => s.title);
  const outcomes = service.outcomes.map((o) => ({ icon: o.icon, title: tr(o.title, locale), text: tr(o.text, locale) })).filter((o) => o.title);
  const capabilityCount = groups.reduce((n, g) => n + g.items.length, 0);
  const facts = [
    capabilityCount > 0 && { label: dict.capabilities, value: capabilityCount, icon: ListChecks },
    groups.length > 1 && { label: dict.areas, value: groups.length, icon: LayoutGrid },
    steps.length > 0 && { label: dict.stages, value: steps.length, icon: Route },
  ].filter((f): f is { label: string; value: number; icon: typeof Route } => !!f);
  const related = service.relatedIds.map((id) => all.find((s) => s.id === id)).filter((s): s is ServiceView => !!s && !!tr(s.title, locale)).slice(0, 3);
  const consultHref = `/${locale}/consultation?service=${encodeURIComponent(slug)}`;
  const prev = all[(index - 1 + all.length) % all.length];
  const next = all[(index + 1) % all.length];

  const nav = [
    { id: "overview", label: dict.overview },
    ...(outcomes.length ? [{ id: "outcomes", label: dict.whatItDelivers }] : []),
    ...(groups.length ? [{ id: "capabilities", label: dict.capabilities }] : []),
    ...(steps.length ? [{ id: "approach", label: dict.theJourney }] : []),
    ...(faqs.length ? [{ id: "faq", label: dict.faq }] : []),
  ];

  return (
    <>
      {/* ── Hero ── */}
      <section className="theme-navy relative overflow-hidden">
        <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="pointer-events-none absolute -top-32 end-[-10%] size-[42rem] rounded-full bg-tech/25 blur-[140px]" />
        <div className="container-qe relative grid items-center gap-10 pt-32 pb-14 lg:grid-cols-12 lg:pt-40 lg:pb-20">
          <div className="lg:col-span-7">
            <Breadcrumbs locale={locale} items={[{ label: dict.services, href: `/${locale}/services` }, { label: title }]} />
            <p className="eyebrow mb-6 animate-fade-up">
              <span dir="ltr">{dict.serviceNumber} {number} / {total}</span>
              {service.category && <span className="text-white/55">· {tr(service.category.name, locale, true)}</span>}
            </p>
            <h1 className="display t-page text-white animate-fade-up [animation-delay:60ms]">{title}</h1>
            {summary && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75 animate-fade-up [animation-delay:120ms] sm:text-xl">{summary}</p>}
            <div className="mt-9 flex flex-wrap gap-3 animate-fade-up [animation-delay:180ms]">
              <Link href={consultHref} className="btn btn-primary">
                {tr(service.ctaLabel, locale) || dict.requestConsultation}
                <ArrowRight className="btn-arrow size-4" aria-hidden />
              </Link>
              {groups.length > 0 && (
                <a href="#capabilities" className="btn btn-outline-light">
                  {dict.capabilities}
                  <ArrowDown className="size-4" aria-hidden />
                </a>
              )}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[15rem] sm:max-w-sm lg:col-span-5 lg:max-w-none" aria-hidden>
            <ServiceVisual visual={service.visual} slug={slug} className="animate-fade-up [animation-delay:150ms]" />
            <span className="pointer-events-none absolute end-0 bottom-2 grid size-11 place-items-center rounded-sm bg-tech-600 text-white shadow-lift sm:end-2 sm:bottom-4 sm:size-14"><Icon name={service.icon} className="size-5 sm:size-7" strokeWidth={1.5} /></span>
          </div>
          {facts.length > 0 && (
            <dl className={cn("mx-auto grid w-full max-w-3xl divide-x divide-white/10 overflow-hidden rounded-sm border border-white/10 bg-white/[0.04] backdrop-blur-sm animate-fade-up [animation-delay:240ms] rtl:divide-x-reverse lg:col-span-12 lg:mt-4", facts.length === 3 ? "grid-cols-3" : facts.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
              {facts.map((f) => (
                <div key={f.label} className="group relative flex flex-col items-center px-3 py-5 text-center transition-colors hover:bg-white/[0.04] sm:py-6">
                  <span className="absolute inset-x-0 top-0 mx-auto h-0.5 w-0 bg-sky transition-[width] duration-500 group-hover:w-1/2" aria-hidden />
                  <f.icon className="mb-2 size-4 text-sky/80" aria-hidden />
                  <dt className="order-last mt-2 text-xs text-white/60 sm:text-sm">{f.label}</dt>
                  <dd className="display text-[1.75rem] leading-none text-white sm:text-[2.1rem]" dir="ltr">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <ServiceSubnav items={nav} label={dict.onThisPage} />

      {/* ── Overview & why it matters ── */}
      <section id="overview" className="section-y scroll-mt-32">
        <div className="container-qe grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7" data-reveal>
            <p className="eyebrow mb-5">{dict.overview}</p>
            <p className="border-s-2 border-tech-600 ps-5 text-[1.05rem] leading-[1.95] font-medium text-ink/85 sm:ps-6 sm:text-[1.15rem] lg:text-[1.2rem]">{description}</p>
          </div>
          <aside className="space-y-6 lg:col-span-5">
            {why && (
              <div className="relative overflow-hidden rounded-sm bg-surface p-8" data-reveal>
                <span className="absolute inset-y-0 start-0 w-1 bg-tech-600" aria-hidden />
                <p className="heading text-lg text-ink">{dict.whyItMatters}</p>
                <p className="mt-3 leading-relaxed text-body">{why}</p>
              </div>
            )}
            {image && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm" data-reveal="scale">
                <MediaImage asset={image} locale={locale} fill sizes="(min-width:1024px) 34vw, 100vw" className="object-cover" />
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ── Outcomes ── */}
      {outcomes.length > 0 && (
        <section id="outcomes" className="theme-muted section-y scroll-mt-32">
          <div className="container-qe">
            <div className="max-w-2xl" data-reveal>
              <p className="eyebrow mb-5">{dict.whatItDelivers}</p>
              <h2 className="display t-section">{dict.outcomesTitle}</h2>
            </div>
            <ul className={cn("mt-12 grid gap-5 sm:grid-cols-2", outcomes.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4")}>
              {outcomes.map((o, i) => (
                <li key={o.title} data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties} className="group relative flex flex-col rounded-sm bg-white p-7 shadow-soft transition-transform duration-500 hover:-translate-y-1">
                  <span className="grid size-12 place-items-center rounded-sm bg-navy text-sky transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"><Icon name={o.icon} className="size-6" /></span>
                  <h3 className="heading t-card mt-6 text-ink">{o.title}</h3>
                  {o.text && <p className="mt-2 leading-relaxed text-body">{o.text}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Capabilities ── */}
      {groups.length > 0 && (
        <section id="capabilities" className="section-y scroll-mt-32">
          <div className="container-qe">
            <div className="mb-8 lg:mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end" data-reveal>
              <div className="max-w-2xl">
                <p className="eyebrow mb-5">{dict.capabilities}</p>
                <h2 className="display t-section">{groups.length === 1 ? groups[0].title : dict.scopeTitle}</h2>
              </div>
              <p className="font-mono text-sm text-muted" dir="ltr">{String(capabilityCount).padStart(2, "0")} — {title}</p>
            </div>
            <Capabilities layout={service.capabilityLayout} groups={groups} />
          </div>
        </section>
      )}

      {/* ── Approach ── */}
      {steps.length > 0 && (
        <section id="approach" className="theme-navy section-y relative scroll-mt-32 overflow-hidden">
          <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-50" />
          <div className="container-qe relative">
            <div className="max-w-2xl" data-reveal>
              <p className="eyebrow mb-5">{dict.theJourney}</p>
              <h2 className="display t-section text-white">{dict.approachTitle}</h2>
            </div>
            <ol className={cn("relative mt-9 lg:mt-14 grid gap-7 sm:grid-cols-2 sm:gap-10 lg:gap-6", steps.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
              <span className="absolute top-6 hidden h-px w-full bg-gradient-to-r from-sky/70 via-white/15 to-transparent lg:block rtl:bg-gradient-to-l" aria-hidden />
              {steps.map((s, i) => (
                <li key={i} className="group relative" data-reveal style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties}>
                  <span className="relative grid size-12 place-items-center rounded-full bg-tech-600 text-lg font-bold text-white ring-8 ring-navy transition-transform duration-500 group-hover:scale-110" dir="ltr">{i + 1}</span>
                  <h3 className="heading t-card mt-6 text-white">{s.title}</h3>
                  {s.text && <p className="mt-2 leading-relaxed text-white/70">{s.text}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <div id="faq" className="scroll-mt-32">
          <FaqSection data={{ source: "library", serviceId: service.id, title: { [locale]: dict.faq } }} settings={{}} ctx={{ locale, path: `/services/${slug}`, pageTitle: title, searchParams: {}, isPreview: false, index: 9 }} />
        </div>
      )}

      {/* ── Consultation CTA ── */}
      <section className="section-y-compact">
        <div className="container-qe">
          <div className="relative grid overflow-hidden rounded-sm bg-navy text-white lg:grid-cols-12" data-reveal>
            <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative p-8 sm:p-12 lg:col-span-8">
              <p className="eyebrow mb-4">{title}</p>
              <h2 className="display t-section text-white">{dict.serviceCtaTitle}</h2>
              <p className="mt-4 max-w-xl text-white/75">{dict.discussServiceText}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={consultHref} className="btn btn-primary">{dict.requestConsultation}<ArrowRight className="btn-arrow size-4" aria-hidden /></Link>
                <Link href={`/${locale}/contact`} className="btn btn-outline-light">{dict.contactUs}</Link>
              </div>
            </div>
            <div className="relative hidden items-center justify-center p-8 lg:col-span-4 lg:flex" aria-hidden>
              <span className="grid size-28 place-items-center rounded-full border border-white/15 bg-white/5"><Icon name={service.icon} className="size-12 text-sky" strokeWidth={1.4} /></span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Related & next ── */}
      {insights.length > 0 && (
        <section className="theme-muted section-y-compact" aria-labelledby="service-insights">
          <div className="container-qe">
            <div className="mb-8 flex items-end justify-between gap-6" data-reveal>
              <h2 id="service-insights" className="display t-title">{dict.relatedInsights}</h2>
              <Link href={`/${locale}/insights`} className="hidden items-center gap-2 font-semibold text-tech-600 hover:text-tech-700 sm:inline-flex">{dict.allInsights}<ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden /></Link>
            </div>
            <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {insights.map((p) => <PostCard key={p.id} post={p} locale={locale} readLabel={dict.readArticle} />)}
            </div>
          </div>
        </section>
      )}

      <section className="section-y-compact pb-16 sm:pb-24">
        <div className="container-qe">
          {related.length > 0 && (
            <>
              <div className="mb-8 flex items-end justify-between gap-6" data-reveal>
                <h2 className="display t-title">{dict.relatedServices}</h2>
                <Link href={`/${locale}/services`} className="hidden items-center gap-2 font-semibold text-tech-600 hover:text-tech-700 sm:inline-flex">{dict.allServices}<ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden /></Link>
              </div>
              <ul className="grid gap-3 sm:gap-5 md:grid-cols-3">
                {related.map((r) => (
                  <li key={r.id} data-reveal>
                    <Link href={`/${locale}/services/${r.slug}`} className="group flex h-full overflow-hidden rounded-sm border border-line bg-white transition-[border-color,box-shadow] duration-500 hover:border-tech-600/60 hover:shadow-lift md:flex-col">
                      <div className="relative w-24 shrink-0 overflow-hidden bg-navy md:h-40 md:w-auto">
                        <ServiceVisual visual={r.visual} slug={r.slug} className="absolute inset-x-1 top-1/2 -translate-y-1/2 opacity-80 transition-transform duration-700 group-hover:scale-105 md:inset-x-8 md:-top-6 md:translate-y-0" />
                      </div>
                      <div className="flex flex-1 flex-col p-4 md:p-6">
                        <h3 className="heading t-card text-ink">{tr(r.title, locale)}</h3>
                        <p className="mt-1.5 line-clamp-2 flex-1 text-[0.95rem] leading-relaxed text-body md:mt-2 md:line-clamp-3 md:text-base">{tr(r.summary, locale)}</p>
                        <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-tech-600 md:mt-5">{dict.exploreService}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden /></span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {all.length > 1 && (
            <nav aria-label={dict.otherServices} className="mt-12 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
              {[prev, next].map((s, i) => (
                <Link key={`${s.id}-${i}`} href={`/${locale}/services/${s.slug}`} className={cn("group flex items-center gap-4 rounded-sm p-4 transition-colors hover:bg-surface", i === 1 && "sm:flex-row-reverse sm:text-end")}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong text-ink transition-colors group-hover:border-navy group-hover:bg-navy group-hover:text-white">
                    <ArrowRight className={cn("size-4", i === 0 ? "rotate-180 rtl:rotate-0" : "rtl:rotate-180")} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-xs text-muted">{dict.serviceNumber} <span dir="ltr">{String(all.indexOf(s) + 1).padStart(2, "0")}</span></span>
                    <span className="heading text-ink">{tr(s.title, locale, true)}</span>
                  </span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: title,
          serviceType: title,
          description: description || summary,
          url: absoluteUrl(`/${locale}/services/${slug}`),
          provider: { "@type": "ProfessionalService", name: tr(general.siteName, locale, true), url: absoluteUrl("/") },
          ...(capabilityCount ? { hasOfferCatalog: { "@type": "OfferCatalog", name: title, itemListElement: groups.flatMap((g) => g.items).map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })) } } : {}),
        }}
      />
    </>
  );
}
