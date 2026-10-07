"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { verifyPassword } from "@/lib/auth/password";
import { CHALLENGE_COOKIE, createSession, destroySession, getCurrentUser, secureCookies } from "@/lib/auth/session";
import { createChallenge, rotateChallengeCode, verifyChallenge } from "@/lib/auth/otp";
import { checkTrustedDevice, touchTrustedDevice, trustCurrentDevice } from "@/lib/auth/trusted-device";
import { isEmailVerificationAvailable } from "@/lib/email/status";
import { sendMail } from "@/lib/email/mailer";
import { otpEmail } from "@/lib/email/templates";
import { ADMIN_LOCALE_COOKIE } from "@/lib/i18n/admin-locale";
import { isLocale } from "@/lib/i18n/config";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { readSetting } from "@/lib/settings";

export type AuthState = { error?: string; retryAfter?: number; remaining?: number; info?: string } | null;

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) });

/** Completes a successful sign-in: session, language preference, audit entry. */
async function finishSignIn(user: { id: string; email: string; preferredLocale: string }, sessionHours: number, metadata: Record<string, unknown>) {
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null } });
  await createSession(user.id, sessionHours);
  await resetRateLimit(`login:email:${user.email}`);
  (await cookies()).set(ADMIN_LOCALE_COOKIE, user.preferredLocale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  await audit({ action: "auth.login_success", userId: user.id, actorEmail: user.email, metadata });
}

/**
 * Decides whether this sign-in needs an e-mailed code:
 * never while the e-mail system isn't active; otherwise for new/unrecognised devices, after recent
 * failed attempts, or always when the policy is "every sign-in".
 */
async function verificationRequirement(user: { id: string }, recentFailures: number): Promise<{ required: false; reason: string; deviceId?: string } | { required: true; reason: string }> {
  if (!(await isEmailVerificationAvailable())) return { required: false, reason: "email_inactive" };
  const security = await readSetting("security");
  if (security.otpMode === "every_login") return { required: true, reason: "policy_every_login" };
  if (recentFailures > 0) return { required: true, reason: "recent_failed_attempts" };
  const device = await checkTrustedDevice(user.id);
  if (!device.trusted) return { required: true, reason: device.reason === "no_device" ? "new_device" : device.reason };
  return { required: false, reason: "trusted_device", deviceId: device.deviceId };
}

async function setChallengeCookie(id: string, minutes: number) {
  (await cookies()).set(CHALLENGE_COOKIE, id, { httpOnly: true, secure: secureCookies, sameSite: "strict", path: "/admin", maxAge: minutes * 60 + 120 });
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "invalid_input" };
  const { email, password } = parsed.data;
  const { ip } = await getRequestMeta();
  const security = await readSetting("security");

  // Throttle per IP and per account to defeat password spraying and brute force.
  const [byIp, byEmail] = await Promise.all([rateLimit(`login:ip:${ip}`, 20, 900), rateLimit(`login:email:${email}`, 10, 900)]);
  if (!byIp.ok || !byEmail.ok) {
    await audit({ action: "auth.login_rate_limited", actorEmail: email, metadata: { ip } });
    return { error: "rate_limited", retryAfter: Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds) };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    await audit({ action: "auth.login_locked", userId: user.id, actorEmail: email });
    return { error: "locked", retryAfter: Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000) };
  }

  const valid = await verifyPassword(user?.passwordHash ?? null, password);
  if (!user || !valid || !user.isActive) {
    if (user) {
      const failed = user.failedLoginCount + 1;
      const lock = failed >= security.maxFailedLogins;
      await db.user.update({
        where: { id: user.id },
        data: { failedLoginCount: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + security.lockoutMinutes * 60_000) : null },
      });
      if (lock) await audit({ action: "auth.account_locked", userId: user.id, actorEmail: email, metadata: { minutes: security.lockoutMinutes } });
    }
    await audit({ action: "auth.login_failed", userId: user?.id, actorEmail: email, metadata: { reason: !user ? "unknown_email" : !user.isActive ? "inactive" : "bad_password" } });
    // Same message for every failure so accounts cannot be enumerated.
    return { error: "invalid_credentials" };
  }

  const requirement = await verificationRequirement(user, user.failedLoginCount);
  if (!requirement.required) {
    if (requirement.deviceId) await touchTrustedDevice(requirement.deviceId);
    await finishSignIn(user, security.sessionHours, { verification: "none", reason: requirement.reason });
    redirect("/admin");
  }

  await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
  const { challenge, code } = await createChallenge(user.id, security.otpTtlMinutes, ip);
  const locale = isLocale(user.preferredLocale) ? user.preferredLocale : "ar";
  const sent = await sendMail({ to: user.email, ...otpEmail(locale, code, security.otpTtlMinutes, user.name) });
  if (!sent.ok) {
    await audit({ action: "auth.otp_send_failed", userId: user.id, actorEmail: email, metadata: { error: sent.error } });
    return { error: "otp_send_failed" };
  }
  await audit({ action: "auth.otp_requested", userId: user.id, actorEmail: email, metadata: { reason: requirement.reason } });
  await setChallengeCookie(challenge.id, security.otpTtlMinutes);
  redirect("/admin/verify");
}

