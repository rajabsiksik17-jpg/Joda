import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { fontVariables } from "../fonts";
import "../globals.css";
import { dirOf, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { getBrandAssets } from "@/lib/content/brand";
import { getSiteChrome } from "@/lib/content/site";
import { getPublishedPage } from "@/lib/content/pages";
import { absoluteUrl, siteUrl } from "@/lib/seo";
import { getSetting } from "@/lib/settings";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { RevealObserver } from "@/components/site/reveal-observer";
import { ConsentManager } from "@/components/site/consent-manager";
import { JsonLd } from "@/components/site/json-ld";
import { MaintenanceScreen } from "@/components/site/maintenance";
import { FloatingHost } from "@/components/site/floating-host";

export const viewport: Viewport = {
  themeColor: "#071f3f",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const [general, seo, brand] = await Promise.all([getSetting("general"), getSetting("seo"), getBrandAssets()]);
  const siteName = tr(general.siteName, locale, true);
  const template = tr(seo.titleTemplate, locale) || `%s | ${siteName}`;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${siteName}${tr(general.tagline, locale) ? ` — ${tr(general.tagline, locale)}` : ""}`, template },
    description: tr(seo.defaultDescription, locale),
    applicationName: siteName,
    icons: brand.favicon
      ? { icon: brand.favicon, apple: brand.favicon }
      : { icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/brand/icon-192.png", type: "image/png", sizes: "192x192" }], apple: "/brand/apple-touch-icon.png" },
    manifest: "/manifest.webmanifest",
    verification: {
      ...(seo.googleVerification ? { google: seo.googleVerification } : {}),
      ...(seo.bingVerification ? { other: { "msvalidate.01": seo.bingVerification } } : {}),
    },
    robots: seo.allowIndexing ? undefined : { index: false, follow: false },
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const [maintenance, analytics, general, chrome, brand, contact, user, cookiePolicy] = await Promise.all([
    getSetting("maintenance"),
    getSetting("analytics"),
    getSetting("general"),
    getSiteChrome(),
    getBrandAssets(),
    getSetting("contact"),
    getCurrentUser(),
    getPublishedPage("cookie-policy"),
  ]);
  const dict = getSiteDictionary(locale);
  const inMaintenance = maintenance.enabled && !user;

  const organization = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl()}/#organization`,
    name: tr(general.siteName, locale, true),
    alternateName: locales.map((l) => tr(general.siteName, l)).filter(Boolean),
    url: siteUrl(),
    logo: absoluteUrl(brand.logoColor.url),
    image: absoluteUrl("/brand/og-default.jpg"),
    description: tr(general.tagline, locale),
    address: { "@type": "PostalAddress", addressLocality: locale === "ar" ? "عمّان" : "Amman", addressCountry: "JO", streetAddress: tr(contact.address, locale) || undefined },
    telephone: chrome.channels.find((c) => c.type === "PHONE")?.value,
    email: chrome.channels.find((c) => c.type === "EMAIL")?.value,
    sameAs: chrome.socials.map((s) => s.url),
    ...(contact.mapLat !== null && contact.mapLng !== null ? { geo: { "@type": "GeoCoordinates", latitude: contact.mapLat, longitude: contact.mapLng } } : {}),
  };

  return (
    <html lang={locale} dir={dirOf(locale)} className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Enables reveal-on-scroll styles only when JavaScript runs (content stays visible otherwise). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-svh">
        {inMaintenance ? (
          <MaintenanceScreen locale={locale} message={tr(maintenance.message, locale)} title={dict.maintenanceTitle} logo={brand.logoWhite} />
        ) : (
          <>
            <a href="#main" className="sr-only z-[100] bg-tech-600 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
              {dict.skipToContent}
            </a>
            <SiteHeader locale={locale} />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <SiteFooter locale={locale} />
            <RevealObserver />
            <FloatingHost locale={locale} />
            {analytics.provider !== "none" && (
              <ConsentManager
                provider={analytics.provider}
                ga4Id={analytics.ga4MeasurementId}
                plausibleDomain={analytics.plausibleDomain}
                labels={{ title: dict.cookieTitle, text: dict.cookieText, accept: dict.cookieAccept, decline: dict.cookieDecline, policyLabel: dict.cookieSettings, policyHref: cookiePolicy ? `/${locale}/cookie-policy` : `/${locale}/privacy-policy` }}
              />
            )}
            <JsonLd data={organization} />
          </>
        )}
      </body>
    </html>
  );
}
