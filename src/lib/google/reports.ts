import "server-only";
import { unstable_cache } from "next/cache";
import { googleFetch } from "./client";

export const GOOGLE_DATA_TAG = "google-data";

// ─────────────────────────── Discovery ───────────────────────────

export async function listGa4Properties() {
  type Summary = { accountSummaries?: { displayName?: string; propertySummaries?: { property: string; displayName: string }[] }[] };
  const data = await googleFetch<Summary>("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200");
  return (data.accountSummaries ?? []).flatMap((a) => (a.propertySummaries ?? []).map((p) => ({ id: p.property, name: `${p.displayName} — ${a.displayName ?? ""}`.replace(/ — $/, "") })));
}

export async function listSearchConsoleSites() {
  type Sites = { siteEntry?: { siteUrl: string; permissionLevel: string }[] };
  const data = await googleFetch<Sites>("https://www.googleapis.com/webmasters/v3/sites");
  return (data.siteEntry ?? []).map((s) => ({ url: s.siteUrl, permission: s.permissionLevel }));
}

// ─────────────────────────── GA4 Data API ───────────────────────────

export const GA_RANGES = { today: ["today", "today"], yesterday: ["yesterday", "yesterday"], "7d": ["6daysAgo", "today"], "30d": ["29daysAgo", "today"], "90d": ["89daysAgo", "today"] } as const;
export type GaRange = keyof typeof GA_RANGES;

type RunReport = { rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[] };