export async function verifyOtpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const jar = await cookies();
  const challengeId = jar.get(CHALLENGE_COOKIE)?.value;
  if (!challengeId) return { error: "expired" };
  const code = String(formData.get("code") ?? "").replace(/\D/g, "").slice(0, 6);
  const { ip } = await getRequestMeta();
  const limit = await rateLimit(`otp:ip:${ip}`, 30, 900);
  if (!limit.ok) return { error: "rate_limited", retryAfter: limit.retryAfterSeconds };

  const security = await readSetting("security");
  const result = await verifyChallenge(challengeId, code, security.otpMaxAttempts);
  if (!result.ok) {
    const ch = await db.loginChallenge.findUnique({ where: { id: challengeId }, select: { userId: true } });
    await audit({ action: "auth.otp_failed", userId: ch?.userId, metadata: { reason: result.reason } });
    if (result.reason !== "invalid") jar.delete({ name: CHALLENGE_COOKIE, path: "/admin" });
    return { error: result.reason, remaining: result.remaining };
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: result.userId } });
  if (!user.isActive) return { error: "invalid_credentials" };
  jar.delete({ name: CHALLENGE_COOKIE, path: "/admin" });
  const trust = formData.get("trust") === "on" && security.otpMode === "new_device";
  if (trust) await trustCurrentDevice(user.id, security.trustedDeviceDays);
  await finishSignIn(user, security.sessionHours, { verification: "email_code", trustedDevice: trust });
  redirect("/admin");
}

export async function resendOtpAction(): Promise<AuthState> {
  const jar = await cookies();
  const challengeId = jar.get(CHALLENGE_COOKIE)?.value;
  if (!challengeId) return { error: "expired" };
  const security = await readSetting("security");
  const challenge = await db.loginChallenge.findUnique({ where: { id: challengeId }, include: { user: true } });
  if (!challenge || challenge.consumedAt || !challenge.user.isActive) return { error: "expired" };

  const elapsed = (Date.now() - challenge.lastSentAt.getTime()) / 1000;
  if (elapsed < security.otpResendCooldownSeconds) return { error: "cooldown", retryAfter: Math.ceil(security.otpResendCooldownSeconds - elapsed) };
  if (challenge.sendCount >= 5) return { error: "too_many_resends" };

  const { code } = await rotateChallengeCode(challenge.id, security.otpTtlMinutes);
  const locale = isLocale(challenge.user.preferredLocale) ? challenge.user.preferredLocale : "ar";
  const sent = await sendMail({ to: challenge.user.email, ...otpEmail(locale, code, security.otpTtlMinutes, challenge.user.name) });
  if (!sent.ok) return { error: "otp_send_failed" };
  await setChallengeCookie(challenge.id, security.otpTtlMinutes);
  await audit({ action: "auth.otp_resent", userId: challenge.userId, actorEmail: challenge.user.email });
  return { info: "resent", retryAfter: security.otpResendCooldownSeconds };
}

export async function logoutAction() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit({ action: "auth.logout", userId: user.id, actorEmail: user.email });
  redirect("/admin/login");
}

export async function setAdminLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(ADMIN_LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const user = await getCurrentUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { preferredLocale: locale } });
}
