"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Mail, Menu, Phone, Search, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/cn";

export type HeaderNavItem = { id: string; label: string; description?: string; href: string; external: boolean; newTab: boolean; isServicesMenu: boolean; children: HeaderNavItem[] };
export type MegaGroup = { id: string; name: string; services: { id: string; title: string; summary: string; icon: string; href: string }[] };

type Props = {
  locale: Locale;
  siteName: string;
  tagline: string;
  items: HeaderNavItem[];
  groups: MegaGroup[];
  /** Services in their official order (used by the mobile menu) */
  orderedServices: MegaGroup["services"];
  cta: { label: string; href: string } | null;
  logoColor: { url: string; width: number; height: number };
  logoWhite: { url: string; width: number; height: number };
  contact: { phone: { value: string; href: string } | null; email: { value: string; href: string } | null };
  labels: { menu: string; closeMenu: string; mainNav: string; switchTo: string; allServices: string; services: string; home: string; search: string };
};

function swapLocale(pathname: string, target: Locale) {
  const parts = pathname.split("/");
  parts[1] = target;
  return parts.join("/") || `/${target}`;
}

export function HeaderClient({ locale, siteName, tagline, items, groups, orderedServices, cta, logoColor, logoWhite, contact, labels }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServices, setMobileServices] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const megaId = useId();
  const target: Locale = locale === "ar" ? "en" : "ar";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation.
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
  }

  // Escape closes any open menu; clicks outside close desktop dropdowns.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mobileOpen) {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
      setOpenMenu(null);
    };
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [mobileOpen]);

  // Lock page scroll and move focus into the mobile panel while it is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobilePanelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Keep keyboard focus inside the mobile dialog.
  const trapFocus = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !mobilePanelRef.current) return;
    const focusables = Array.from(mobilePanelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const hoverOpen = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(id);
  };
  const hoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 160);
  };

  const solid = scrolled || openMenu !== null;
  const isActive = (href: string) => {
    // In-page anchors (e.g. /about#vision) are never shown as the current page.
    if (!href || href.includes("#")) return false;
    const path = href;
    // The home link (/ar, /en) only matches itself, not every page below it.
    if (path === `/${locale}`) return pathname === path;
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  const servicesHref = items.find((i) => i.isServicesMenu)?.href || `/${locale}/services`;

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-500",
        solid ? "border-b border-line bg-white/95 shadow-[0_10px_30px_-24px_rgba(7,31,63,0.5)] backdrop-blur-md" : "border-b border-white/10 bg-transparent",
      )}
    >
      <div className="container-qe flex h-[4.5rem] items-center justify-between gap-6 lg:h-20">
        <Link href={`/${locale}`} className="relative block shrink-0" aria-label={`${siteName} — ${labels.home}`}>
          <Image src={logoWhite.url} alt="" width={logoWhite.width} height={logoWhite.height} priority className={cn("h-11 w-auto transition-opacity duration-300 lg:h-[3.25rem]", solid ? "opacity-0" : "opacity-100")} />
          <Image src={logoColor.url} alt="" width={logoColor.width} height={logoColor.height} priority className={cn("absolute inset-0 h-11 w-auto transition-opacity duration-300 lg:h-[3.25rem]", solid ? "opacity-100" : "opacity-0")} />
        </Link>

        {/* Desktop navigation */}
        <nav aria-label={labels.mainNav} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => {
              const hasDropdown = item.isServicesMenu ? groups.length > 0 : item.children.length > 0;
              const linkCls = cn(
                "relative inline-flex items-center gap-1 px-2 py-2 text-[0.9rem] font-medium whitespace-nowrap transition-colors xl:gap-1.5 xl:px-3.5 xl:text-[0.95rem]",
                solid ? "text-ink hover:text-tech-600" : "text-white/90 hover:text-white",
                (isActive(item.href) || item.children.some((c) => isActive(c.href))) && (solid ? "text-tech-600" : "text-white"),
              );
              if (!hasDropdown) {
                return (
                  <li key={item.id}>
                    <NavAnchor item={item} className={linkCls}>
                      {item.label}
                      {isActive(item.href) && <span className="absolute inset-x-2 -bottom-0.5 h-px bg-current xl:inset-x-3.5" />}
                    </NavAnchor>
                  </li>
                );
              }
              const open = openMenu === item.id;
              return (
                <li key={item.id} onMouseEnter={() => hoverOpen(item.id)} onMouseLeave={hoverClose} className={item.isServicesMenu ? "" : "relative"}>
                  <button type="button" className={linkCls} aria-expanded={open} aria-controls={`${megaId}-${item.id}`} onClick={() => setOpenMenu(open ? null : item.id)}>
                    {item.label}
                    <ChevronDown className={cn("size-4 transition-transform duration-300", open && "rotate-180")} aria-hidden />
                  </button>
                  {item.isServicesMenu ? (
                    <div
                      id={`${megaId}-${item.id}`}
                      className={cn(
                        "absolute inset-x-0 top-full border-t border-line bg-white shadow-[0_30px_60px_-30px_rgba(7,31,63,0.35)] transition-[opacity,visibility,transform] duration-300",
                        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
                      )}
                    >
                      <div className="container-qe grid grid-cols-12 gap-8 py-10">
                        <div className="col-span-9 grid grid-cols-3 gap-x-8 gap-y-8">
                          {groups.map((g) => (
                            <div key={g.id}>
                              <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted uppercase rtl:tracking-normal">{g.name}</p>
                              <ul className="space-y-1">
                                {g.services.map((s) => (
                                  <li key={s.id}>
                                    <Link href={s.href} className="group flex items-start gap-3 rounded-sm p-2 -mx-2 transition-colors hover:bg-surface" onClick={() => setOpenMenu(null)}>
                                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm bg-sky-50 text-tech-600 transition-colors group-hover:bg-tech group-hover:text-white">
                                        <Icon name={s.icon} className="size-4" />
                                      </span>
                                      <span className="text-[0.95rem] leading-snug font-semibold text-ink">{s.title}</span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                        <div className="col-span-3 flex flex-col justify-between rounded-sm bg-navy p-7 text-white">
                          <div>
                            <p className="eyebrow mb-4 !text-sky">{labels.services}</p>
                            <p className="display text-2xl leading-snug text-white">{tagline}</p>
                          </div>
                          <Link href={servicesHref} className="btn btn-primary mt-6 w-full" onClick={() => setOpenMenu(null)}>
                            {labels.allServices}
                            <ArrowRight className="btn-arrow size-4" aria-hidden />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ul
                      id={`${megaId}-${item.id}`}
                      className={cn(
                        "absolute top-full w-80 border border-line border-t-2 border-t-tech-600 bg-white p-2 shadow-lift transition-[opacity,visibility,transform] duration-200 ltr:left-0 rtl:right-0",
                        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
                      )}
                    >
                      {/* The parent link is listed only when no child already points to the same page. */}
                      {item.href && !item.children.some((c) => c.href === item.href) && (
                        <li>
                          <NavAnchor item={item} className="block rounded-sm px-3 py-2.5 font-semibold text-ink hover:bg-surface">{item.label}</NavAnchor>
                        </li>
                      )}
                      {item.children.map((c, ci) => (
                        <li key={c.id}>
                          <NavAnchor item={c} className={cn("group/sub flex items-start gap-3 rounded-sm px-3 py-2.5 transition-colors hover:bg-surface", isActive(c.href) && "bg-sky-50")}>
                            <span className="mt-0.5 font-mono text-xs text-tech-600" dir="ltr">{String(ci + 1).padStart(2, "0")}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold text-ink group-hover/sub:text-tech-600">{c.label}</span>
                              {c.description && <span className="mt-0.5 block text-sm leading-snug text-muted">{c.description}</span>}
                            </span>
                          </NavAnchor>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1 xl:gap-2">
          <Link
            href={`/${locale}/search`}
            className={cn("hidden size-10 place-items-center rounded-full transition-colors sm:grid", solid ? "text-ink hover:bg-surface" : "text-white hover:bg-white/10")}
            aria-label={labels.search}
          >
            <Search className="size-[1.15rem]" aria-hidden />
          </Link>
          <Link
            href={swapLocale(pathname, target)}
            hrefLang={target}
            lang={target}
            className={cn(
              "hidden h-10 items-center rounded-full px-3.5 text-sm font-semibold transition-colors sm:inline-flex",
              solid ? "text-ink hover:bg-surface" : "text-white hover:bg-white/10",
              target === "ar" ? "font-[family-name:var(--font-cairo)]" : "",
            )}
          >
            {labels.switchTo}
          </Link>
          {cta && (
            <Link href={cta.href} className={cn("btn hidden !min-h-11 !px-3.5 text-[0.9rem] whitespace-nowrap lg:inline-flex xl:!px-5 xl:text-base", solid ? "btn-primary" : "btn-outline-light")}>
              {cta.label}
            </Link>
          )}
          <button
            ref={menuButtonRef}
            type="button"
            className={cn("grid size-11 place-items-center rounded-full lg:hidden", solid ? "text-ink hover:bg-surface" : "text-white hover:bg-white/10")}
            aria-label={labels.menu}
            aria-expanded={mobileOpen}
            aria-controls={`${megaId}-mobile`}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-6" aria-hidden />
          </button>
        </div>
      </div>

      {/* Mobile navigation: a dedicated full-screen experience rather than a shrunken desktop menu */}
      <div
        id={`${megaId}-mobile`}
        ref={mobilePanelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labels.mainNav}
        onKeyDown={trapFocus}
        className={cn(
          "fixed inset-0 z-[60] flex flex-col bg-navy text-white transition-[opacity,visibility] duration-300 lg:hidden",
          mobileOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-qe relative flex h-[4.5rem] items-center justify-between">
          <Image src={logoWhite.url} alt={siteName} width={logoWhite.width} height={logoWhite.height} className="h-11 w-auto" />
          <button type="button" className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label={labels.closeMenu} onClick={() => { setMobileOpen(false); menuButtonRef.current?.focus(); }}>
            <X className="size-6" aria-hidden />
          </button>
        </div>
        <nav className="container-qe relative flex-1 overflow-y-auto pb-8" aria-label={labels.mainNav}>
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {items.map((item, idx) => (
              <li key={item.id} className={cn("transition-all duration-500", mobileOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")} style={{ transitionDelay: mobileOpen ? `${80 + idx * 45}ms` : "0ms" }}>
                {item.isServicesMenu && groups.length ? (
                  <>
                    <button type="button" className="flex w-full items-center justify-between py-4 text-start text-2xl font-semibold" aria-expanded={mobileServices} onClick={() => setMobileServices((v) => !v)}>
                      {item.label}
                      <ChevronDown className={cn("size-5 text-sky transition-transform", mobileServices && "rotate-180")} aria-hidden />
                    </button>
                    <div className={cn("grid transition-[grid-template-rows] duration-400", mobileServices ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <ul className="overflow-hidden">
                        {orderedServices.map((s) => (
                          <li key={s.id}>
                            <Link href={s.href} className="flex items-center gap-3 py-2.5 text-white/80 hover:text-white" tabIndex={mobileServices ? 0 : -1}>
                              <Icon name={s.icon} className="size-4 text-sky" />
                              {s.title}
                            </Link>
                          </li>
                        ))}
                        <li className="pt-2 pb-4">
                          <Link href={servicesHref} className="inline-flex items-center gap-2 font-semibold text-sky" tabIndex={mobileServices ? 0 : -1}>
                            {labels.allServices}
                            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    {item.children.length > 0 ? (
                      <>
                        <button type="button" className={cn("flex w-full items-center justify-between py-4 text-start text-2xl font-semibold", item.children.some((c) => isActive(c.href)) ? "text-sky" : "text-white")} aria-expanded={mobileGroup === item.id} onClick={() => setMobileGroup((g) => (g === item.id ? null : item.id))}>
                          {item.label}
                          <ChevronDown className={cn("size-5 text-sky transition-transform", mobileGroup === item.id && "rotate-180")} aria-hidden />
                        </button>
                        <div className={cn("grid transition-[grid-template-rows] duration-400", mobileGroup === item.id ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                          <ul className="overflow-hidden">
                            {item.href && !item.children.some((c) => c.href === item.href) && (
                              <li>
                                <NavAnchor item={item} className="block py-2.5 text-white/80 hover:text-white" tabIndex={mobileGroup === item.id ? 0 : -1}>{item.label}</NavAnchor>
                              </li>
                            )}
                            {item.children.map((c) => (
                              <li key={c.id}>
                                <NavAnchor item={c} className={cn("block py-2.5 hover:text-white", isActive(c.href) ? "text-sky" : "text-white/80")} tabIndex={mobileGroup === item.id ? 0 : -1}>
                                  {c.label}
                                  {c.description && <span className="mt-0.5 block text-sm text-white/50">{c.description}</span>}
                                </NavAnchor>
                              </li>
                            ))}
                            <li className="h-3" aria-hidden />
                          </ul>
                        </div>
                      </>
                    ) : (
                      item.href && <NavAnchor item={item} className={cn("block py-4 text-2xl font-semibold", isActive(item.href) ? "text-sky" : "text-white")}>{item.label}</NavAnchor>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            {cta && <Link href={cta.href} className="btn btn-primary flex-1">{cta.label}</Link>}
            <Link href={swapLocale(pathname, target)} hrefLang={target} lang={target} className="btn btn-outline-light">{labels.switchTo}</Link>
            <Link href={`/${locale}/search`} className="btn btn-outline-light" aria-label={labels.search}><Search className="size-4" aria-hidden /></Link>
          </div>
          <div className="mt-10 space-y-3 text-white/75">
            {contact.phone && (
              <a href={contact.phone.href} className="flex items-center gap-3 hover:text-white" dir="ltr">
                <Phone className="size-4 text-sky" aria-hidden /> <span>{contact.phone.value}</span>
              </a>
            )}
            {contact.email && (
              <a href={contact.email.href} className="flex items-center gap-3 hover:text-white">
                <Mail className="size-4 text-sky" aria-hidden /> <span>{contact.email.value}</span>
              </a>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavAnchor({ item, className, children, tabIndex }: { item: HeaderNavItem; className?: string; children: React.ReactNode; tabIndex?: number }) {
  if (item.external) {
    return (
      <a href={item.href} className={className} tabIndex={tabIndex} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener noreferrer" : undefined}>
        {children}
        {item.newTab && <ArrowUpRight className="inline size-3.5 opacity-70" aria-hidden />}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} tabIndex={tabIndex} target={item.newTab ? "_blank" : undefined}>
      {children}
    </Link>
  );
}
