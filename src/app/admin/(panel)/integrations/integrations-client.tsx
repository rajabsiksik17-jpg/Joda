"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, CircleDashed, Copy, ExternalLink, Link2, Link2Off, RefreshCw, ShieldCheck } from "lucide-react";
import { useAdminI18n } from "@/components/admin/i18n";
import { actionErrorText } from "@/components/admin/fields/env";
import { Badge, Button, Card, ConfirmDialog, FieldShell, Input, Select } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { disconnectGoogleAction, loadGoogleChoices, removeGoogleCredentials, saveGoogleCredentials, saveGoogleTargets, testSiteVerification } from "./actions";

type State = "ok" | "warn" | "off";

export function IntegrationStatusBar({ items }: { items: { label: string; state: State; detail: string }[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((i) => (
        <li key={i.label} className={cn("rounded-lg border bg-white p-4", i.state === "ok" ? "border-emerald-200" : i.state === "warn" ? "border-amber-200" : "border-line")}>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            {i.state === "ok" ? <CheckCircle2 className="size-4 text-emerald-600" /> : i.state === "warn" ? <AlertTriangle className="size-4 text-amber-600" /> : <CircleDashed className="size-4 text-muted" />}
            {i.label}
          </p>
          <p className="mt-1 truncate text-xs text-muted" title={i.detail}>{i.detail}</p>
        </li>
      ))}
    </ul>
  );
}

type GoogleView = {
  clientId: string;
  hasSecret: boolean;
  connected: boolean;
  accountEmail: string;
  connectedAt: string;
  ga4Property: string;
  ga4PropertyName: string;
  searchConsoleSite: string;
  lastSyncAt: string;
  lastError: string;
  scopes: string[];
};

const FLASH: Record<string, [string, string, "success" | "error"]> = {
  connected: ["Google account connected.", "تم ربط حساب Google.", "success"],
  denied: ["Access was not granted in Google.", "لم يتم منح الصلاحية في Google.", "error"],
  state_mismatch: ["The connection request expired or was not started here. Try again.", "انتهت صلاحية طلب الربط أو لم يبدأ من هنا. حاول مجدداً.", "error"],
  auth_failed: ["Google rejected the credentials. Check the Client ID, secret and redirect URI.", "رفض Google بيانات الاعتماد. تحقق من Client ID والسر ورابط إعادة التوجيه.", "error"],
  not_configured: ["Save the Google API credentials first.", "احفظ بيانات اعتماد Google API أولاً.", "error"],
  error: ["The connection could not be completed. Try again.", "تعذّر إكمال الربط. حاول مجدداً.", "error"],
};

