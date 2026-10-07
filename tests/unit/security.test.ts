import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, hmac, randomDigits, safeEqual } from "@/lib/crypto";
import { hashPassword, passwordPolicyError, verifyPassword } from "@/lib/auth/password";
import { ALL_PERMISSIONS, DEFAULT_ROLES, isPermission } from "@/lib/auth/permissions";

describe("crypto", () => {
  it("encrypts secrets with authenticated encryption and round-trips them", () => {
    const enc = encryptSecret("smtp-password-ٍ✓");
    expect(enc.startsWith("v1:")).toBe(true);
    expect(enc).not.toContain("smtp-password");
    expect(decryptSecret(enc)).toBe("smtp-password-ٍ✓");
  });

  it("returns an empty string for tampered ciphertext instead of throwing", () => {
    const enc = encryptSecret("secret");
    const parts = enc.split(":");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(decryptSecret(parts.join(":"))).toBe("");
    expect(decryptSecret("garbage")).toBe("");
  });

  it("uses a different IV per encryption", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("generates numeric codes of the requested length", () => {
    for (let i = 0; i < 50; i++) expect(randomDigits(6)).toMatch(/^\d{6}$/);
  });

  it("HMACs are purpose-bound and compared in constant time", () => {
    expect(hmac("x", "a")).not.toBe(hmac("x", "b"));
    expect(safeEqual(hmac("x", "a"), hmac("x", "a"))).toBe(true);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("passwords", () => {
  it("hashes with argon2id and verifies", async () => {
    const h = await hashPassword("Correct-Horse-9");
    expect(h.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(h, "Correct-Horse-9")).toBe(true);
    expect(await verifyPassword(h, "wrong")).toBe(false);
  });

  it("verifying against a missing account still takes the slow path and fails", async () => {
    expect(await verifyPassword(null, "anything")).toBe(false);
  });

  it("enforces the password policy", () => {
    expect(passwordPolicyError("short1A!")).toBe("too_short");
    expect(passwordPolicyError("alllowercaseletters")).toBe("too_weak");
    expect(passwordPolicyError("Long-enough-1")).toBeNull();
  });
});

describe("roles", () => {
  it("super admin has every permission and default roles only use known permissions", () => {
    const sa = DEFAULT_ROLES.find((r) => r.key === "super_admin")!;
    expect(new Set(sa.permissions)).toEqual(new Set(ALL_PERMISSIONS));
    for (const r of DEFAULT_ROLES) for (const p of r.permissions) expect(isPermission(p)).toBe(true);
  });

  it("content managers cannot publish or touch system settings", () => {
    const cm = DEFAULT_ROLES.find((r) => r.key === "content_manager")!;
    for (const p of ["pages.publish", "blog.publish", "users.manage", "roles.manage", "email.manage", "settings.edit"]) expect(cm.permissions).not.toContain(p);
  });

  it("admins cannot manage roles", () => {
    expect(DEFAULT_ROLES.find((r) => r.key === "admin")!.permissions).not.toContain("roles.manage");
  });
});
