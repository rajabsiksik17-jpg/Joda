import { z } from "zod";

/** Localized string schema used inside settings. */
export const zL = (max = 2000) =>
  z.object({ ar: z.string().trim().max(max).optional().default(""), en: z.string().trim().max(max).optional().default("") }).default({ ar: "", en: "" });

const optionalId = z.string().max(64).nullable().optional().default(null);

export const settingsSchemas = {
  general: z.object({
    siteName: zL(120),
    legalName: zL(160),
    tagline: zL(200),
    defaultLocale: z.enum(["ar", "en"]).default("ar"),
  }),
  brand: z.object({
    logoColorId: optionalId,
    logoWhiteId: optionalId,
    iconId: optionalId,
    faviconId: optionalId,
    ogImageId: optionalId,
  }),
  header: z.object({
    showCta: z.boolean().default(true),
    ctaLabel: zL(60),
    ctaHref: z.string().trim().max(500).default("/contact"),
  }),
  footer: z.object({
    about: zL(600),
    ctaTitle: zL(160),
    ctaLabel: zL(60),
    ctaHref: z.string().trim().max(500).default("/contact"),
    signature: zL(200),
  }),
  contact: z.object({
    address: zL(300),
    workingHours: zL(300),
    mapEnabled: z.boolean().default(true),
    mapLat: z.number().min(-90).max(90).nullable().default(null),
    mapLng: z.number().min(-180).max(180).nullable().default(null),
    mapZoom: z.number().int().min(1).max(21).default(12),
    mapQuery: z.string().trim().max(300).default(""),
    mapUrl: z.string().trim().max(1000).default(""),
    /** Recipients notified when the contact form is submitted */
    notifyEmails: z.array(z.string().email()).max(10).default([]),
    autoReply: z.boolean().default(true),
  }),
  consultation: z.object({
    /** Recipients notified of new consultation requests (falls back to the contact recipients). */
    notifyEmails: z.array(z.string().email()).max(10).default([]),
    autoReply: z.boolean().default(true),
    /** ISO 3166-1 alpha-2 country used when the visitor's country cannot be inferred. */
    defaultCountry: z.string().trim().regex(/^[A-Z]{2}$/).default("JO"),
    /** Countries listed first in the phone/country pickers. */
    preferredCountries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(20).default(["JO", "SA", "AE", "KW", "QA", "BH", "OM", "PS"]),
    allowWhatsApp: z.boolean().default(true),
  }),
  floating: z.object({
    /** Expandable contact/social button */
    contactEnabled: z.boolean().default(true),
    contactShowPhone: z.boolean().default(true),
    contactShowEmail: z.boolean().default(true),
    contactShowSocial: z.boolean().default(true),
    contactShowConsultation: z.boolean().default(true),
    contactMobile: z.boolean().default(true),
    contactDesktop: z.boolean().default(true),
    /** WhatsApp button — sits on the opposite side to the contact button */
    whatsappEnabled: z.boolean().default(false),
    whatsappNumber: z.string().trim().regex(/^\+?[\d\s()-]{0,24}$/, "invalid").default(""),
    whatsappMessage: zL(300),
    whatsappSide: z.enum(["start", "end"]).default("start"),
    whatsappMobile: z.boolean().default(true),
    whatsappDesktop: z.boolean().default(true),
  }),
  seo: z.object({
    titleTemplate: zL(120),
    defaultDescription: zL(320),
    allowIndexing: z.boolean().default(true),
    twitterHandle: z.string().trim().max(50).default(""),
    googleVerification: z.string().trim().max(200).default(""),
    bingVerification: z.string().trim().max(200).default(""),
  }),
  analytics: z.object({
    provider: z.enum(["none", "ga4", "plausible"]).default("none"),
    ga4MeasurementId: z.string().trim().regex(/^(G-[A-Z0-9]+)?$/, "invalid").default(""),
    plausibleDomain: z.string().trim().max(200).default(""),
  }),
  maintenance: z.object({
    enabled: z.boolean().default(false),
    message: zL(500),
  }),
  security: z.object({
    otpTtlMinutes: z.number().int().min(2).max(30).default(5),
    otpMaxAttempts: z.number().int().min(3).max(10).default(5),
    otpResendCooldownSeconds: z.number().int().min(30).max(600).default(60),
    sessionHours: z.number().int().min(1).max(168).default(12),
    maxFailedLogins: z.number().int().min(3).max(20).default(5),
    lockoutMinutes: z.number().int().min(5).max(1440).default(15),
    /** When e-mail is active: verify new devices (default), every sign-in, or never. */
    otpMode: z.enum(["new_device", "every_login", "off"]).default("new_device"),
    trustedDeviceDays: z.number().int().min(1).max(180).default(30),
  }),
  /** Google OAuth connection for Analytics / Search Console reporting. Secrets are encrypted. */
  google: z.object({
    clientId: z.string().trim().max(300).default(""),
    clientSecretEnc: z.string().max(2000).default(""),
    refreshTokenEnc: z.string().max(4000).default(""),
    accountEmail: z.string().max(320).default(""),
    scopes: z.array(z.string().max(200)).max(20).default([]),
    connectedAt: z.string().max(40).default(""),
    /** GA4 property used for reports, e.g. "properties/123456789" */
    ga4Property: z.string().max(100).default(""),
    ga4PropertyName: z.string().max(200).default(""),
    /** Search Console property, e.g. "sc-domain:example.com" or "https://example.com/" */
    searchConsoleSite: z.string().max(300).default(""),
    lastSyncAt: z.string().max(40).default(""),
    lastError: z.string().max(500).default(""),
  }),
  email: z.object({
    /** Master switch for outgoing e-mail (notifications and sign-in codes). */
    enabled: z.boolean().default(true),
    /** Fingerprint of the SMTP configuration that last passed a test (see lib/email/status.ts). */
    smtpVerified: z.string().max(128).default(""),
    smtpVerifiedAt: z.string().max(40).default(""),
    imapVerified: z.string().max(128).default(""),
    imapVerifiedAt: z.string().max(40).default(""),
    smtp: z
      .object({
        host: z.string().trim().max(255).default(""),
        port: z.number().int().min(1).max(65535).default(587),
        security: z.enum(["starttls", "ssl", "none"]).default("starttls"),
        user: z.string().trim().max(255).default(""),
        passwordEnc: z.string().max(2000).default(""),
        fromName: z.string().trim().max(120).default(""),
        fromEmail: z.string().trim().max(255).default(""),
        replyTo: z.string().trim().max(255).default(""),
      })
      .default({ host: "", port: 587, security: "starttls", user: "", passwordEnc: "", fromName: "", fromEmail: "", replyTo: "" }),
    imap: z
      .object({
        host: z.string().trim().max(255).default(""),
        port: z.number().int().min(1).max(65535).default(993),
        secure: z.boolean().default(true),
        user: z.string().trim().max(255).default(""),
        passwordEnc: z.string().max(2000).default(""),
      })
      .default({ host: "", port: 993, secure: true, user: "", passwordEnc: "" }),
  }),
} as const;

export type SettingKey = keyof typeof settingsSchemas;
export type Settings<K extends SettingKey> = z.output<(typeof settingsSchemas)[K]>;

export function parseSetting<K extends SettingKey>(key: K, value: unknown): Settings<K> {
  const schema = settingsSchemas[key];
  const parsed = schema.safeParse(value ?? {});
  if (parsed.success) return parsed.data as Settings<K>;
  return schema.parse({}) as Settings<K>;
}
