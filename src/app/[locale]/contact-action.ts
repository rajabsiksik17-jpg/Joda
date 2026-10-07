"use server";

import { after } from "next/server";
import { db } from "@/lib/db";
import { checkFormToken } from "@/lib/form-token";
import { contactSchema, type ContactErrorKey } from "@/lib/contact-schema";
import { sendMail } from "@/lib/email/mailer";
import { contactAutoReplyEmail, contactNotificationEmail } from "@/lib/email/templates";
import { isLocale } from "@/lib/i18n/config";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { readSetting } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; code: "invalid" | "rate_limited" | "server"; fieldErrors?: Partial<Record<string, ContactErrorKey>> };

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : "";
  };
  const localeRaw = str("locale");
  const locale = isLocale(localeRaw) ? localeRaw : "ar";

  // Bot traps: the honeypot must stay empty and the form must not be submitted instantly.
  // Bots get a success response so they learn nothing; a stale/forged token asks for a retry.
  const token = checkFormToken(str("token"));
  if (str("website") !== "" || token === "too_fast") return { status: "success" };
  if (token === "invalid") return { status: "error", code: "server" };

  const { ip, userAgent } = await getRequestMeta();
  const limit = await rateLimit(`contact:ip:${ip}`, 5, 600);
  if (!limit.ok) return { status: "error", code: "rate_limited" };

  const parsed = contactSchema.safeParse({
    name: str("name"),
    email: str("email"),
    phone: str("phone"),
    company: str("company"),
    service: str("service"),
    subject: str("subject"),
    message: str("message"),
    consent: formData.get("consent") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Partial<Record<string, ContactErrorKey>> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = (["required", "invalidEmail", "invalidPhone", "tooLong", "tooShort", "consentRequired"].includes(issue.message) ? issue.message : "required") as ContactErrorKey;
    }
    return { status: "error", code: "invalid", fieldErrors };
  }

  const emailLimit = await rateLimit(`contact:email:${parsed.data.email.toLowerCase()}`, 3, 600);
  if (!emailLimit.ok) return { status: "error", code: "rate_limited" };

  try {
    const message = await db.contactMessage.create({
      data: { ...parsed.data, phone: parsed.data.phone || null, company: parsed.data.company || null, service: parsed.data.service || null, subject: parsed.data.subject || null, consent: true, locale, ip, userAgent },
    });

    // E-mail delivery happens after the response so visitors are never kept waiting.
    after(async () => {
      const contact = await readSetting("contact");
      if (contact.notifyEmails.length) {
        const mail = contactNotificationEmail({ ...parsed.data, locale }, `${siteUrl()}/admin/messages?open=${message.id}`);
        await sendMail({ to: contact.notifyEmails, ...mail, replyTo: parsed.data.email });
      }
      if (contact.autoReply) {
        await sendMail({ to: parsed.data.email, ...contactAutoReplyEmail(locale, parsed.data.name) });
      }
    });
    return { status: "success" };
  } catch (error) {
    console.error("[contact] failed to store message", error);
    return { status: "error", code: "server" };
  }
}
