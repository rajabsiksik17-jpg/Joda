"use server";

import { z } from "zod";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/session";
import { guarded, zodFieldErrors, type ActionResult } from "@/lib/actions";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { resolveSmtpConfig, sendMail, verifySmtp, type SmtpConfig } from "@/lib/email/mailer";
import { getEmailStatus, imapFingerprint, smtpFingerprint, type EmailStatus } from "@/lib/email/status";
import { testImap } from "@/lib/email/imap";
import { testEmail } from "@/lib/email/templates";
import { rateLimit } from "@/lib/rate-limit";
import { readSetting, writeSetting } from "@/lib/settings";

const host = z.string().trim().max(255).regex(/^[a-zA-Z0-9.-]*$/, "invalid_host");
const smtpSchema = z.object({
  host,
  port: z.coerce.number().int().min(1).max(65535),
  security: z.enum(["starttls", "ssl", "none"]),
  user: z.string().trim().max(255),
  /** Empty string keeps the stored password; "__clear__" removes it. */
  password: z.string().max(500).default(""),
  fromName: z.string().trim().max(120),
  fromEmail: z.union([z.literal(""), z.string().trim().email("invalid_email").max(255)]),
  replyTo: z.union([z.literal(""), z.string().trim().email("invalid_email").max(255)]),
});
const imapSchema = z.object({ host, port: z.coerce.number().int().min(1).max(65535), secure: z.boolean(), user: z.string().trim().max(255), password: z.string().max(500).default("") });

export type EmailView = {
  smtp: { host: string; port: number; security: "starttls" | "ssl" | "none"; user: string; hasPassword: boolean; fromName: string; fromEmail: string; replyTo: string };
  imap: { host: string; port: number; secure: boolean; user: string; hasPassword: boolean };
  envFallback: boolean;
  status: EmailStatus;
  otpMode: "new_device" | "every_login" | "off";
};

/** Never returns stored passwords — only whether one is set. */
export async function getEmailView(): Promise<EmailView> {
  await authorize("email.manage");
  const [{ smtp, imap }, status, security] = await Promise.all([readSetting("email"), getEmailStatus(), readSetting("security")]);
  return {
    smtp: { host: smtp.host, port: smtp.port, security: smtp.security, user: smtp.user, hasPassword: !!smtp.passwordEnc, fromName: smtp.fromName, fromEmail: smtp.fromEmail, replyTo: smtp.replyTo },
    imap: { host: imap.host, port: imap.port, secure: imap.secure, user: imap.user, hasPassword: !!imap.passwordEnc },
    envFallback: !smtp.host && !!process.env.SMTP_HOST,
    status,
    otpMode: security.otpMode,
  };
}

function nextPassword(input: string, storedEnc: string) {
  if (input === "__clear__") return "";
  return input ? encryptSecret(input) : storedEnc;
}

export async function saveSmtp(input: unknown): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("email.manage");
    const parsed = smtpSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    const current = await readSetting("email");
    const { password, ...rest } = parsed.data;
    await writeSetting("email", { ...current, smtp: { ...rest, passwordEnc: nextPassword(password, current.smtp.passwordEnc) } }, user.id);
    await audit({ action: "email.update", userId: user.id, actorEmail: user.email, metadata: { part: "smtp", host: rest.host, passwordChanged: !!password } });
    return { ok: true };
  });
}

export async function saveImap(input: unknown): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("email.manage");
    const parsed = imapSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(parsed.error) };
    const current = await readSetting("email");
    const { password, ...rest } = parsed.data;
    await writeSetting("email", { ...current, imap: { ...rest, passwordEnc: nextPassword(password, current.imap.passwordEnc) } }, user.id);
    await audit({ action: "email.update", userId: user.id, actorEmail: user.email, metadata: { part: "imap", host: rest.host, passwordChanged: !!password } });
    return { ok: true };
  });
}

/**
 * A test that succeeds against exactly the saved configuration marks it verified; testing unsaved
 * form values only reports the result.
 */
async function markSmtpVerified(tested: SmtpConfig) {
  const saved = await resolveSmtpConfig();
  if (!saved || smtpFingerprint(saved) !== smtpFingerprint(tested)) return false;
  const current = await readSetting("email");
  await writeSetting("email", { ...current, smtpVerified: smtpFingerprint(saved), smtpVerifiedAt: new Date().toISOString() });
  return true;
}

