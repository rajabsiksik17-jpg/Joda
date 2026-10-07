import { Clock, Mail, MapPin, MessageCircle, Phone, Printer, ArrowRight } from "lucide-react";
import { tr, type L } from "@/lib/i18n/localized";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { getServices } from "@/lib/content/collections";
import { getPublishedPage } from "@/lib/content/pages";
import { getSiteChrome } from "@/lib/content/site";
import { issueFormToken } from "@/lib/form-token";
import { listCountries } from "@/lib/consultation/countries";
import { guessCountry } from "@/lib/request";
import { SocialIcon } from "@/lib/icons";
import { channelHref } from "@/lib/links";
import { getSetting } from "@/lib/settings";
import { cn } from "@/lib/cn";
import { ContactForm } from "../site/contact-form";
import { ConsultationForm } from "../forms/consultation-form";
import { MapEmbed } from "../site/map-embed";
import { CtaLink, SectionHeading } from "../site/primitives";
import { SectionShell, type SectionProps } from "./shell";

type LinkV = { label?: L; href?: string };

// ───────────────────────── Call to action ─────────────────────────
type CtaData = { variant?: string; eyebrow?: L; title?: L; text?: L; primaryCta?: LinkV; secondaryCta?: LinkV };

export function CtaSection({ data, settings, ctx }: SectionProps<CtaData>) {
  const { locale } = ctx;
  const title = tr(data.title, locale);
  if (!title) return null;

  if (data.variant === "light") {
    return (
      <SectionShell settings={settings}>
        <div className="container-qe">
          <div className="relative overflow-hidden border border-line bg-surface p-10 lg:p-16" data-reveal>
            <div className="grid-texture pointer-events-none absolute inset-0" />
            <div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                {tr(data.eyebrow, locale) && <p className="eyebrow mb-5">{tr(data.eyebrow, locale)}</p>}
                <h2 className="display t-section">{title}</h2>
                {tr(data.text, locale) && <p className="lede mt-5">{tr(data.text, locale)}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <CtaLink value={data.primaryCta} locale={locale} variant="primary" />
                <CtaLink value={data.secondaryCta} locale={locale} variant="outline" />
              </div>
            </div>
          </div>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell settings={{ ...settings, theme: "navy" }} className="overflow-hidden">
      <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -bottom-40 start-1/3 size-[40rem] rounded-full bg-tech/25 blur-[130px]" />
      <svg className="pointer-events-none absolute top-0 end-0 h-full w-1/2 opacity-[0.12]" viewBox="0 0 400 400" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <g fill="none" stroke="#3ab4e0" strokeWidth="1">
          <circle cx="330" cy="200" r="180" />
          <ellipse cx="330" cy="200" rx="180" ry="70" />
          <ellipse cx="330" cy="200" rx="70" ry="180" />
          <ellipse cx="330" cy="200" rx="130" ry="180" />
        </g>
      </svg>
      <div className="container-qe relative">
        <div className="max-w-3xl" data-reveal>
          {tr(data.eyebrow, locale) && <p className="eyebrow mb-6">{tr(data.eyebrow, locale)}</p>}
          <h2 className="display t-page text-white">{title}</h2>
          {tr(data.text, locale) && <p className="mt-6 text-lg leading-relaxed text-white/75 sm:text-xl">{tr(data.text, locale)}</p>}
          <div className="mt-10 flex flex-wrap gap-3">
            <CtaLink value={data.primaryCta} locale={locale} variant="primary" />
            <CtaLink value={data.secondaryCta} locale={locale} variant="outline-light" />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Map helpers ─────────────────────────
async function mapProps(locale: "ar" | "en") {
  const contact = await getSetting("contact");
  if (!contact.mapEnabled) return null;
  const query = contact.mapLat !== null && contact.mapLng !== null ? `${contact.mapLat},${contact.mapLng}` : contact.mapQuery;
  if (!query) return null;
  const dict = getSiteDictionary(locale);
  return {
    embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${contact.mapZoom}&hl=${locale}&output=embed`,
    openUrl: contact.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    address: tr(contact.address, locale),
    labels: { load: dict.loadMap, open: dict.openInMaps, note: dict.mapConsentNote },
  };
}

export async function MapSection({ data, settings, ctx }: SectionProps<{ eyebrow?: L; title?: L }>) {
  const map = await mapProps(ctx.locale);
  if (!map) return null;
  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} locale={ctx.locale} className="mb-10" />
        <MapEmbed {...map} />
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Contact ─────────────────────────
const CHANNEL_ICON = { PHONE: Phone, EMAIL: Mail, WHATSAPP: MessageCircle, FAX: Printer, ADDRESS: MapPin, OTHER: ArrowRight } as const;

type ContactData = { eyebrow?: L; title?: L; text?: L; showForm?: boolean; showChannels?: boolean; showMap?: boolean };

export async function ContactSection({ data, settings, ctx }: SectionProps<ContactData>) {
  const { locale } = ctx;
  const dict = getSiteDictionary(locale);
  const [chrome, contact, services, map, privacy] = await Promise.all([
    getSiteChrome(),
    getSetting("contact"),
    getServices(),
    data.showMap ? mapProps(locale) : Promise.resolve(null),
    getPublishedPage("privacy-policy"),
  ]);
  const address = tr(contact.address, locale);
  const hours = tr(contact.workingHours, locale);
  const serviceTitles = services.map((s) => tr(s.title, locale)).filter(Boolean);
  const requested = typeof ctx.searchParams.service === "string" ? ctx.searchParams.service : "";
  const typeLabel: Record<string, string> = { PHONE: dict.phone, EMAIL: dict.email, WHATSAPP: dict.whatsapp, ADDRESS: dict.address, FAX: dict.phone, OTHER: "" };

  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} className="mb-9 lg:mb-14" />
        <div className={cn("grid gap-12 lg:gap-16", data.showForm && data.showChannels && "lg:grid-cols-12")}>
          {data.showChannels && (
            <aside className={cn(data.showForm && "lg:col-span-4")} data-reveal>
              <ul className="divide-y divide-line border-y border-line">
                {chrome.channels.map((c) => {
                  const IconCmp = CHANNEL_ICON[c.type as keyof typeof CHANNEL_ICON] ?? ArrowRight;
                  const href = channelHref(c.type, c.value, c.href);
                  const ltr = ["PHONE", "WHATSAPP", "FAX"].includes(c.type);
                  return (
                    <li key={c.id} className="flex gap-4 py-5">
                      <span className="grid size-11 shrink-0 place-items-center rounded-sm bg-sky-50 text-tech-600"><IconCmp className="size-5" aria-hidden /></span>
                      <div className="min-w-0">
                        <p className="text-sm text-muted">{tr(c.label, locale) || typeLabel[c.type]}</p>
                        {href ? (
                          <a href={href} className="mt-0.5 block font-semibold break-words text-ink hover:text-tech-600" dir={ltr ? "ltr" : undefined} target={c.type === "WHATSAPP" ? "_blank" : undefined} rel="noopener noreferrer">{c.value}</a>
                        ) : (
                          <p className="mt-0.5 font-semibold text-ink">{c.value}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
                {address && (
                  <li className="flex gap-4 py-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-sm bg-sky-50 text-tech-600"><MapPin className="size-5" aria-hidden /></span>
                    <div>
                      <p className="text-sm text-muted">{dict.address}</p>
                      <p className="mt-0.5 font-semibold text-ink">{address}</p>
                    </div>
                  </li>
                )}
                {hours && (
                  <li className="flex gap-4 py-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-sm bg-sky-50 text-tech-600"><Clock className="size-5" aria-hidden /></span>
                    <div>
                      <p className="text-sm text-muted">{dict.workingHours}</p>
                      <p className="mt-0.5 font-semibold whitespace-pre-line text-ink">{hours}</p>
                    </div>
                  </li>
                )}
              </ul>
              {chrome.socials.length > 0 && (
                <div className="mt-8">
                  <p className="mb-3 text-sm font-semibold text-ink">{dict.followUs}</p>
                  <ul className="flex flex-wrap gap-2">
                    {chrome.socials.map((s) => (
                      <li key={s.id}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label || s.platform} className="grid size-10 place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-tech hover:bg-tech hover:text-white">
                          <SocialIcon platform={s.platform} className="size-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          )}
          {data.showForm && (
            <div className={cn("relative overflow-hidden border border-line bg-white p-5 shadow-soft sm:p-10", data.showChannels && "lg:col-span-8")} data-reveal>
              <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy via-tech-600 to-sky rtl:bg-gradient-to-l" aria-hidden />
              <ContactForm
                locale={locale}
                token={issueFormToken()}
                services={serviceTitles}
                defaultService={serviceTitles.includes(requested) ? requested : ""}
                labels={dict.form}
                privacyHref={privacy ? `/${locale}/privacy-policy` : null}
              />
            </div>
          )}
        </div>
        {map && (
          <div className="mt-10 lg:mt-16" data-reveal>
            <MapEmbed {...map} />
          </div>
        )}
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Consultation request ─────────────────────────
type ConsultationData = { eyebrow?: L; title?: L; text?: L; asideTitle?: L; steps?: { title?: L; text?: L }[]; showChannels?: boolean };

export async function ConsultationSection({ data, settings, ctx }: SectionProps<ConsultationData>) {
  const { locale } = ctx;
  const dict = getSiteDictionary(locale);
  const [chrome, consultation, privacy] = await Promise.all([getSiteChrome(), getSetting("consultation"), getPublishedPage("privacy-policy")]);
  const guess = await guessCountry(consultation.defaultCountry, consultation.preferredCountries);
  const countries = listCountries(locale, consultation.preferredCountries);
  const initialCountry = countries.all.some((c) => c.code === guess.code) ? guess.code : consultation.defaultCountry;
  const catName = new Map(chrome.categories.map((c) => [c.id, tr(c.name, locale, true)]));
  // Services grouped in category order; uncategorized services last.
  const catOrder = new Map(chrome.categories.map((c, i) => [c.id, i]));
  const services = [...chrome.services]
    .sort((a, b) => (catOrder.get(a.categoryId ?? "") ?? 99) - (catOrder.get(b.categoryId ?? "") ?? 99))
    .map((s) => ({ id: s.id, title: tr(s.title, locale, true), category: (s.categoryId && catName.get(s.categoryId)) || "", icon: s.icon }));
  const requested = typeof ctx.searchParams.service === "string" ? ctx.searchParams.service : "";
  const defaultServiceId = chrome.services.find((s) => s.slug === requested || s.id === requested)?.id ?? "";
  const steps = (data.steps ?? []).filter((s) => tr(s.title, locale));
  const channels = data.showChannels ? chrome.channels.filter((c) => ["PHONE", "EMAIL", "WHATSAPP"].includes(c.type)).slice(0, 4) : [];

  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        {(tr(data.eyebrow, locale) || tr(data.title, locale)) && <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} className="mb-8 lg:mb-12" />}
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="relative overflow-hidden border border-line bg-white p-5 shadow-soft sm:p-10 lg:col-span-8" data-reveal>
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy via-tech-600 to-sky rtl:bg-gradient-to-l" aria-hidden />
            <ConsultationForm
              locale={locale}
              token={issueFormToken()}
              labels={dict.consult}
              formLabels={dict.form}
              countries={countries}
              initialCountry={initialCountry}
              geoKnown={guess.source === "geo"}
              services={services}
              defaultServiceId={defaultServiceId}
              allowWhatsApp={consultation.allowWhatsApp}
              privacyHref={privacy ? `/${locale}/privacy-policy` : null}
              sourcePage={ctx.path}
            />
          </div>
          {(steps.length > 0 || channels.length > 0) && (
            <aside className="relative overflow-hidden bg-navy p-6 text-white sm:p-10 lg:col-span-4" data-reveal>
              <div className="grid-texture-dark absolute inset-0 opacity-50" aria-hidden />
              <div className="relative">
                {tr(data.asideTitle, locale) && <h2 className="heading text-xl text-white">{tr(data.asideTitle, locale)}</h2>}
                {steps.length > 0 && (
                  <ol className="relative mt-8 space-y-7 before:absolute before:inset-y-2 before:start-[1.05rem] before:w-px before:bg-white/15">
                    {steps.map((s, i) => (
                      <li key={i} className="relative flex gap-4" data-reveal style={{ "--reveal-delay": `${120 + i * 110}ms` } as React.CSSProperties}>
                        <span className="relative z-10 grid size-[2.1rem] shrink-0 place-items-center rounded-full bg-tech-600 font-mono text-xs font-semibold" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                        <span className="pt-1">
                          <span className="block font-semibold text-white">{tr(s.title, locale)}</span>
                          {tr(s.text, locale) && <span className="mt-1 block text-sm leading-relaxed text-white/70">{tr(s.text, locale)}</span>}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                {channels.length > 0 && (
                  <ul className="mt-10 space-y-3 border-t border-white/15 pt-8">
                    {channels.map((c) => {
                      const IconCmp = CHANNEL_ICON[c.type as keyof typeof CHANNEL_ICON] ?? ArrowRight;
                      const href = channelHref(c.type, c.value, c.href);
                      return (
                        <li key={c.id}>
                          <a href={href ?? "#"} className="group flex items-center gap-3 text-white/85 transition-colors hover:text-white" target={c.type === "WHATSAPP" ? "_blank" : undefined} rel="noopener noreferrer">
                            <span className="grid size-9 place-items-center rounded-full bg-white/10 transition-colors group-hover:bg-tech-600"><IconCmp className="size-4" aria-hidden /></span>
                            <span className="font-medium break-all" dir={c.type === "EMAIL" ? undefined : "ltr"}>{c.value}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Contact channel cards ─────────────────────────
type ContactCardsData = { eyebrow?: L; title?: L; text?: L; showHours?: boolean; showSocial?: boolean; socialTitle?: L; ctaTitle?: L; ctaText?: L; cta?: LinkV };

export async function ContactCardsSection({ data, settings, ctx }: SectionProps<ContactCardsData>) {
  const { locale } = ctx;
  const dict = getSiteDictionary(locale);
  const [chrome, contact] = await Promise.all([getSiteChrome(), getSetting("contact")]);
  const address = tr(contact.address, locale);
  const hours = data.showHours === false ? "" : tr(contact.workingHours, locale);
  const typeLabel: Record<string, string> = { PHONE: dict.phone, EMAIL: dict.email, WHATSAPP: dict.whatsapp, ADDRESS: dict.address, FAX: dict.phone, OTHER: "" };
  const cards = chrome.channels.filter((c) => c.type !== "ADDRESS");
  const hasCta = !!(tr(data.ctaTitle, locale) && data.cta?.href && tr(data.cta.label, locale));
  const showSocial = data.showSocial !== false && chrome.socials.length > 0;
  if (!cards.length && !address && !hours && !showSocial && !hasCta) return null;

  const mapHref = contact.mapUrl || (contact.mapQuery || address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.mapLat !== null && contact.mapLng !== null ? `${contact.mapLat},${contact.mapLng}` : contact.mapQuery || address)}` : null);
  const actionLabel: Record<string, string> = { PHONE: dict.actionCall, WHATSAPP: dict.actionChat, EMAIL: dict.actionEmail, FAX: "", ADDRESS: dict.actionMap, OTHER: dict.actionOpen };
  type Card = { key: string; icon: React.ComponentType<{ className?: string }>; label: string; value: string; href: string | null; ltr: boolean; action: string; external: boolean; multiline?: boolean };
  const items: Card[] = [
    ...cards.map((c) => ({
      key: c.id,
      icon: CHANNEL_ICON[c.type as keyof typeof CHANNEL_ICON] ?? ArrowRight,
      label: tr(c.label, locale) || typeLabel[c.type],
      value: c.value,
      href: channelHref(c.type, c.value, c.href),
      ltr: ["PHONE", "WHATSAPP", "FAX"].includes(c.type),
      action: actionLabel[c.type] ?? "",
      external: c.type === "WHATSAPP",
    })),
    ...(address ? [{ key: "address", icon: MapPin, label: dict.address, value: address, href: mapHref, ltr: false, action: dict.actionMap, external: true }] : []),
    ...(hours ? [{ key: "hours", icon: Clock, label: dict.workingHours, value: hours, href: null, ltr: false, action: "", external: false, multiline: true }] : []),
  ];

  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        {(tr(data.eyebrow, locale) || tr(data.title, locale)) && <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} className="mb-8 lg:mb-12" />}
        <ul className={cn("grid gap-2.5 sm:grid-cols-2 sm:gap-4", items.length >= 4 ? "xl:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "")}>
          {items.map((it, i) => {
            const inner = (
              <>
                {/* Phones: compact row. Larger screens: card with an action footer. */}
                <span className="icon-tile size-11 rounded-sm sm:size-12"><it.icon className="size-5" aria-hidden /></span>
                <span className="min-w-0 flex-1 sm:mt-6 sm:block">
                  <span className="block text-xs font-medium text-muted sm:text-[0.8rem]">{it.label}</span>
                  <span className={cn("mt-0.5 block font-semibold break-words text-ink sm:mt-1.5 sm:text-[1.08rem]", it.multiline && "whitespace-pre-line sm:text-base")}>
                    <span dir={it.ltr ? "ltr" : undefined}>{it.value}</span>
                  </span>
                </span>
                {it.href && (
                  <>
                    <ArrowRight className="size-4 shrink-0 text-muted transition-colors group-hover:text-tech-600 sm:hidden rtl:-scale-x-100" aria-hidden />
                    <span className="mt-6 hidden items-center justify-between border-t border-line pt-4 text-sm font-semibold text-tech-600 sm:flex">
                      {it.action}
                      <span className="grid size-8 place-items-center rounded-full bg-sky-50 transition-all duration-300 group-hover:bg-tech-600 group-hover:text-white">
                        <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
                      </span>
                    </span>
                  </>
                )}
              </>
            );
            const cls = "card-premium group flex h-full items-center gap-4 p-4 sm:flex-col sm:items-stretch sm:p-6";
            return (
              <li key={it.key} data-reveal style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}>
                {it.href ? (
                  <a href={it.href} target={it.external ? "_blank" : undefined} rel="noopener noreferrer" className={cls}>{inner}</a>
                ) : (
                  <div className={cls}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>

        {(showSocial || hasCta) && (
          <div className="mt-2.5 grid gap-2.5 sm:mt-4 sm:gap-4 lg:grid-cols-12">
            {showSocial && (
              <div className={cn("flex flex-col justify-between gap-4 border border-line bg-surface p-5 sm:gap-6 sm:p-8", hasCta ? "lg:col-span-5" : "lg:col-span-12")} data-reveal>
                <p className="heading t-card text-ink">{tr(data.socialTitle, locale) || dict.followUs}</p>
                <ul className="flex flex-wrap gap-3">
                  {chrome.socials.map((s) => (
                    <li key={s.id}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label || s.platform} className="grid size-12 place-items-center rounded-full border border-line-strong bg-white text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-navy hover:bg-navy hover:text-white sm:size-14">
                        <SocialIcon platform={s.platform} className="size-5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hasCta && (
              <div className={cn("relative overflow-hidden bg-navy p-6 text-white sm:p-10", showSocial ? "lg:col-span-7" : "lg:col-span-12")} data-reveal>
                <div className="grid-texture-dark absolute inset-0 opacity-50" aria-hidden />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-xl">
                    <p className="heading t-card text-white">{tr(data.ctaTitle, locale)}</p>
                    {tr(data.ctaText, locale) && <p className="mt-3 text-white/75">{tr(data.ctaText, locale)}</p>}
                  </div>
                  <CtaLink value={data.cta!} locale={locale} className="shrink-0" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionShell>
  );
}
