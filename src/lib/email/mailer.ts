import "server-only";
import nodemailer from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { decryptSecret } from "../crypto";
import { readSetting } from "../settings";

export type SmtpConfig = {
  host: string;
  port: number;
  security: "starttls" | "ssl" | "none";
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
};

export type MailResult = { ok: true; messageId?: string; delivered: "smtp" | "dev-outbox" } | { ok: false; error: EmailErrorCode; detail?: string };

export type EmailErrorCode = "not_configured" | "disabled" | "auth_failed" | "connection_failed" | "tls_failed" | "rejected" | "timeout" | "unknown";

/** SMTP configuration from the CMS, falling back to environment variables. */
export async function resolveSmtpConfig(): Promise<SmtpConfig | null> {
  const { smtp } = await readSetting("email");
  if (smtp.host) {
    return {
      host: smtp.host,
      port: smtp.port,
      security: smtp.security,
      user: smtp.user,
      password: decryptSecret(smtp.passwordEnc),
      fromName: smtp.fromName,
      fromEmail: smtp.fromEmail || smtp.user,
      replyTo: smtp.replyTo || undefined,
    };
  }
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    return {
      host: process.env.SMTP_HOST,
      port,
      security: (process.env.SMTP_SECURITY as SmtpConfig["security"]) ?? (port === 465 ? "ssl" : "starttls"),
      user: process.env.SMTP_USER ?? "",
      password: process.env.SMTP_PASSWORD ?? "",
      fromName: process.env.SMTP_FROM_NAME ?? "Quality Experts",
      fromEmail: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "",
    };
  }
  return null;
}

function createTransport(cfg: SmtpConfig) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.security === "ssl",
    requireTLS: cfg.security === "starttls",
    ignoreTLS: cfg.security === "none",
    auth: cfg.user ? { user: cfg.user, pass: cfg.password } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

export function classifyEmailError(error: unknown): EmailErrorCode {
  const e = error as { code?: string; responseCode?: number; message?: string };
  const code = e?.code ?? "";
  const msg = (e?.message ?? "").toLowerCase();
  if (code === "EAUTH" || e?.responseCode === 535) return "auth_failed";
  if (code === "ETIMEDOUT" || msg.includes("timeout")) return "timeout";
  if (code === "ESOCKET" && (msg.includes("ssl") || msg.includes("tls") || msg.includes("wrong version"))) return "tls_failed";
  if (["ECONNECTION", "ECONNREFUSED", "ENOTFOUND", "EDNS", "ESOCKET", "EHOSTUNREACH"].includes(code)) return "connection_failed";
  if (code === "EENVELOPE" || (e?.responseCode && e.responseCode >= 500)) return "rejected";
  return "unknown";
}

/** Verifies an SMTP configuration without sending anything. */
export async function verifySmtp(cfg: SmtpConfig): Promise<MailResult> {
  try {
    await createTransport(cfg).verify();
    return { ok: true, delivered: "smtp" };
  } catch (error) {
    return { ok: false, error: classifyEmailError(error), detail: safeDetail(error) };
  }
}

function safeDetail(error: unknown) {
  const e = error as { response?: string; message?: string };
  // Server responses are useful to admins; strip anything resembling credentials.
  return (e?.response ?? e?.message ?? "").replace(/(pass(word)?|auth)\S*/gi, "***").slice(0, 300);
}

export type MailInput = { to: string | string[]; subject: string; html: string; text: string; replyTo?: string };

export async function sendMail(input: MailInput, override?: SmtpConfig): Promise<MailResult> {
  // An administrator can switch outgoing e-mail off; explicit test sends (override) still work.
  if (!override && !(await readSetting("email")).enabled) return { ok: false, error: "disabled" };
  const cfg = override ?? (await resolveSmtpConfig());
  if (!cfg) {
    if (process.env.NODE_ENV !== "production") return writeDevOutbox(input);
    return { ok: false, error: "not_configured" };
  }
  try {
    const info = await createTransport(cfg).sendMail({
      from: cfg.fromName ? { name: cfg.fromName, address: cfg.fromEmail } : cfg.fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo ?? cfg.replyTo,
    });
    return { ok: true, messageId: info.messageId, delivered: "smtp" };
  } catch (error) {
    console.error("[email] send failed:", classifyEmailError(error));
    return { ok: false, error: classifyEmailError(error), detail: safeDetail(error) };
  }
}

/**
 * Development only: when no SMTP server is configured, messages are written to
 * storage/mail-outbox so flows such as OTP login can be exercised locally.
 */
async function writeDevOutbox(input: MailInput): Promise<MailResult> {
  const dir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "storage", "mail-outbox");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
  await writeFile(file, JSON.stringify({ ...input, createdAt: new Date().toISOString() }, null, 2), "utf8");
  // Never log subjects or bodies: they may contain one-time codes.
  console.info(`[email:dev] message saved to ${path.relative(process.cwd(), file)}`);
  return { ok: true, delivered: "dev-outbox" };
}
