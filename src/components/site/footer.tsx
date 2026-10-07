import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone, Printer } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { getBrandAssets } from "@/lib/content/brand";
import { getSiteChrome } from "@/lib/content/site";
import { SocialIcon } from "@/lib/icons";
import { channelHref, localizeHref } from "@/lib/links";
import { getSetting } from "@/lib/settings";
import { CookieSettingsButton } from "./consent-manager";

const CHANNEL_ICON = { PHONE: Phone, EMAIL: Mail, WHATSAPP: MessageCircle, FAX: Printer, ADDRESS: MapPin, OTHER: ArrowRight } as const;

export async function SiteFooter({ locale }: { locale: Locale }) {
  const [chrome, footer, general, contact, analytics, brand] = await Promise.all([
    getSiteChrome(),
    getSetting("footer"),
    getSetting("general"),
    getSetting("contact"),
    getSetting("analytics"),
    getBrandAssets(),
  ]);
  const dict = getSiteDictionary(locale);
  const siteName = tr(general.siteName, locale, true);
  const channels = chrome.channels.filter((c) => c.showInFooter);
  const address = tr(contact.address, locale);
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-navy-950 text-white/70" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">{siteName}</h2>
      <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-50" />

      {tr(footer.ctaTitle, locale) && (
        <div className="relative border-b border-white/10">
          <div className="container-qe flex flex-col items-start justify-between gap-8 py-14 lg:flex-row lg:items-center lg:py-16">
            <p className="display t-title max-w-2xl text-white">{tr(footer.ctaTitle, locale)}</p>
            {tr(footer.ctaLabel, locale) && (
              <Link href={localizeHref(locale, footer.ctaHref)} className="btn btn-primary shrink-0">
                {tr(footer.ctaLabel, locale)}
                <ArrowRight className="btn-arrow size-4" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="container-qe relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <Image src={brand.logoWhite.url} alt={siteName} width={brand.logoWhite.width} height={brand.logoWhite.height} className="h-14 w-auto" />
          {tr(footer.about, locale) && <p className="mt-6 max-w-sm leading-relaxed">{tr(footer.about, locale)}</p>}
          {chrome.socials.length > 0 && (
            <div className="mt-7">
              <p className="sr-only">{dict.followUs}</p>
              <ul className="flex flex-wrap gap-2">
                {chrome.socials.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-sky hover:bg-sky hover:text-navy" aria-label={s.label || s.platform}>
                      <SocialIcon platform={s.platform} className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {chrome.services.length > 0 && (
          <nav className="lg:col-span-3" aria-label={dict.services}>
            <h3 className="mb-5 text-sm font-semibold tracking-[0.14em] text-white uppercase rtl:tracking-normal">{dict.services}</h3>
            <ul className="space-y-2.5">
              {chrome.services.map((s) => (
                <li key={s.id}>
                  <Link href={localizeHref(locale, `/services/${s.slug}`)} className="link-underline transition-colors hover:text-white">{tr(s.title, locale, true)}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {chrome.footer.length > 0 && (
          <nav className="lg:col-span-2" aria-label={dict.footerNav}>
            <h3 className="mb-5 text-sm font-semibold tracking-[0.14em] text-white uppercase rtl:tracking-normal">{dict.company}</h3>
            <ul className="space-y-2.5">
              {chrome.footer.map((n) => (
                <li key={n.id}>
                  {n.external ? (
                    <a href={n.href} target={n.newTab ? "_blank" : undefined} rel="noopener noreferrer" className="link-underline hover:text-white">{tr(n.label, locale, true)}</a>
                  ) : (
                    <Link href={localizeHref(locale, n.href)} className="link-underline hover:text-white">{tr(n.label, locale, true)}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="lg:col-span-3">
          <h3 className="mb-5 text-sm font-semibold tracking-[0.14em] text-white uppercase rtl:tracking-normal">{dict.contactUs}</h3>
          <ul className="space-y-3.5">
            {channels.map((c) => {
              const IconCmp = CHANNEL_ICON[c.type as keyof typeof CHANNEL_ICON] ?? ArrowRight;
              const href = channelHref(c.type, c.value, c.href);
              const ltr = c.type === "PHONE" || c.type === "WHATSAPP" || c.type === "FAX";
              const content = <span dir={ltr ? "ltr" : undefined}>{c.value}</span>;
              return (
                <li key={c.id} className="flex items-start gap-3">
                  <IconCmp className="mt-1 size-4 shrink-0 text-sky" aria-hidden />
                  {href ? <a href={href} className="hover:text-white" target={c.type === "WHATSAPP" ? "_blank" : undefined} rel="noopener noreferrer">{content}</a> : content}
                </li>
              );
            })}
            {address && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 size-4 shrink-0 text-sky" aria-hidden />
                <span>{address}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-qe flex flex-col gap-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteName}. {dict.allRightsReserved}
            {tr(footer.signature, locale) && <span className="text-white/45"> — {tr(footer.signature, locale)}</span>}
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {chrome.legal.map((n) => (
              <li key={n.id}>
                <Link href={localizeHref(locale, n.href)} className="hover:text-white">{tr(n.label, locale, true)}</Link>
              </li>
            ))}
            {analytics.provider !== "none" && (
              <li>
                <CookieSettingsButton label={dict.cookieSettings} />
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}
