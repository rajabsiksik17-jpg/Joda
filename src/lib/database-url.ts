/**
 * Makes hosted PostgreSQL URLs work without hand-editing:
 * - remote hosts get SSL (encrypted, without CA pinning — what Supabase and most managed hosts
 *   expect) unless the URL already sets `sslmode`;
 * - for migrations, a Supabase transaction pooler (port 6543) is swapped for the session pooler
 *   (port 5432), because migrations cannot run through a transaction pooler.
 * Kept dependency-free so it can be used by the app, prisma.config.ts and scripts.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function normalizeDatabaseUrl(raw: string, purpose: "app" | "migrate" = "app"): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  const host = url.hostname;
  if (!LOCAL_HOSTS.has(host) && !url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
  // node-postgres treats sslmode=require as full verification unless libpq-compatible semantics are
  // requested; Prisma's migration engine already uses libpq semantics and does not know the flag.
  if (purpose === "app" && url.searchParams.get("sslmode") === "require" && !url.searchParams.has("uselibpqcompat")) url.searchParams.set("uselibpqcompat", "true");
  if (purpose === "migrate") url.searchParams.delete("uselibpqcompat");
  if (purpose === "migrate" && host.endsWith(".pooler.supabase.com") && url.port === "6543") {
    url.port = "5432";
    url.searchParams.delete("pgbouncer");
  }
  return url.toString();
}
