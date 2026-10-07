import "server-only";
import { hash, verify } from "@node-rs/argon2";

// OWASP-recommended Argon2id parameters.
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 } as const;

// Used to equalise timing when the account does not exist.
let dummyHash: Promise<string> | null = null;

export function hashPassword(password: string) {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string | null, password: string): Promise<boolean> {
  if (!passwordHash) {
    dummyHash ??= hash("timing-equaliser-password", OPTIONS);
    await verify(await dummyHash, password).catch(() => false);
    return false;
  }
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/** Server-side password policy. Returns an error code or null. */
export function passwordPolicyError(password: string): "too_short" | "too_long" | "too_weak" | null {
  if (password.length < 10) return "too_short";
  if (password.length > 200) return "too_long";
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  if (classes < 3) return "too_weak";
  return null;
}
