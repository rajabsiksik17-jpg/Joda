"use server";

import { after } from "next/server";
import { db } from "@/lib/db";
import { checkFormToken } from "@/lib/form-token";
import { isCountryCode } from "@/lib/consultation/countries";
import { normalizePhone, validateConsultation, type ConsultationErrorKey } from "@/lib/consultation/rules";
import { sendMail } from "@/lib/email/mailer";
import { consultationAutoReplyEmail, consultationNotificationEmail } from "@/lib/email/templates";
import { isLocale } from "@/lib/i18n/config";
import { tr, type L } from "@/lib/i18n/localized";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { readSetting } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";

export type ConsultationState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; code: "invalid" | "rate_limited" | "server"; fieldErrors?: Partial<Record<string, ConsultationErrorKey>> };

export async function submitConsultation(_prev: ConsultationState, formData: FormData): Promise<ConsultationState> {
  const str = (k: string, max = 6000) => {
    const v = formData.get(k);
    return typeof v === "string" ? v.slice(0, max) : "";
  };
  const localeRaw = str("locale", 5);
  const locale = isLocale(localeRaw) ? localeRaw : "ar";

  // Same bot traps as the contact form: honeypot + signed fill-time token.
  const token = checkFormToken(str("token", 200));
  if (str("website") !== "" || token === "too_fast") return { status: "success" };
  if (token === "invalid") return { status: "error", code: "server" };

  const { ip, userAgent } = await getRequestMeta();
  const limit = await rateLimit(`consult:ip:${ip}`, 5, 900);
  if (!limit.ok) return { status: "error", code: "rate_limited" };

  const values = {
    name: str("name").trim(),
    company: str("company").trim(),
    email: str("email").trim(),
    phoneCountry: str("phoneCountry", 2).toUpperCase(),
    phoneNumber: str("phoneNumber", 40),
    country: str("country", 2).toUpperCase(),
    serviceId: str("serviceId", 64),
    preferredContact: str("preferredContact", 20),
    message: str("message").trim(),
    consent: formData.get("consent") === "on",
  };
  const settings = await readSetting("consultation");
  const fieldErrors: Partial<Record<string, ConsultationErrorKey>> = validateConsultation(values);
  if (values.phoneCountry && !isCountryCode(values.phoneCountry)) fieldErrors.phoneNumber = "invalidCountry";
  if (values.country && !isCountryCode(values.country)) fieldErrors.country = "invalidCountry";
  if (values.preferredContact === "whatsapp" && !settings.allowWhatsApp) fieldErrors.preferredContact = "required";
  if (Object.keys(fieldErrors).length) return { status: "error", code: "invalid", fieldErrors };

  const emailLimit = await rateLimit(`consult:email:${values.email.toLowerCase()}`, 3, 900);
  if (!emailLimit.ok) return { status: "error", code: "rate_limited" };

  const phone = normalizePhone(values.phoneNumber, values.phoneCountry)!;
  // Only published services can be referenced; the localized title is kept as a snapshot.
  const service = values.serviceId ? await db.service.findFirst({ where: { id: values.serviceId, status: "PUBLISHED", deletedAt: null }, select: { id: true, title: true } }) : null;
  const serviceTitle = service ? tr(service.title as L, locale, true) : null;
  const sourcePage = (() => {
    const raw = str("sourcePage", 300);
    return raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
  })();

  try {
    const request = await db.consultationRequest.create({
      data: {
        name: values.name,
        company: values.company || null,
        email: values.email,
        phoneCountry: values.phoneCountry,
        phoneDialCode: phone.dial,
        phoneNumber: values.phoneNumber.trim(),
        phoneE164: phone.e164,
        country: values.country || values.phoneCountry,
        serviceId: service?.id ?? null,
        serviceTitle,
        preferredContact: values.preferredContact,
        message: values.message,
        locale,
        sourcePage,
        consent: true,
        ip,
        userAgent,
      },
    });

    after(async () => {
      const contact = await readSetting("contact");
      const to = settings.notifyEmails.length ? settings.notifyEmails : contact.notifyEmails;
      if (to.length) {
        const mail = consultationNotificationEmail(
          { name: values.name, company: values.company || null, email: values.email, phoneE164: phone.e164, country: values.country || values.phoneCountry, service: serviceTitle, preferredContact: values.preferredContact, message: values.message, locale, sourcePage },
          `${siteUrl()}/admin/consultations?open=${request.id}`,
        );
        await sendMail({ to, ...mail, replyTo: values.email });
      }
      if (settings.autoReply) await sendMail({ to: values.email, ...consultationAutoReplyEmail(locale, values.name, serviceTitle) });
    });
    return { status: "success" };
  } catch (error) {
    console.error("[consultation] failed to store request", error);
    return { status: "error", code: "server" };
  }
}