export function GoogleIntegration({ initial, redirectUri, siteOrigin, flash }: { initial: GoogleView; redirectUri: string; siteOrigin: string; flash: string }) {
  const { tx, locale } = useAdminI18n();
  const router = useRouter();
  const [clientId, setClientId] = useState(initial.clientId);
  const [secret, setSecret] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [choices, setChoices] = useState<{ properties: { id: string; name: string }[]; sites: { url: string; permission: string }[]; errors: { analytics?: string; searchConsole?: string } } | null>(null);
  const [property, setProperty] = useState(initial.ga4Property);
  const [site, setSite] = useState(initial.searchConsoleSite);
  const [confirm, setConfirm] = useState<"disconnect" | "remove" | null>(null);

  useEffect(() => {
    const f = FLASH[flash];
    if (f) {
      if (f[2] === "success") toast.success(tx(f[0], f[1]));
      else toast.error(tx(f[0], f[1]));
      router.replace("/admin/integrations");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash]);

  const saveCreds = async () => {
    setBusy("creds");
    const r = await saveGoogleCredentials({ clientId, clientSecret: secret });
    setBusy(null);
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      return toast.error(actionErrorText(r.error, tx));
    }
    setErrors({});
    setSecret("");
    toast.success(tx("Credentials saved.", "تم حفظ بيانات الاعتماد."));
    router.refresh();
  };

  const load = async () => {
    setBusy("load");
    const r = await loadGoogleChoices();
    setBusy(null);
    if (!r.ok) return toast.error(actionErrorText(r.error, tx));
    setChoices(r.data!);
    if (r.data!.errors.analytics || r.data!.errors.searchConsole) toast.warning(tx("Connected, but part of the data could not be read — see the details below.", "تم الاتصال، لكن تعذّر قراءة جزء من البيانات — راجع التفاصيل أدناه."));
    else toast.success(tx("Connection works.", "الاتصال يعمل."));
    router.refresh();
  };

  const saveTargets = async () => {
    setBusy("targets");
    const name = choices?.properties.find((p) => p.id === property)?.name ?? (property === initial.ga4Property ? initial.ga4PropertyName : "");
    const r = await saveGoogleTargets({ ga4Property: property, ga4PropertyName: name, searchConsoleSite: site });
    setBusy(null);
    if (!r.ok) return toast.error(actionErrorText(r.error, tx));
    toast.success(tx("Reporting properties saved.", "تم حفظ خصائص التقارير."));
    router.refresh();
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    toast.success(tx("Copied", "تم النسخ"));
  };

  const hasClient = !!initial.clientId && initial.hasSecret;
  // Full-page navigation: the route redirects to Google's consent screen.
  const startConnect = () => window.location.assign("/api/admin/google/connect");
  const propertyOptions = choices?.properties ?? (initial.ga4Property ? [{ id: initial.ga4Property, name: initial.ga4PropertyName || initial.ga4Property }] : []);
  const siteOptions = choices?.sites ?? (initial.searchConsoleSite ? [{ url: initial.searchConsoleSite, permission: "" }] : []);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-semibold text-ink">{tx("2 · Google account (Analytics & Search Console data)", "2 · حساب Google (بيانات التحليلات و Search Console)")}</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-muted">{tx("A read-only OAuth connection lets the dashboard show your real Google Analytics and Search Console numbers. Nothing is shown until it is connected.", "يتيح ربط OAuth للقراءة فقط عرض أرقامك الحقيقية من Google Analytics و Search Console في لوحة التحكم. لا يُعرض أي رقم قبل الربط.")}</p>
        </div>
        {initial.connected ? <Badge tone="success"><CheckCircle2 className="size-3" />{tx("Connected", "مرتبط")}</Badge> : <Badge>{tx("Not connected", "غير مرتبط")}</Badge>}
      </div>

      <div className="space-y-6 p-5">
        {/* Step A: credentials */}
        <details className="group rounded-md border border-line bg-surface/40 p-4" open={!hasClient}>
          <summary className="cursor-pointer text-sm font-semibold text-ink">{tx("How to create Google API credentials", "كيف تنشئ بيانات اعتماد Google API")}</summary>
          <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-sm text-body">
            <li>{tx("In Google Cloud Console, create a project (or choose one).", "في Google Cloud Console أنشئ مشروعاً (أو اختر مشروعاً).")}</li>
            <li>{tx("Enable: Google Analytics Data API, Google Analytics Admin API and Google Search Console API.", "فعّل: Google Analytics Data API و Google Analytics Admin API و Google Search Console API.")}</li>
            <li>{tx("Configure the OAuth consent screen (internal or external) and add your account as a test user if the app is in testing.", "أعد شاشة موافقة OAuth (داخلية أو خارجية) وأضف حسابك كمستخدم اختبار إن كان التطبيق في وضع الاختبار.")}</li>
            <li>{tx("Create an OAuth client ID of type “Web application” with this authorized redirect URI:", "أنشئ OAuth client ID من نوع «Web application» مع رابط إعادة التوجيه المصرح به التالي:")}</li>
          </ol>
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded border border-line bg-white px-3 py-2 text-xs text-ink" dir="ltr">{redirectUri}</code>
            <Button size="sm" onClick={() => copy(redirectUri)}><Copy className="size-3.5" />{tx("Copy", "نسخ")}</Button>
          </div>
          <p className="mt-2 text-xs text-muted">{tx(`Authorized JavaScript origin: ${siteOrigin}. The redirect URI uses NEXT_PUBLIC_SITE_URL, so set it to the live domain before connecting.`, `أصل JavaScript المصرح به: ${siteOrigin}. يعتمد رابط إعادة التوجيه على NEXT_PUBLIC_SITE_URL، لذا اضبطه على النطاق المباشر قبل الربط.`)}</p>
        </details>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Client ID" htmlFor="g-client" required error={errors.clientId ? tx("Enter a valid OAuth client ID (…apps.googleusercontent.com).", "أدخل OAuth client ID صحيحاً (…apps.googleusercontent.com).") : null}>
            <Input id="g-client" value={clientId} onChange={(e) => setClientId(e.target.value)} dir="ltr" autoComplete="off" aria-invalid={!!errors.clientId} />
          </FieldShell>
          <FieldShell label="Client secret" htmlFor="g-secret" required={!initial.hasSecret} help={initial.hasSecret ? tx("Saved (encrypted). Leave empty to keep it.", "محفوظ (مشفّر). اتركه فارغاً للإبقاء عليه.") : undefined} error={errors.clientSecret ? tx("Required.", "مطلوب.") : null}>
            <Input id="g-secret" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} dir="ltr" autoComplete="new-password" placeholder={initial.hasSecret ? "••••••••" : ""} aria-invalid={!!errors.clientSecret} />
          </FieldShell>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" loading={busy === "creds"} onClick={saveCreds}>{tx("Save credentials", "حفظ بيانات الاعتماد")}</Button>
          {hasClient && !initial.connected && (
            <Button onClick={startConnect}><Link2 className="size-4" />{tx("Connect Google account", "ربط حساب Google")}</Button>
          )}
          {hasClient && (
            <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirm("remove")}>{tx("Remove credentials", "حذف بيانات الاعتماد")}</Button>
          )}
        </div>

        {/* Step B: connection */}
        {initial.connected && (
          <div className="space-y-5 border-t border-line pt-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-muted">{tx("Account", "الحساب")}</dt><dd className="font-semibold break-all text-ink" dir="ltr">{initial.accountEmail || "—"}</dd></div>
              <div><dt className="text-xs text-muted">{tx("Connected", "تاريخ الربط")}</dt><dd className="text-ink">{initial.connectedAt ? formatDateTime(initial.connectedAt, locale) : "—"}</dd></div>
              <div><dt className="text-xs text-muted">{tx("Last successful sync", "آخر مزامنة ناجحة")}</dt><dd className="text-ink">{initial.lastSyncAt ? formatDateTime(initial.lastSyncAt, locale) : tx("Not yet", "لم تتم بعد")}</dd></div>
            </dl>
            {initial.lastError && (
              <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span><strong>{tx("Last error:", "آخر خطأ:")}</strong> <span dir="ltr">{initial.lastError}</span></span></p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button loading={busy === "load"} onClick={load}><RefreshCw className="size-4" />{tx("Test connection & load properties", "اختبار الاتصال وتحميل الخصائص")}</Button>
              <Button variant="ghost" onClick={startConnect}><Link2 className="size-4" />{tx("Reconnect", "إعادة الربط")}</Button>
              <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirm("disconnect")}><Link2Off className="size-4" />{tx("Disconnect", "فصل الحساب")}</Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label={tx("Google Analytics 4 property", "خاصية Google Analytics 4")} htmlFor="g-prop" help={choices?.errors.analytics ? actionErrorText(`google_${choices.errors.analytics}`, tx) : !choices ? tx("Use “Test connection” to load the list.", "استخدم «اختبار الاتصال» لتحميل القائمة.") : undefined}>
                <Select id="g-prop" value={property} onChange={(e) => setProperty(e.target.value)}>
                  <option value="">{tx("— Not selected —", "— غير محدد —")}</option>
                  {propertyOptions.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id.replace("properties/", "")})</option>)}
                </Select>
              </FieldShell>
              <FieldShell label={tx("Search Console property", "خاصية Search Console")} htmlFor="g-site" help={choices?.errors.searchConsole ? actionErrorText(`google_${choices.errors.searchConsole}`, tx) : undefined}>
                <Select id="g-site" value={site} onChange={(e) => setSite(e.target.value)}>
                  <option value="">{tx("— Not selected —", "— غير محدد —")}</option>
                  {siteOptions.map((s) => <option key={s.url} value={s.url}>{s.url}{s.permission === "siteUnverifiedUser" ? ` (${tx("unverified", "غير موثق")})` : ""}</option>)}
                </Select>
              </FieldShell>
            </div>
            <Button variant="primary" loading={busy === "targets"} onClick={saveTargets} disabled={property === initial.ga4Property && site === initial.searchConsoleSite}>{tx("Save reporting properties", "حفظ خصائص التقارير")}</Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm === "remove" ? tx("Remove the Google credentials?", "حذف بيانات اعتماد Google؟") : tx("Disconnect the Google account?", "فصل حساب Google؟")}
        description={tx("Access is revoked at Google and the dashboard will show “Not connected” until you connect again.", "يتم إلغاء الصلاحية لدى Google وستعرض لوحة التحكم «غير مرتبط» حتى تعيد الربط.")}
        onConfirm={async () => {
          const r = confirm === "remove" ? await removeGoogleCredentials() : await disconnectGoogleAction();
          if (!r.ok) {
            toast.error(actionErrorText(r.error, tx));
            return;
          }
          toast.success(tx("Disconnected.", "تم الفصل."));
          setChoices(null);
          if (confirm === "remove") setClientId("");
          router.refresh();
        }}
      />
    </Card>
  );
}

