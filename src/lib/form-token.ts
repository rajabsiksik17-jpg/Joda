import "server-only";
import { hmac, safeEqual } from "./crypto";

const MIN_FILL_MS = 2500;
const MAX_FILL_MS = 1000 * 60 * 60 * 24;

/** Signed timestamp embedded in public forms; submissions faster than a human are treated as bots. */
export function issueFormToken() {
  const ts = Date.now().toString();
  return `${ts}.${hmac(ts, "contact-form")}`;
}

export function checkFormToken(token: string): "ok" | "too_fast" | "invalid" {
  const [ts, sig] = token.split(".");
  if (!ts || !sig || !safeEqual(hmac(ts, "contact-form"), sig)) return "invalid";
  const age = Date.now() - Number(ts);
  if (age < MIN_FILL_MS) return "too_fast";
  return age <= MAX_FILL_MS ? "ok" : "invalid";
}
