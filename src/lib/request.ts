import "server-only";
import { headers } from "next/headers";

/**
 * Client IP for rate limiting and audit logs.
 * Behind a reverse proxy set TRUST_PROXY=true so the first X-Forwarded-For entry is used.
 */
export async function getRequestMeta(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  let ip = "";
  if (process.env.TRUST_PROXY === "true") {
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "";
  }
  if (!ip) ip = h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return { ip: ip.slice(0, 64), userAgent: (h.get("user-agent") ?? "").slice(0, 400) };
}

/**
 * Best-effort visitor country without asking for location permission:
 * CDN/edge geo headers first, then the region of the preferred browser language, then the configured default.
 */
export async function guessCountry(fallback: string, regional: string[] = []): Promise<{ code: string; source: "geo" | "language" | "default" }> {
  const h = await headers();
  for (const name of ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-country-code", "x-geo-country"]) {
    const v = h.get(name)?.trim().toUpperCase();
    if (v && /^[A-Z]{2}$/.test(v) && v !== "XX" && v !== "T1") return { code: v, source: "geo" };
  }
  const lang = h.get("accept-language") ?? "";
  for (const part of lang.split(",")) {
    const m = part.trim().match(/^[a-z]{2,3}-([a-z]{2})\b/i);
    if (m) return { code: m[1].toUpperCase(), source: "language" };
  }
  return { code: fallback, source: "default" };
}
