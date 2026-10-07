"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Dialog } from "radix-ui";
import {
  Building2, ChartColumn, CircleHelp, ExternalLink, FileText, Handshake, History, Images, Inbox, Languages, Layers, LayoutDashboard, LogOut,
  Mail, Menu, Newspaper, Phone, Quote, Search, Settings, ShieldCheck, UserCog, UserRound, Users, X, CalendarCheck, BarChart3, Plug, type LucideIcon,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";
import { logoutAction, setAdminLocaleAction } from "@/app/admin/(auth)/actions";
import { useAdminI18n } from "./i18n";
import type { AdminNavGroup } from "./nav";
import { CommandPalette } from "./command-palette";
import { Menu as DMenu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "./ui";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, FileText, Layers, Newspaper, Images, Users, Handshake, Building2, Quote, CircleHelp, ChartColumn, Menu, Phone, Search, Settings, Inbox, UserCog, ShieldCheck, Mail, History, CalendarCheck, BarChart3, Plug,
};

type Props = { nav: AdminNavGroup[]; badges: { unread: number; consultations: number }; user: { name: string; email: string; role: string }; locale: Locale; children: React.ReactNode };

export function AdminShell({ nav, badges, user, locale, children }: Props) {
  const { tx } = useAdminI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [switching, startSwitch] = useTransition();

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  const sidebar = (
    <nav aria-label={tx("Admin navigation", "تنقل لوحة التحكم")} className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
        <Link href="/admin" className="block">
          <Image src="/brand/logo-white.png" alt="Quality Experts CMS" width={1000} height={342} className="h-9 w-auto" priority />
        </Link>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {nav.map((g) => (
          <div key={g.en}>
            <p className="mb-1.5 px-3 text-[0.68rem] font-semibold tracking-[0.12em] text-white/40 uppercase rtl:tracking-normal">{locale === "ar" ? g.ar : g.en}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const Icon = ICONS[item.icon] ?? FileText;
                const active = isActive(item.href);
                const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        active ? "bg-white/10 font-semibold text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active ? "text-sky" : "text-white/50 group-hover:text-white/80")} aria-hidden />
                      <span className="flex-1 truncate">{locale === "ar" ? item.ar : item.en}</span>
                      {badge > 0 && <span className="rounded-full bg-tech-600 px-1.5 py-0.5 text-[0.68rem] font-bold text-white">{badge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-3">
        <a href={`/${locale}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
          <ExternalLink className="size-4" aria-hidden />
          {tx("View website", "عرض الموقع")}
        </a>
      </div>
    </nav>
  );

  return (
    <div className="min-h-svh lg:ps-64">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 bg-navy lg:block">{sidebar}</aside>

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/50 lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 start-0 z-50 w-72 max-w-[85vw] bg-navy shadow-2xl focus:outline-none lg:hidden">
            <Dialog.Title className="sr-only">{tx("Navigation", "التنقل")}</Dialog.Title>
            <Dialog.Description className="sr-only">{tx("Admin sections", "أقسام لوحة التحكم")}</Dialog.Description>
            <Dialog.Close className="absolute top-4 end-3 z-10 grid size-8 place-items-center rounded-md text-white/70 hover:bg-white/10" aria-label={tx("Close", "إغلاق")}>
              <X className="size-4" />
            </Dialog.Close>
            {sidebar}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
        <button type="button" onClick={() => setMobileOpen(true)} className="grid size-9 place-items-center rounded-md text-ink hover:bg-surface lg:hidden" aria-label={tx("Open navigation", "فتح التنقل")}>
          <Menu className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex h-10 max-w-md min-w-0 flex-1 items-center gap-2.5 rounded-md border border-line bg-surface px-3 text-sm text-muted transition-colors hover:border-line-strong"
        >
          <Search className="size-4" aria-hidden />
          <span className="flex-1 truncate text-start">{tx("Search content, messages, users…", "ابحث في المحتوى والرسائل والمستخدمين…")}</span>
          <kbd className="hidden rounded border border-line-strong bg-white px-1.5 py-0.5 font-mono text-[0.7rem] sm:inline" dir="ltr">Ctrl K</kbd>
        </button>
        <div className="ms-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            disabled={switching}
            onClick={() => startSwitch(async () => { await setAdminLocaleAction(locale === "ar" ? "en" : "ar"); router.refresh(); })}
            className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-ink hover:bg-surface"
          >
            <Languages className="size-4" aria-hidden />
            <span className="hidden sm:inline">{locale === "ar" ? "English" : "العربية"}</span>
          </button>
          <DMenu>
            <MenuTrigger className="flex items-center gap-2.5 rounded-md p-1.5 hover:bg-surface" aria-label={tx("Account menu", "قائمة الحساب")}>
              <span className="grid size-8 place-items-center rounded-full bg-navy text-sm font-semibold text-white">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="hidden text-start md:block">
                <span className="block max-w-40 truncate text-sm leading-tight font-semibold text-ink">{user.name}</span>
                <span className="block text-xs leading-tight text-muted">{user.role}</span>
              </span>
            </MenuTrigger>
            <MenuContent>
              <div className="px-2.5 py-2 text-xs text-muted" dir="ltr">{user.email}</div>
              <MenuSeparator />
              <MenuItem onSelect={() => router.push("/admin/account")}><UserRound className="size-4" />{tx("My account", "حسابي")}</MenuItem>
              <MenuItem onSelect={() => window.open(`/${locale}`, "_blank")}><ExternalLink className="size-4" />{tx("View website", "عرض الموقع")}</MenuItem>
              <MenuSeparator />
              <MenuItem danger onSelect={() => logoutAction()}><LogOut className="size-4" />{tx("Sign out", "تسجيل الخروج")}</MenuItem>
            </MenuContent>
          </DMenu>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
