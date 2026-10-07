import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";
import { parseSetting, settingsSchemas } from "@/lib/settings-schema";
import { readSetting, writeSetting } from "@/lib/settings";
import { resolveSmtpConfig } from "@/lib/email/mailer";
import { getEmailStatus, isEmailVerificationAvailable, smtpFingerprint } from "@/lib/email/status";
import { agentFamily } from "@/lib/auth/trusted-device";

const env = { host: process.env.SMTP_HOST, otp: process.env.AUTH_DISABLE_OTP };

async function setEmail(patch: Record<string, unknown>) {
  const base = parseSetting("email", {});
  await writeSetting("email", settingsSchemas.email.parse({ ...base, ...patch }));
}

beforeEach(async () => {
  delete process.env.SMTP_HOST;
  delete process.env.AUTH_DISABLE_OTP;
  await db.setting.deleteMany({ where: { key: { in: ["email", "security"] } } });
});

afterAll(async () => {
  if (env.host) process.env.SMTP_HOST = env.host;
  if (env.otp) process.env.AUTH_DISABLE_OTP = env.otp;
  await db.setting.deleteMany({ where: { key: { in: ["email", "security"] } } });
  await db.$disconnect();
});

const smtp = { host: "smtp.example.com", port: 587, security: "starttls", user: "mailer@example.com", passwordEnc: encryptSecret("s3cret"), fromName: "QE", fromEmail: "mailer@example.com", replyTo: "" };

describe("e-mail status", () => {
  it("is not configured without an SMTP server, so sign-in skips verification codes", async () => {
    expect((await getEmailStatus()).state).toBe("not_configured");
    expect(await isEmailVerificationAvailable()).toBe(false);
  });

  it("is unverified until this exact configuration passes a test", async () => {
    await setEmail({ smtp });
    expect((await getEmailStatus()).state).toBe("unverified");
    expect(await isEmailVerificationAvailable()).toBe(false);
  });

  it("becomes active after a successful test and falls back to unverified when settings change", async () => {
    await setEmail({ smtp });
    const cfg = (await resolveSmtpConfig())!;
    await setEmail({ smtp, smtpVerified: smtpFingerprint(cfg), smtpVerifiedAt: new Date().toISOString() });
    expect((await getEmailStatus()).state).toBe("active");
    expect(await isEmailVerificationAvailable()).toBe(true);

    await setEmail({ ...(await readSetting("email")), smtp: { ...smtp, passwordEnc: encryptSecret("changed") } });
    expect((await getEmailStatus()).state).toBe("unverified");
  });

  it("respects the master switch, the OTP policy and the emergency override", async () => {
    await setEmail({ smtp });
    const fp = smtpFingerprint((await resolveSmtpConfig())!);
    await setEmail({ smtp, smtpVerified: fp, enabled: false });
    expect((await getEmailStatus()).state).toBe("disabled");
    expect(await isEmailVerificationAvailable()).toBe(false);

    await setEmail({ smtp, smtpVerified: fp, enabled: true });
    await writeSetting("security", settingsSchemas.security.parse({ otpMode: "off" }));
    expect(await isEmailVerificationAvailable()).toBe(false);

    await writeSetting("security", settingsSchemas.security.parse({ otpMode: "new_device" }));
    process.env.AUTH_DISABLE_OTP = "true";
    expect(await isEmailVerificationAvailable()).toBe(false);
  });
});

describe("trusted devices", () => {
  it("groups user agents by browser and OS family", () => {
    const chromeWin = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
    const edgeWin = `${chromeWin} Edg/140.0`;
    expect(agentFamily(chromeWin)).toBe("chrome/windows");
    expect(agentFamily(edgeWin)).toBe("edge/windows");
    expect(agentFamily(null)).toBe("other/other");
  });
});
