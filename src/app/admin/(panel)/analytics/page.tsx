import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BarChart3, Plug, Search } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { formatDateTime } from "@/lib/format";
import { GoogleApiError, getGoogleConfig, recordSync } from "@/lib/google/client";
import { GA_RANGES, getGaReport, getScReport, scRangeFor, type GaRange, type GaReport, type ScReport } from "@/lib/google/reports";
import { cn } from "@/lib/cn";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { RefreshButton } from "./refresh-button";

export const metadata: Metadata = { title: "Analytics" };

type SP = { tab?: string; range?: string; from?: string; to?: string };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requirePage("analytics.view");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const sp = await searchParams;
  const tab = sp.tab === "search" ? "search" : "analytics";
  const g = await getGoogleConfig();
  const canConfigure = user.permissions.has("settings.edit");
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-JO-u-nu-latn" : "en-GB");
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  const notConnected = (
    <EmptyState
      icon={<Plug className="size-5" />}
      title={tx("Not connected", "غير مرتبط")}
      text={
        !g.connected
          ? tx("Connect a Google account to see real Analytics and Search Console data here. No numbers are shown until then.", "اربط حساب Google لعرض بيانات التحليلات و Search Console الحقيقية هنا. لا تُعرض أي أرقام قبل ذلك.")
          : tab === "analytics"
            ? tx("Choose the Google Analytics 4 property to report on.", "اختر خاصية Google Analytics 4 التي تريد عرض تقاريرها.")
            : tx("Choose the Search Console property to report on.", "اختر خاصية Search Console التي تريد عرض تقاريرها.")
      }
      action={canConfigure ? <Link href="/admin/integrations" className="inline-flex h-10 items-center rounded-md bg-tech-600 px-4 text-sm font-medium text-white hover:bg-tech-700">{tx("Open integrations", "فتح التكاملات")}</Link> : undefined}
    />
  );

  const tabs = [
    { id: "analytics", label: "Google Analytics", icon: BarChart3 },
    { id: "search", label: "Search Console", icon: Search },
  ];

  let body: React.ReactNode = notConnected;
  let errorBox: React.ReactNode = null;
  const errorView = (e: unknown) => {
    const code = e instanceof GoogleApiError ? e.code : "api";
    const msg: Record<string, string> = {
      auth: tx("The Google connection has expired or was revoked. Reconnect the account in Integrations.", "انتهت صلاحية ربط Google أو أُلغي. أعد ربط الحساب من صفحة التكاملات."),
      permission: tx("The connected account cannot read this property, or the required API is not enabled in Google Cloud.", "لا يستطيع الحساب المرتبط قراءة هذه الخاصية، أو أن الواجهة البرمجية المطلوبة غير مفعّلة في Google Cloud."),
      quota: tx("Google's request limit was reached. Try again in a few minutes.", "تم بلوغ حد الطلبات لدى Google. حاول بعد دقائق."),
      network: tx("Google could not be reached from the server.", "تعذّر الوصول إلى Google من الخادم."),
    };
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">{tx("Data could not be loaded", "تعذّر تحميل البيانات")}</p>
          <p className="mt-1">{msg[code] ?? tx("Google returned an error.", "أعاد Google خطأ.")}</p>
          <p className="mt-1 text-xs opacity-75" dir="ltr">{e instanceof Error ? e.message : String(e)}</p>
        </div>
      </div>
    );
  };

  let fetchedAt = "";
  let rangeBar: React.ReactNode = null;
  let ga: GaReport | null = null;
  let sc: ScReport | null = null;
  let failure: unknown = null;

  if (tab === "analytics") {
    const range = (Object.keys(GA_RANGES).includes(sp.range ?? "") ? sp.range : "30d") as GaRange;
    const labels: Record<GaRange, string> = { today: tx("Today", "اليوم"), yesterday: tx("Yesterday", "أمس"), "7d": tx("Last 7 days", "آخر 7 أيام"), "30d": tx("Last 30 days", "آخر 30 يوماً"), "90d": tx("Last 90 days", "آخر 90 يوماً") };
    rangeBar = <RangeLinks current={range} items={(Object.keys(GA_RANGES) as GaRange[]).map((k) => ({ id: k, label: labels[k], href: `/admin/analytics?tab=analytics&range=${k}` }))} />;
    if (g.connected && g.ga4Property) {
      try {
        ga = await getGaReport(g.ga4Property, range);
        fetchedAt = ga.fetchedAt;
        if (!g.lastSyncAt || g.lastError) await recordSync();
      } catch (e) {
        await recordSync(e);
        failure = e;
      }
    }
  } else {
    const range = scRangeFor(sp.range ?? "28d", sp.from, sp.to);
    const labels: Record<string, string> = { "7d": tx("7 days", "7 أيام"), "28d": tx("28 days", "28 يوماً"), "90d": tx("3 months", "3 أشهر") };
    rangeBar = (
      <div className="flex flex-wrap items-center gap-2">
        <RangeLinks current={range.preset} items={["7d", "28d", "90d"].map((k) => ({ id: k, label: labels[k], href: `/admin/analytics?tab=search&range=${k}` }))} />
        <form action="/admin/analytics" className="flex flex-wrap items-center gap-1.5 text-sm">
          <input type="hidden" name="tab" value="search" />
          <input type="hidden" name="range" value="custom" />
          <input type="date" name="from" defaultValue={range.preset === "custom" ? range.start : ""} className="h-9 rounded-md border border-line-strong bg-white px-2 text-sm" aria-label={tx("From", "من")} required />
          <span className="text-muted">–</span>
          <input type="date" name="to" defaultValue={range.preset === "custom" ? range.end : ""} className="h-9 rounded-md border border-line-strong bg-white px-2 text-sm" aria-label={tx("To", "إلى")} required />
          <button className={cn("h-9 rounded-md px-3 text-sm font-medium", range.preset === "custom" ? "bg-navy text-white" : "border border-line-strong bg-white text-ink")}>{tx("Custom range", "مدة مخصصة")}</button>
        </form>
      </div>
    );
    if (g.connected && g.searchConsoleSite) {
      try {
        sc = await getScReport(g.searchConsoleSite, range.start, range.end);
        fetchedAt = sc.fetchedAt;
        if (!g.lastSyncAt || g.lastError) await recordSync();
      } catch (e) {
        await recordSync(e);
        failure = e;
      }
    }
  }

  if (ga) body = <GaView r={ga} nf={nf} pct={pct} tx={tx} />;
  if (sc) body = <ScView r={sc} nf={nf} pct={pct} tx={tx} site={g.searchConsoleSite} />;
  if (failure) {
    errorBox = errorView(failure);
    body = null;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={tx("Analytics", "التحليلات")}
        description={tx("Real figures from Google Analytics 4 and Google Search Console for this website.", "أرقام حقيقية من Google Analytics 4 و Google Search Console لهذا الموقع.")}
        actions={g.connected ? <RefreshButton /> : undefined}
      />
      <nav className="flex gap-1 border-b border-line" aria-label={tx("Data source", "مصدر البيانات")}>
        {tabs.map((t) => (
          <Link key={t.id} href={`/admin/analytics?tab=${t.id}`} aria-current={tab === t.id ? "page" : undefined} className={cn("-mb-px inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium", tab === t.id ? "border-tech text-ink" : "border-transparent text-muted hover:text-ink")}>
            <t.icon className="size-4" />
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {rangeBar}
        {fetchedAt && <p className="text-xs text-muted">{tx("Updated", "آخر تحديث")} {formatDateTime(fetchedAt, locale)}{g.accountEmail && <> · <span dir="ltr">{g.accountEmail}</span></>}</p>}
      </div>
      {errorBox}
      {body}
    </div>
  );
}

function RangeLinks({ current, items }: { current: string; items: { id: string; label: string; href: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((i) => (
        <Link key={i.id} href={i.href} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", current === i.id ? "bg-navy text-white" : "text-ink hover:bg-white")}>{i.label}</Link>
      ))}
    </div>
  );
}

type Tx = (en: string, ar: string) => string;

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink" dir="ltr">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Trend({ points, label }: { points: { date: string; value: number }[]; label: string }) {
  if (points.length < 2) return null;
  const max = Math.max(1, ...points.map((p) => p.value));
  const w = 100 / points.length;
  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-semibold text-ink">{label}</p>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-28 w-full" role="img" aria-label={label}>
        {points.map((p, i) => {
          const h = (p.value / max) * 28;
          return <rect key={p.date} x={i * w + w * 0.15} y={30 - h} width={w * 0.7} height={Math.max(h, 0.4)} className="fill-tech-600/80"><title>{`${p.date}: ${p.value}`}</title></rect>;
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[0.7rem] text-muted" dir="ltr"><span>{points[0].date}</span><span>{points[points.length - 1].date}</span></div>
    </Card>
  );
}

function BarList({ title, rows, nf }: { title: string; rows: { label: string; value: number; hint?: string }[]; nf: Intl.NumberFormat }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-semibold text-ink">{title}</p>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">—</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="relative overflow-hidden rounded">
              <span className="absolute inset-y-0 start-0 bg-sky-50" style={{ width: `${(r.value / max) * 100}%` }} aria-hidden />
              <span className="relative flex items-center justify-between gap-3 px-2 py-1.5 text-sm">
                <span className="min-w-0 truncate text-ink" dir="auto" title={r.label}>{r.label}</span>
                <span className="shrink-0 font-semibold text-ink" dir="ltr">{nf.format(r.value)}{r.hint && <span className="ms-2 text-xs font-normal text-muted">{r.hint}</span>}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function GaView({ r, nf, pct, tx }: { r: GaReport; nf: Intl.NumberFormat; pct: (v: number) => string; tx: Tx }) {
  const mins = Math.floor(r.totals.avgSessionSeconds / 60);
  const secs = Math.round(r.totals.avgSessionSeconds % 60);
  const empty = r.totals.users === 0 && r.totals.views === 0;
  return (
    <div className="space-y-5">
      {empty && <p className="rounded-md border border-line bg-white px-4 py-3 text-sm text-muted">{tx("Google Analytics has no data for this period yet. New properties can take up to 48 hours to show data.", "لا توجد بيانات في Google Analytics لهذه الفترة بعد. قد تستغرق الخصائص الجديدة حتى 48 ساعة لإظهار البيانات.")}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Metric label={tx("Users", "المستخدمون")} value={nf.format(r.totals.users)} />
        <Metric label={tx("New users", "مستخدمون جدد")} value={nf.format(r.totals.newUsers)} />
        <Metric label={tx("Sessions", "الجلسات")} value={nf.format(r.totals.sessions)} />
        <Metric label={tx("Page views", "مشاهدات الصفحات")} value={nf.format(r.totals.views)} />
        <Metric label={tx("Engagement rate", "معدل التفاعل")} value={pct(r.totals.engagementRate)} />
        <Metric label={tx("Avg. session", "متوسط الجلسة")} value={`${mins}:${String(secs).padStart(2, "0")}`} />
      </div>
      <Trend points={r.trend.map((p) => ({ date: `${p.date.slice(0, 4)}-${p.date.slice(4, 6)}-${p.date.slice(6)}`, value: p.users }))} label={tx("Users per day", "المستخدمون يومياً")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title={tx("Top pages", "أكثر الصفحات زيارة")} nf={nf} rows={r.pages.map((p) => ({ label: p.title && p.title !== "(not set)" ? `${p.title} — ${p.path}` : p.path, value: p.views }))} />
        <BarList title={tx("Traffic sources", "مصادر الزيارات")} nf={nf} rows={r.channels.map((c) => ({ label: c.name, value: c.sessions }))} />
        <BarList title={tx("Countries", "الدول")} nf={nf} rows={r.countries.map((c) => ({ label: c.name, value: c.users }))} />
        <BarList title={tx("Devices", "الأجهزة")} nf={nf} rows={r.devices.map((d) => ({ label: d.name, value: d.users }))} />
        <BarList title={tx("Browsers", "المتصفحات")} nf={nf} rows={r.browsers.map((b) => ({ label: b.name, value: b.users }))} />
        <BarList title={tx("New vs returning", "جدد مقابل عائدين")} nf={nf} rows={r.newVsReturning.map((n) => ({ label: n.name === "new" ? tx("New", "جدد") : n.name === "returning" ? tx("Returning", "عائدون") : n.name, value: n.users }))} />
      </div>
    </div>
  );
}

function ScView({ r, nf, pct, tx, site }: { r: ScReport; nf: Intl.NumberFormat; pct: (v: number) => string; tx: Tx; site: string }) {
  const empty = r.totals.impressions === 0;
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted">{tx("Property", "الخاصية")}: <span dir="ltr">{site}</span> · {tx("Search Console data usually lags by 2–3 days.", "تتأخر بيانات Search Console عادةً يومين إلى ثلاثة أيام.")}</p>
      {empty && <p className="rounded-md border border-line bg-white px-4 py-3 text-sm text-muted">{tx("No search data for this period yet.", "لا توجد بيانات بحث لهذه الفترة بعد.")}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label={tx("Clicks", "النقرات")} value={nf.format(r.totals.clicks)} />
        <Metric label={tx("Impressions", "مرات الظهور")} value={nf.format(r.totals.impressions)} />
        <Metric label={tx("CTR", "نسبة النقر")} value={pct(r.totals.ctr)} />
        <Metric label={tx("Avg. position", "متوسط الترتيب")} value={r.totals.position ? r.totals.position.toFixed(1) : "—"} />
      </div>
      <Trend points={r.trend.map((p) => ({ date: p.date, value: p.clicks }))} label={tx("Clicks per day", "النقرات يومياً")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title={tx("Top queries", "أهم عبارات البحث")} nf={nf} rows={r.queries.map((q) => ({ label: q.key, value: q.clicks, hint: `${nf.format(q.impressions)} · #${q.position.toFixed(1)}` }))} />
        <BarList title={tx("Top pages", "أهم الصفحات")} nf={nf} rows={r.pages.map((p) => ({ label: p.key.replace(/^https?:\/\/[^/]+/, ""), value: p.clicks, hint: nf.format(p.impressions) }))} />
        <BarList title={tx("Countries", "الدول")} nf={nf} rows={r.countries.map((c) => ({ label: c.key.toUpperCase(), value: c.clicks, hint: nf.format(c.impressions) }))} />
        <BarList title={tx("Devices", "الأجهزة")} nf={nf} rows={r.devices.map((d) => ({ label: d.key, value: d.clicks, hint: nf.format(d.impressions) }))} />
      </div>
    </div>
  );
}
