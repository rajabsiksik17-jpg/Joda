import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { SETTINGS_GROUPS } from "@/lib/admin/settings-fields";
import { getFieldEnv } from "@/lib/admin/env";
import { readSetting } from "@/lib/settings";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

const TABS = ["general", "brand", "header", "footer", "analytics", "maintenance", "security"] as const;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requirePage("settings.edit");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const tabs = TABS.filter((t) => user.permissions.has(SETTINGS_GROUPS[t].permission));
  const { tab: raw } = await searchParams;
  const tab = tabs.find((t) => t === raw) ?? tabs[0];
  const group = SETTINGS_GROUPS[tab];
  const [values, env] = await Promise.all([readSetting(tab), getFieldEnv(locale)]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={tx("Settings", "الإعدادات")} description={tx("Site-wide configuration. Contact details, SEO and e-mail have their own sections.", "إعدادات الموقع العامة. لبيانات التواصل وتحسين البحث والبريد أقسام مستقلة.")} />
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line" aria-label={tx("Settings sections", "أقسام الإعدادات")}>
        {tabs.map((t) => (
          <Link key={t} href={`/admin/settings?tab=${t}`} aria-current={t === tab ? "page" : undefined} className={cn("-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-medium", t === tab ? "border-tech text-ink" : "border-transparent text-muted hover:text-ink")}>
            {locale === "ar" ? SETTINGS_GROUPS[t].title.ar : SETTINGS_GROUPS[t].title.en}
          </Link>
        ))}
      </nav>
      <SettingsForm key={tab} settingKey={tab} title={locale === "ar" ? group.title.ar : group.title.en} description={locale === "ar" ? group.description.ar : group.description.en} fields={group.fields} initial={values as Record<string, unknown>} env={env} />
    </div>
  );
}
