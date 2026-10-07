import { z } from "zod";
import { CONTACT_LIMITS as M, EMAIL_RE, PHONE_RE } from "./contact-rules";

export type { ContactErrorKey } from "./contact-rules";

/** Authoritative server-side validation for the public contact form (mirrors contact-rules.ts). */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "required").max(M.name, "tooLong"),
  email: z.string().trim().max(M.email, "tooLong").regex(EMAIL_RE, "invalidEmail"),
  phone: z
    .string()
    .trim()
    .max(M.phone, "tooLong")
    .refine((v) => v === "" || PHONE_RE.test(v), "invalidPhone")
    .default(""),
  company: z.string().trim().max(M.company, "tooLong").default(""),
  service: z.string().trim().max(M.service, "tooLong").default(""),
  subject: z.string().trim().max(M.subject, "tooLong").default(""),
  message: z.string().trim().min(10, "tooShort").max(M.message, "tooLong"),
  consent: z.literal(true, { message: "consentRequired" }),
});

export type ContactInput = z.input<typeof contactSchema>;
