import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";
import { EMAIL_RE } from "../contact-rules";

/** Shared (client + server) validation for the consultation request form — no zod, keeps the public bundle small. */
export type ConsultationErrorKey = "required" | "invalidEmail" | "invalidPhone" | "tooLong" | "tooShort" | "consentRequired" | "invalidCountry";

export const CONSULTATION_LIMITS = { name: 120, company: 160, email: 200, phone: 30, message: 5000 } as const;
export const CONTACT_METHODS = ["email", "phone", "whatsapp"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export type ConsultationValues = {
  name: string;
  company: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  country: string;
  serviceId: string;
  preferredContact: string;
  message: string;
  consent: boolean;
};

/** Parses a national or international number for the selected calling country. Returns E.164 or null. */
export function normalizePhone(number: string, country: string): { e164: string; national: string; country: string; dial: string } | null {
  const raw = number.trim();
  if (!raw || raw.length > CONSULTATION_LIMITS.phone) return null;
  try {
    const parsed = parsePhoneNumberFromString(raw, country as CountryCode);
    if (!parsed || !parsed.isValid()) return null;
    return { e164: parsed.number, national: parsed.formatNational(), country: parsed.country ?? country, dial: `+${parsed.countryCallingCode}` };
  } catch {
    return null;
  }
}

export function validateConsultation(v: ConsultationValues): Partial<Record<keyof ConsultationValues, ConsultationErrorKey>> {
  const e: Partial<Record<keyof ConsultationValues, ConsultationErrorKey>> = {};
  const name = v.name.trim();
  if (!name) e.name = "required";
  else if (name.length < 2) e.name = "tooShort";
  else if (name.length > CONSULTATION_LIMITS.name) e.name = "tooLong";
  if (v.company.trim().length > CONSULTATION_LIMITS.company) e.company = "tooLong";
  const email = v.email.trim();
  if (!email) e.email = "required";
  else if (email.length > CONSULTATION_LIMITS.email || !EMAIL_RE.test(email)) e.email = "invalidEmail";
  if (!/^[A-Z]{2}$/.test(v.phoneCountry)) e.phoneNumber = "invalidCountry";
  else if (!v.phoneNumber.trim()) e.phoneNumber = "required";
  else if (!normalizePhone(v.phoneNumber, v.phoneCountry)) e.phoneNumber = "invalidPhone";
  if (v.country && !/^[A-Z]{2}$/.test(v.country)) e.country = "invalidCountry";
  if (!(CONTACT_METHODS as readonly string[]).includes(v.preferredContact)) e.preferredContact = "required";
  const message = v.message.trim();
  if (!message) e.message = "required";
  else if (message.length < 10) e.message = "tooShort";
  else if (message.length > CONSULTATION_LIMITS.message) e.message = "tooLong";
  if (!v.consent) e.consent = "consentRequired";
  return e;
}