async function runReport(property: string, range: GaRange, body: { dimensions?: string[]; metrics: string[]; limit?: number; orderByMetric?: string }) {
  const [startDate, endDate] = GA_RANGES[range];
  const data = await googleFetch<RunReport>(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`, {
    method: "POST",
    body: {
      dateRanges: [{ startDate, endDate }],
      dimensions: (body.dimensions ?? []).map((name) => ({ name })),
      metrics: body.metrics.map((name) => ({ name })),
      ...(body.limit ? { limit: body.limit } : {}),
      ...(body.orderByMetric ? { orderBys: [{ metric: { metricName: body.orderByMetric }, desc: true }] } : {}),
    },
  });
  return (data.rows ?? []).map((r) => ({ dims: (r.dimensionValues ?? []).map((d) => d.value), values: (r.metricValues ?? []).map((m) => Number(m.value) || 0) }));
}

export type GaReport = {
  totals: { users: number; newUsers: number; sessions: number; views: number; engagementRate: number; avgSessionSeconds: number };
  trend: { date: string; users: number }[];
  pages: { path: string; title: string; views: number; users: number }[];
  channels: { name: string; sessions: number }[];
  countries: { name: string; users: number }[];
  devices: { name: string; users: number }[];
  browsers: { name: string; users: number }[];
  newVsReturning: { name: string; users: number }[];
  fetchedAt: string;
};

async function fetchGaReport(property: string, range: GaRange): Promise<GaReport> {
  const [totals, trend, pages, channels, countries, devices, browsers, nvr] = await Promise.all([
    runReport(property, range, { metrics: ["activeUsers", "newUsers", "sessions", "screenPageViews", "engagementRate", "averageSessionDuration"] }),
    runReport(property, range, { dimensions: ["date"], metrics: ["activeUsers"] }),
    runReport(property, range, { dimensions: ["pagePath", "pageTitle"], metrics: ["screenPageViews", "activeUsers"], limit: 10, orderByMetric: "screenPageViews" }),
    runReport(property, range, { dimensions: ["sessionDefaultChannelGroup"], metrics: ["sessions"], limit: 8, orderByMetric: "sessions" }),
    runReport(property, range, { dimensions: ["country"], metrics: ["activeUsers"], limit: 8, orderByMetric: "activeUsers" }),
    runReport(property, range, { dimensions: ["deviceCategory"], metrics: ["activeUsers"], orderByMetric: "activeUsers" }),
    runReport(property, range, { dimensions: ["browser"], metrics: ["activeUsers"], limit: 6, orderByMetric: "activeUsers" }),
    runReport(property, range, { dimensions: ["newVsReturning"], metrics: ["activeUsers"] }),
  ]);
  const t = totals[0]?.values ?? [];
  return {
    totals: { users: t[0] ?? 0, newUsers: t[1] ?? 0, sessions: t[2] ?? 0, views: t[3] ?? 0, engagementRate: t[4] ?? 0, avgSessionSeconds: t[5] ?? 0 },
    trend: trend.map((r) => ({ date: r.dims[0], users: r.values[0] })).sort((a, b) => a.date.localeCompare(b.date)),
    pages: pages.map((r) => ({ path: r.dims[0], title: r.dims[1], views: r.values[0], users: r.values[1] })),
    channels: channels.map((r) => ({ name: r.dims[0], sessions: r.values[0] })),
    countries: countries.map((r) => ({ name: r.dims[0], users: r.values[0] })),
    devices: devices.map((r) => ({ name: r.dims[0], users: r.values[0] })),
    browsers: browsers.map((r) => ({ name: r.dims[0], users: r.values[0] })),
    newVsReturning: nvr.filter((r) => r.dims[0] && r.dims[0] !== "(not set)").map((r) => ({ name: r.dims[0], users: r.values[0] })),
    fetchedAt: new Date().toISOString(),
  };
}

/** Cached for 15 minutes per property and range; the admin "Refresh" button clears the cache. */
export const getGaReport = unstable_cache(fetchGaReport, ["ga-report"], { tags: [GOOGLE_DATA_TAG], revalidate: 900 });

// ─────────────────────────── Search Console API ───────────────────────────

export type ScRange = { start: string; end: string };

export function scRangeFor(preset: string, from?: string, to?: string): ScRange & { preset: string } {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const valid = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
  if (preset === "custom" && valid(from) && valid(to) && from! <= to!) return { preset, start: from!, end: to! };
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 28;
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 86_400_000);
  return { preset: preset === "7d" || preset === "90d" ? preset : "28d", start: iso(start), end: iso(end) };
}

type ScQuery = { rows?: { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[] };

async function scQuery(site: string, range: ScRange, dimensions: string[], rowLimit = 10) {
  const data = await googleFetch<ScQuery>(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: "POST",
    body: { startDate: range.start, endDate: range.end, dimensions, rowLimit, dataState: "all" },
  });
  return (data.rows ?? []).map((r) => ({ key: r.keys?.[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
}

export type ScReport = {
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  trend: { date: string; clicks: number; impressions: number }[];
  queries: { key: string; clicks: number; impressions: number; ctr: number; position: number }[];
  pages: { key: string; clicks: number; impressions: number; ctr: number; position: number }[];
  countries: { key: string; clicks: number; impressions: number }[];
  devices: { key: string; clicks: number; impressions: number }[];
  fetchedAt: string;
};

async function fetchScReport(site: string, start: string, end: string): Promise<ScReport> {
  const range = { start, end };
  const [totals, trend, queries, pages, countries, devices] = await Promise.all([
    scQuery(site, range, [], 1),
    scQuery(site, range, ["date"], 500),
    scQuery(site, range, ["query"], 10),
    scQuery(site, range, ["page"], 10),
    scQuery(site, range, ["country"], 8),
    scQuery(site, range, ["device"], 5),
  ]);
  const t = totals[0];
  return {
    totals: { clicks: t?.clicks ?? 0, impressions: t?.impressions ?? 0, ctr: t?.ctr ?? 0, position: t?.position ?? 0 },
    trend: trend.map((r) => ({ date: r.key, clicks: r.clicks, impressions: r.impressions })).sort((a, b) => a.date.localeCompare(b.date)),
    queries,
    pages,
    countries: countries.map((r) => ({ key: r.key, clicks: r.clicks, impressions: r.impressions })),
    devices: devices.map((r) => ({ key: r.key, clicks: r.clicks, impressions: r.impressions })),
    fetchedAt: new Date().toISOString(),
  };
}

export const getScReport = unstable_cache(fetchScReport, ["sc-report"], { tags: [GOOGLE_DATA_TAG], revalidate: 900 });
