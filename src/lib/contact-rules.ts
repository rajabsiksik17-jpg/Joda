/**
 * Dependency-free contact form rules shared by the browser (instant feedback) and the server zod
 * schema (authoritative). Keeping zod out of the client bundle saves ~30 KB on every public page.
 */
export type ContactErrorKey = "required" | "invalidEmail" | "invalidPhone" | "tooLong" | "tooShort" | "consentRequired";

export const CONTACT_LIMITS = { name: 120, email: 200, phone: 40, company: 160, service: 160, subject: 200, message: 5000 } as const;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^\+?[\d\s()./-]{6,40}$/;

export type ContactValues = { name: string; email: string; phone: string; company: string; service: string; subject: string; message: string; consent: boolean };

export function validateContact(v: ContactValues): Partial<Record<keyof ContactValues, ContactErrorKey>> {
  const e: Partial<Record<keyof ContactValues, ContactErrorKey>> = {};
  const name = v.name.trim();
  const email = v.email.trim();
  const phone = v.phone.trim();
  const message = v.message.trim();
  if (name.length < 2) e.name = "required";
  else if (name.length > CONTACT_LIMITS.name) e.name = "tooLong";
  if (!EMAIL_RE.test(email)) e.email = "invalidEmail";
  else if (email.length > CONTACT_LIMITS.email) e.email = "tooLong";
  if (phone && !PHONE_RE.test(phone)) e.phone = "invalidPhone";
  if (v.company.trim().length > CONTACT_LIMITS.company) e.company = "tooLong";
  if (v.subject.trim().length > CONTACT_LIMITS.subject) e.subject = "tooLong";
  if (message.length < 10) e.message = "tooShort";
  else if (message.length > CONTACT_LIMITS.message) e.message = "tooLong";
  if (!v.consent) e.consent = "consentRequired";
  return e;
}
