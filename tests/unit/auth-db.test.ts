import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createChallenge, hashOtp, rotateChallengeCode, verifyChallenge } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/auth/password";

let userId = "";

beforeAll(async () => {
  const role = await db.role.upsert({ where: { key: "test_role" }, create: { key: "test_role", name: { en: "Test" }, permissions: [] }, update: {} });
  const user = await db.user.upsert({
    where: { email: "otp-test@example.com" },
    create: { email: "otp-test@example.com", name: "OTP Test", roleId: role.id, passwordHash: await hashPassword("Irrelevant-Pass-1") },
    update: {},
  });
  userId = user.id;
});

beforeEach(async () => {
  await db.loginChallenge.deleteMany({ where: { userId } });
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "test:" } } });
});

afterAll(async () => {
  await db.loginChallenge.deleteMany({ where: { userId } });
  await db.$disconnect();
});

describe("one-time passwords", () => {
  it("never stores the code in clear text", async () => {
    const { challenge, code } = await createChallenge(userId, 5, "127.0.0.1");
    const row = await db.loginChallenge.findUniqueOrThrow({ where: { id: challenge.id } });
    expect(row.codeHash).not.toContain(code);
    expect(row.codeHash).toBe(hashOtp(challenge.id, code));
  });

  it("accepts the correct code exactly once", async () => {
    const { challenge, code } = await createChallenge(userId, 5, "127.0.0.1");
    expect(await verifyChallenge(challenge.id, code, 5)).toEqual({ ok: true, userId });
    expect(await verifyChallenge(challenge.id, code, 5)).toMatchObject({ ok: false, reason: "not_found" });
  });

  it("rejects wrong codes and locks the challenge after the attempt limit", async () => {
    const { challenge, code } = await createChallenge(userId, 5, "127.0.0.1");
    const wrong = code === "000000" ? "111111" : "000000";
    expect(await verifyChallenge(challenge.id, wrong, 3)).toMatchObject({ ok: false, reason: "invalid", remaining: 2 });
    expect(await verifyChallenge(challenge.id, wrong, 3)).toMatchObject({ ok: false, reason: "invalid", remaining: 1 });
    expect(await verifyChallenge(challenge.id, wrong, 3)).toMatchObject({ ok: false, reason: "too_many_attempts" });
    // Even the right code no longer works.
    expect(await verifyChallenge(challenge.id, code, 3)).toMatchObject({ ok: false });
  });

  it("rejects expired codes", async () => {
    const { challenge, code } = await createChallenge(userId, 5, "127.0.0.1");
    await db.loginChallenge.update({ where: { id: challenge.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await verifyChallenge(challenge.id, code, 5)).toMatchObject({ ok: false, reason: "expired" });
  });

  it("invalidates previous challenges when a new one is created", async () => {
    const first = await createChallenge(userId, 5, "127.0.0.1");
    await createChallenge(userId, 5, "127.0.0.1");
    expect(await verifyChallenge(first.challenge.id, first.code, 5)).toMatchObject({ ok: false, reason: "not_found" });
  });

  it("resending rotates the code and the old code stops working", async () => {
    const { challenge, code } = await createChallenge(userId, 5, "127.0.0.1");
    const rotated = await rotateChallengeCode(challenge.id, 5);
    if (rotated.code !== code) expect(await verifyChallenge(challenge.id, code, 5)).toMatchObject({ ok: false, reason: "invalid" });
    expect(await verifyChallenge(challenge.id, rotated.code, 5)).toMatchObject({ ok: true });
  });

  it("only one of two concurrent verifications can succeed", async () => {
    const { challenge, code } = await createChallenge(userId, 5, "127.0.0.1");
    const results = await Promise.all([verifyChallenge(challenge.id, code, 5), verifyChallenge(challenge.id, code, 5)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });
});

describe("rate limiting", () => {
  it("allows up to the limit within a window and then blocks", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit("test:rl", 3, 60));
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterSeconds).toBeGreaterThan(0);
  });

  it("starts a new window once the previous one expired", async () => {
    await rateLimit("test:rl2", 1, 60);
    await db.rateLimit.update({ where: { key: "test:rl2" }, data: { resetAt: new Date(Date.now() - 1000) } });
    expect((await rateLimit("test:rl2", 1, 60)).ok).toBe(true);
  });
});
