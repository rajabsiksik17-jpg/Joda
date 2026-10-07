import "server-only";
import { db } from "../db";
import { hmac, randomDigits, safeEqual } from "../crypto";

export const OTP_LENGTH = 6;

export function hashOtp(challengeId: string, code: string) {
  // Binding the hash to the challenge id prevents reuse of a code across challenges.
  return hmac(`${challengeId}:${code}`, "otp");
}

/** Creates a challenge and returns the clear-text code (to be e-mailed, never stored). */
export async function createChallenge(userId: string, ttlMinutes: number, ip: string) {
  // Only one active challenge per user.
  await db.loginChallenge.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: new Date() } });
  const code = randomDigits(OTP_LENGTH);
  const challenge = await db.loginChallenge.create({
    data: { userId, codeHash: "pending", expiresAt: new Date(Date.now() + ttlMinutes * 60_000), ip },
  });
  await db.loginChallenge.update({ where: { id: challenge.id }, data: { codeHash: hashOtp(challenge.id, code) } });
  return { challenge, code };
}

/** Issues a fresh code for an existing challenge (resend). */
export async function rotateChallengeCode(challengeId: string, ttlMinutes: number) {
  const code = randomDigits(OTP_LENGTH);
  const challenge = await db.loginChallenge.update({
    where: { id: challengeId },
    data: {
      codeHash: hashOtp(challengeId, code),
      expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
      attempts: 0,
      lastSentAt: new Date(),
      sendCount: { increment: 1 },
    },
  });
  return { challenge, code };
}

export type VerifyResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" | "not_found"; remaining?: number };

export async function verifyChallenge(challengeId: string, code: string, maxAttempts: number): Promise<VerifyResult> {
  const challenge = await db.loginChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.consumedAt) return { ok: false, reason: "not_found" };
  if (challenge.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (challenge.attempts >= maxAttempts) return { ok: false, reason: "too_many_attempts" };

  const normalized = code.replace(/\D/g, "");
  const matches = normalized.length === OTP_LENGTH && safeEqual(hashOtp(challenge.id, normalized), challenge.codeHash);

  if (!matches) {
    const updated = await db.loginChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    if (updated.attempts >= maxAttempts) {
      await db.loginChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
      return { ok: false, reason: "too_many_attempts" };
    }
    return { ok: false, reason: "invalid", remaining: maxAttempts - updated.attempts };
  }

  // Atomic single-use consumption: only one concurrent request can win.
  const consumed = await db.loginChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count !== 1) return { ok: false, reason: "not_found" };
  return { ok: true, userId: challenge.userId };
}
