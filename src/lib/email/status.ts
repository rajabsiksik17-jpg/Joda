import "server-only";
import { decryptSecret, sha256 } from "../crypto";
import { readSetting } from "../settings";
import { resolveSmtpConfig, type SmtpConfig } from "./mailer";

export type EmailState = "not_configured" | "unverified" | "active" | "disabled";
export type ImapState = "not_configured" | "unverified" | "connected";

export type ImapFingerprintInput = { host: string; port: number; secure: boolean; user: string; password: string };

/** Identifies an exact SMTP configuration (including the password) without storing it. */
export function smtpFingerprint(cfg: SmtpConfig) {
  return sha256(["smtp", cfg.host.toLowerCase(), cfg.port, cfg.security, cfg.user, cfg.fromEmail, cfg.password].join("|"));
}

export function imapFingerprint(cfg: ImapFingerprintInput) {
  return sha256(["imap", cfg.host.toLowerCase(), cfg.port, cfg.secure, cfg.user, cfg.password].join("|"));
}

export type EmailStatus = {
  state: EmailState;
  source: "cms" | "env" | null;
  smtpVerifiedAt: string | null;
  imap: ImapState;
  imapVerifiedAt: string | null;
  enabled: boolean;
};

/**
 * The single source of truth for "can the system rely on e-mail?".
 * - not_configured: no SMTP server (CMS or environment)
 * - unverified: configured, but this exact configuration never passed a test
 * - disabled: switched off by an administrator
 * - active: configured, tested and enabled
 */
export async function getEmailStatus(): Promise<EmailStatus> {
  const settings = await readSetting("email");
  const smtp = await resolveSmtpConfig();
  const source = settings.smtp.host ? "cms" : smtp ? "env" : null;
  const verified = !!smtp && !!settings.smtpVerified && settings.smtpVerified === smtpFingerprint(smtp);

  let imap: ImapState = "not_configured";
  if (settings.imap.host) {
    const fp = imapFingerprint({ host: settings.imap.host, port: settings.imap.port, secure: settings.imap.secure, user: settings.imap.user, password: decryptSecret(settings.imap.passwordEnc) });
    imap = settings.imapVerified && settings.imapVerified === fp ? "connected" : "unverified";
  }

  const state: EmailState = !smtp ? "not_configured" : !settings.enabled ? "disabled" : verified ? "active" : "unverified";
  return {
    state,
    source,
    smtpVerifiedAt: verified ? settings.smtpVerifiedAt || null : null,
    imap,
    imapVerifiedAt: imap === "connected" ? settings.imapVerifiedAt || null : null,
    enabled: settings.enabled,
  };
}

/** E-mail verification codes are only used when the e-mail system is active and policy allows it. */
export async function isEmailVerificationAvailable() {
  if (process.env.AUTH_DISABLE_OTP === "true") return false;
  const [status, security] = await Promise.all([getEmailStatus(), readSetting("security")]);
  return status.state === "active" && security.otpMode !== "off";
}
