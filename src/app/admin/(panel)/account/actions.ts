"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { hashPassword, passwordPolicyError, verifyPassword } from "@/lib/auth/password";
import { AuthError, getCurrentUser } from "@/lib/auth/session";
import { guarded, type ActionResult } from "@/lib/actions";
import { ADMIN_LOCALE_COOKIE } from "@/lib/i18n/admin-locale";
import { rateLimit } from "@/lib/rate-limit";
import { currentDeviceId } from "@/lib/auth/trusted-device";

async function me() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("unauthenticated");
  return user;
}

export async function updateProfile(input: unknown): Promise<ActionResult> {
  return guarded(async () => {
    const user = await me();
    const data = z.object({ name: z.string().trim().min(2).max(120), preferredLocale: z.enum(["ar", "en"]) }).parse(input);
    await db.user.update({ where: { id: user.id }, data });
    (await cookies()).set(ADMIN_LOCALE_COOKIE, data.preferredLocale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    await audit({ action: "account.update", userId: user.id, actorEmail: user.email });
    return { ok: true };
  });
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    const user = await me();
    const limit = await rateLimit(`pwchange:${user.id}`, 5, 900);
    if (!limit.ok) return { ok: false, error: "rate_limited" };
    const { current, next, confirm } = z.object({ current: z.string().max(200), next: z.string().max(200), confirm: z.string().max(200) }).parse(input);
    const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await verifyPassword(row.passwordHash, current))) return { ok: false, error: "invalid", fieldErrors: { current: "wrong_password" } };
    const policy = passwordPolicyError(next);
    if (policy) return { ok: false, error: "invalid", fieldErrors: { next: policy } };
    if (next !== confirm) return { ok: false, error: "invalid", fieldErrors: { confirm: "mismatch" } };
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next), passwordChangedAt: new Date() } });
    // Sign out every other device and forget trusted browsers except this one.
    await db.session.deleteMany({ where: { userId: user.id, id: { not: user.sessionId } } });
    const thisDevice = await currentDeviceId();
    await db.trustedDevice.deleteMany({ where: { userId: user.id, ...(thisDevice ? { id: { not: thisDevice } } : {}) } });
    await audit({ action: "account.password_change", userId: user.id, actorEmail: user.email });
    return { ok: true };
  });
}

export async function revokeSession(sessionId: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await me();
    if (sessionId === user.sessionId) return { ok: false, error: "self" };
    await db.session.deleteMany({ where: { id: z.string().max(64).parse(sessionId), userId: user.id } });
    await audit({ action: "user.revoke_sessions", userId: user.id, actorEmail: user.email, metadata: { sessionId } });
    return { ok: true };
  });
}

export async function revokeTrustedDevice(deviceId: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await me();
    await db.trustedDevice.deleteMany({ where: { id: z.string().max(64).parse(deviceId), userId: user.id } });
    await audit({ action: "user.revoke_sessions", userId: user.id, actorEmail: user.email, metadata: { trustedDevice: deviceId } });
    return { ok: true };
  });
}
