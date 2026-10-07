import "server-only";
import { db } from "./db";

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

/**
 * Fixed-window rate limiter backed by PostgreSQL, so limits hold across server instances.
 * The upsert is a single atomic statement.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, NOW() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN NOW() + make_interval(secs => ${windowSeconds}) ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  const row = rows[0];
  const retryAfterSeconds = Math.max(0, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000));
  return { ok: row.count <= limit, remaining: Math.max(0, limit - row.count), retryAfterSeconds };
}

export async function resetRateLimit(key: string) {
  await db.rateLimit.deleteMany({ where: { key } });
}

/** Opportunistic cleanup of expired windows. */
export async function pruneRateLimits() {
  await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 60_000) } } });
}
