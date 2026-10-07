import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { SETTINGS_GROUPS } from "@/lib/admin/settings-fields";
import { getFieldEnv } from "@/lib/admin/env";
import { getGoogleConfig, googleRedirectUri } from "@/lib/google/client";
import { readSetting } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { GoogleIntegration, IntegrationStatusBar, VerificationCheck } from "./integrations-client";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  await requirePage("settings.edit");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const [g, analytics, seo, env, sp] = await Promise.all([getGoogleConfig(), readSetting("analytics"), readSetting("seo"), getFieldEnv(locale), searchParams]);
  const t = (b: { en: string; ar: string }) => (locale === "ar" ? b.ar : b.en);
  const tracking = analytics.provider === "ga4" && !!analytics.ga4MeasurementId;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title={tx("Integrations", "التكاملات")}
        description={tx(
          "Google Analytics tracking, Search Console verification and the read-only Google connection that powers the Analytics dashboard. Secrets are encrypted and never shown again.",
          "تتبع Google Analytics والتحقق في Search Console والربط بحساب Google (قراءة فقط) الذي يغذي لوحة التحليلات. البيانات السرية مشفرة ولا تُعرض مجدداً.",
        )}
        actions={<Link href="/admin/analytics" className="inline-flex h-10 items-center rounded-md border border-line-strong bg-white px-4 text-sm font-medium text-ink hover:bg-surface">{tx("Open analytics", "فتح التحليلات")}</Link>}
      />

      <IntegrationStatusBar
        items={[
          { label: tx("Analytics tracking (GA4)", "تتبع التحليلات (GA4)"), state: tracking ? "ok" : "off", detail: tracking ? analytics.ga4MeasurementId : tx("Not configured", "غير مُعد") },
          { label: tx("Google account", "حساب Google"), state: g.connected ? "ok" : g.hasClient ? "warn" : "off", detail: g.connected ? g.accountEmail || tx("Connected", "مرتبط") : g.hasClient ? tx("Credentials saved — not connected", "تم حفظ بيانات الاعتماد — غير مرتبط") : tx("Not connected", "غير مرتبط") },
          { label: tx("Analytics reports", "تقارير التحليلات"), state: g.connected && g.ga4Property ? "ok" : "off", detail: g.ga4PropertyName || (g.connected ? tx("Choose a property", "اختر خاصية") : tx("Not connected", "غير مرتبط")) },
          { label: "Search Console", state: g.connected && g.searchConsoleSite ? "ok" : seo.googleVerification ? "warn" : "off", detail: g.searchConsoleSite || (seo.googleVerification ? tx("Verification code set", "تم إعداد رمز التحقق") : tx("Not connected", "غير مرتبط")) },
        ]}
      />

      <SettingsForm
        settingKey="analytics"
        title={tx("1 · Google Analytics tracking", "1 · تتبع Google Analytics")}
        description={tx(
          "Adds the GA4 tag to the public website. It loads only after a visitor accepts the cookie notice, and never in the admin area.",
          "يضيف وسم GA4 إلى الموقع العام. لا يُحمَّل إلا بعد موافقة الزائر على إشعار ملفات تعريف الارتباط، ولا يُحمَّل في لوحة التحكم.",
        )}
        fields={SETTINGS_GROUPS.analytics.fields}
        initial={analytics as Record<string, unknown>}
        env={env}
      />

      <GoogleIntegration
        initial={{
          clientId: g.clientId,
          hasSecret: !!g.clientSecretEnc,
          connected: g.connected,
          accountEmail: g.accountEmail,
          connectedAt: g.connectedAt,
          ga4Property: g.ga4Property,
          ga4PropertyName: g.ga4PropertyName,
          searchConsoleSite: g.searchConsoleSite,
          lastSyncAt: g.lastSyncAt,
          lastError: g.lastError,
          scopes: g.scopes,
        }}
        redirectUri={googleRedirectUri()}
        siteOrigin={siteUrl()}
        flash={sp.google ?? ""}
      />

      <VerificationCheck code={seo.googleVerification} seoTitle={t(SETTINGS_GROUPS.seo.title)} />
    </div>
  );
}
