import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { COLLECTIONS } from "@/lib/admin/collections";
import { listCollection } from "@/lib/admin/collection-store";
import { getFieldEnv } from "@/lib/admin/env";
import { SETTINGS_GROUPS } from "@/lib/admin/settings-fields";
import { readSetting } from "@/lib/settings";
import { PageHeader } from "@/components/admin/ui";
import { CollectionManager } from "@/components/admin/collection-manager";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Contact details" };

export default async function ContactAdminPage() {
  await requirePage("contact.edit");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const t = (b: { en: string; ar: string }) => (locale === "ar" ? b.ar : b.en);
  const [channels, socials, contact, floating, consultation, env] = await Promise.all([listCollection("contactChannels"), listCollection("socialLinks"), readSetting("contact"), readSetting("floating"), readSetting("consultation"), getFieldEnv(locale)]);
  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <PageHeader title={tx("Contact details", "بيانات التواصل")} description={tx("Everything visitors use to reach the company — shown in the header, footer, contact page and structured data.", "كل ما يستخدمه الزوار للتواصل مع الشركة — يظهر في الرأس والتذييل وصفحة التواصل والبيانات المنظمة.")} />
      <section>
        <h2 className="mb-1 text-lg font-bold text-ink">{t(COLLECTIONS.contactChannels.title)}</h2>
        <p className="mb-4 text-sm text-muted">{t(COLLECTIONS.contactChannels.description)}</p>
        <CollectionManager config={COLLECTIONS.contactChannels} initialRows={channels as never} env={env} compact />
      </section>
      <section>
        <h2 className="mb-1 text-lg font-bold text-ink">{t(COLLECTIONS.socialLinks.title)}</h2>
        <p className="mb-4 text-sm text-muted">{t(COLLECTIONS.socialLinks.description)}</p>
        <CollectionManager config={COLLECTIONS.socialLinks} initialRows={socials as never} env={env} compact />
      </section>
      <SettingsForm settingKey="contact" title={t(SETTINGS_GROUPS.contact.title)} description={t(SETTINGS_GROUPS.contact.description)} fields={SETTINGS_GROUPS.contact.fields} initial={contact as Record<string, unknown>} env={env} />
      <SettingsForm settingKey="floating" title={t(SETTINGS_GROUPS.floating.title)} description={t(SETTINGS_GROUPS.floating.description)} fields={SETTINGS_GROUPS.floating.fields} initial={floating as Record<string, unknown>} env={env} />
      <SettingsForm settingKey="consultation" title={t(SETTINGS_GROUPS.consultation.title)} description={t(SETTINGS_GROUPS.consultation.description)} fields={SETTINGS_GROUPS.consultation.fields} initial={consultation as Record<string, unknown>} env={env} />
    </div>
  );
}