export function VerificationCheck({ code, seoTitle }: { code: string; seoTitle: string }) {
  const { tx } = useAdminI18n();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ metaFound: boolean; url: string; googleStatus: string } | null>(null);

  const run = async () => {
    setBusy(true);
    const r = await testSiteVerification();
    setBusy(false);
    if (!r.ok) return toast.error(actionErrorText(r.error, tx));
    setResult(r.data!);
  };

  const googleText: Record<string, string> = {
    verified: tx("Google lists this site as verified for the connected account.", "يعرض Google هذا الموقع كموثق للحساب المرتبط."),
    unverified: tx("The site is in Search Console but not verified yet for this account.", "الموقع مضاف في Search Console لكنه غير موثق بعد لهذا الحساب."),
    not_listed: tx("The connected account has no Search Console property for this site yet.", "لا يملك الحساب المرتبط خاصية Search Console لهذا الموقع بعد."),
    not_connected: tx("Connect a Google account above to check the verification status at Google.", "اربط حساب Google أعلاه للتحقق من حالة التوثيق لدى Google."),
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-semibold text-ink">{tx("3 · Search Console verification", "3 · التحقق في Search Console")}</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-muted">{tx("Add a URL-prefix property in Search Console, choose “HTML tag”, and paste only the content value into the SEO settings. The tag is then added to every page.", "أضف خاصية من نوع URL-prefix في Search Console، واختر «HTML tag»، والصق قيمة content فقط في إعدادات تحسين البحث. سيُضاف الوسم إلى كل الصفحات.")}</p>
        </div>
        {code ? <Badge tone="info"><ShieldCheck className="size-3" />{tx("Code set", "الرمز مُعد")}</Badge> : <Badge>{tx("No code", "لا يوجد رمز")}</Badge>}
      </div>
      <div className="space-y-4 p-5">
        <p className="text-sm text-body">
          {code ? <>{tx("Current code:", "الرمز الحالي:")} <code className="rounded bg-surface px-1.5 py-0.5 text-xs" dir="ltr">{code}</code></> : tx("No verification code yet.", "لا يوجد رمز تحقق بعد.")}{" "}
          <Link href="/admin/seo" className="font-semibold text-tech-600 hover:underline">{tx(`Edit in ${seoTitle}`, `تعديل في ${seoTitle}`)}</Link>
        </p>
        <Button loading={busy} onClick={run}><ShieldCheck className="size-4" />{tx("Test verification", "اختبار التحقق")}</Button>
        {result && (
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              {result.metaFound ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />}
              <span>
                {result.metaFound ? tx("The verification meta tag is present on", "وسم التحقق موجود على") : tx("The verification meta tag was not found on", "لم يتم العثور على وسم التحقق في")}{" "}
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-tech-600" dir="ltr">{result.url}<ExternalLink className="size-3" /></a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              {result.googleStatus === "verified" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted" />}
              <span>{googleText[result.googleStatus]}</span>
            </li>
          </ul>
        )}
      </div>
    </Card>
  );
}