export async function setEmailEnabled(enabled: boolean): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("email.manage");
    const current = await readSetting("email");
    await writeSetting("email", { ...current, enabled: !!enabled }, user.id);
    await audit({ action: "email.update", userId: user.id, actorEmail: user.email, metadata: { enabled: !!enabled } });
    return { ok: true };
  });
}

/** Builds a config from the form, falling back to the stored password when the field is blank. */
async function smtpFromInput(input: unknown): Promise<SmtpConfig> {
  const data = smtpSchema.parse(input);
  const { smtp } = await readSetting("email");
  // Nothing entered in the CMS: test the environment configuration instead.
  if (!data.host && !smtp.host) {
    const env = await resolveSmtpConfig();
    if (env) return env;
  }
  return {
    host: data.host,
    port: data.port,
    security: data.security,
    user: data.user,
    password: data.password && data.password !== "__clear__" ? data.password : decryptSecret(smtp.passwordEnc),
    fromName: data.fromName,
    fromEmail: data.fromEmail || data.user,
    replyTo: data.replyTo || undefined,
  };
}

export async function testSmtpConnection(input: unknown): Promise<ActionResult<{ detail?: string }>> {
  return guarded(async () => {
    const user = await authorize("email.manage");
    const limit = await rateLimit(`smtp-test:${user.id}`, 10, 600);
    if (!limit.ok) return { ok: false, error: "rate_limited" };
    const cfg = await smtpFromInput(input);
    if (!cfg.host) return { ok: false, error: "not_configured" };
    const r = await verifySmtp(cfg);
    const verified = r.ok ? await markSmtpVerified(cfg) : false;
    await audit({ action: "email.test", userId: user.id, actorEmail: user.email, metadata: { kind: "smtp_verify", ok: r.ok, verified } });
    return r.ok ? { ok: true, data: { detail: verified ? "verified" : "unsaved" } } : { ok: false, error: r.error, fieldErrors: r.detail ? { detail: r.detail } : undefined };
  });
}

export async function sendTestEmail(input: unknown, to: string): Promise<ActionResult<{ detail?: string }>> {
  return guarded(async () => {
    const user = await authorize("email.manage");
    const limit = await rateLimit(`smtp-test:${user.id}`, 10, 600);
    if (!limit.ok) return { ok: false, error: "rate_limited" };
    const recipient = z.string().trim().email().parse(to || user.email);
    const cfg = await smtpFromInput(input);
    if (!cfg.host) return { ok: false, error: "not_configured" };
    const r = await sendMail({ to: recipient, ...testEmail(user.preferredLocale === "en" ? "en" : "ar") }, cfg);
    const verified = r.ok && r.delivered === "smtp" ? await markSmtpVerified(cfg) : false;
    await audit({ action: "email.test", userId: user.id, actorEmail: user.email, metadata: { kind: "smtp_send", ok: r.ok, to: recipient, verified } });
    return r.ok ? { ok: true, data: { detail: verified ? "verified" : "unsaved" } } : { ok: false, error: r.error, fieldErrors: r.detail ? { detail: r.detail } : undefined };
  });
}

export async function testImapConnection(input: unknown): Promise<ActionResult<{ messages: number }>> {
  return guarded(async () => {
    const user = await authorize("email.manage");
    const limit = await rateLimit(`imap-test:${user.id}`, 10, 600);
    if (!limit.ok) return { ok: false, error: "rate_limited" };
    const data = imapSchema.parse(input);
    if (!data.host) return { ok: false, error: "not_configured" };
    const settings = await readSetting("email");
    const { imap } = settings;
    const tested = { host: data.host, port: data.port, secure: data.secure, user: data.user, password: data.password && data.password !== "__clear__" ? data.password : decryptSecret(imap.passwordEnc) };
    const r = await testImap(tested);
    const saved = { host: imap.host, port: imap.port, secure: imap.secure, user: imap.user, password: decryptSecret(imap.passwordEnc) };
    const verified = r.ok && imapFingerprint(saved) === imapFingerprint(tested);
    if (verified) await writeSetting("email", { ...settings, imapVerified: imapFingerprint(saved), imapVerifiedAt: new Date().toISOString() });
    await audit({ action: "email.test", userId: user.id, actorEmail: user.email, metadata: { kind: "imap", ok: r.ok, verified } });
    return r.ok ? { ok: true, data: { messages: r.messages } } : { ok: false, error: r.error, fieldErrors: r.detail ? { detail: r.detail } : undefined };
  });
}
