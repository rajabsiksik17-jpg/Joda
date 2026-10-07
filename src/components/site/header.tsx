import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { getBrandAssets } from "@/lib/content/brand";
import { getSiteChrome } from "@/lib/content/site";
import { channelHref, localizeHref } from "@/lib/links";
import { getSetting } from "@/lib/settings";
import { HeaderClient, type HeaderNavItem, type MegaGroup } from "./header-client";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const [chrome, header, general, brand] = await Promise.all([getSiteChrome(), getSetting("header"), getSetting("general"), getBrandAssets()]);
  const dict = getSiteDictionary(locale);

  const toItem = (n: (typeof chrome.header)[number]): HeaderNavItem => ({
    id: n.id,
    label: tr(n.label, locale, true),
    description: tr(n.description, locale),
    href: n.href ? localizeHref(locale, n.href) : "",
    external: n.external,
    newTab: n.newTab,
    isServicesMenu: n.isServicesMenu,
    children: n.children.map(toItem),
  });

  const groups: MegaGroup[] = chrome.categories
    .map((c) => ({
      id: c.id,
      name: tr(c.name, locale, true),
      services: chrome.services
        .filter((s) => s.categoryId === c.id)
        .map((s) => ({ id: s.id, title: tr(s.title, locale, true), summary: tr(s.summary, locale), icon: s.icon, href: localizeHref(locale, `/services/${s.slug}`) })),
    }))
    .filter((g) => g.services.length);
  const uncategorized = chrome.services.filter((s) => !s.categoryId);
  if (uncategorized.length) {
    groups.push({
      id: "other",
      name: dict.services,
      services: uncategorized.map((s) => ({ id: s.id, title: tr(s.title, locale, true), summary: tr(s.summary, locale), icon: s.icon, href: localizeHref(locale, `/services/${s.slug}`) })),
    });
  }

  const primaryPhone = chrome.channels.find((c) => c.type === "PHONE" && c.isPrimary) ?? chrome.channels.find((c) => c.type === "PHONE");
  const primaryEmail = chrome.channels.find((c) => c.type === "EMAIL" && c.isPrimary) ?? chrome.channels.find((c) => c.type === "EMAIL");

  return (
    <HeaderClient
      locale={locale}
      siteName={tr(general.siteName, locale, true)}
      tagline={tr(general.tagline, locale)}
      items={chrome.header.map(toItem)}
      groups={groups}
      orderedServices={chrome.services.map((s) => ({ id: s.id, title: tr(s.title, locale, true), summary: tr(s.summary, locale), icon: s.icon, href: localizeHref(locale, `/services/${s.slug}`) }))}
      cta={header.showCta && tr(header.ctaLabel, locale) ? { label: tr(header.ctaLabel, locale), href: localizeHref(locale, header.ctaHref) } : null}
      logoColor={brand.logoColor}
      logoWhite={brand.logoWhite}
      contact={{
        phone: primaryPhone ? { value: primaryPhone.value, href: channelHref(primaryPhone.type, primaryPhone.value, primaryPhone.href) ?? "#" } : null,
        email: primaryEmail ? { value: primaryEmail.value, href: channelHref(primaryEmail.type, primaryEmail.value, primaryEmail.href) ?? "#" } : null,
      }}
      labels={{
        menu: dict.menu,
        closeMenu: dict.closeMenu,
        mainNav: dict.mainNav,
        switchTo: dict.switchTo,
        allServices: dict.allServices,
        services: dict.services,
        home: dict.home,
        search: dict.search,
      }}
    />
  );
}
