import "server-only";
import { ImapFlow } from "imapflow";
import { classifyEmailError, type EmailErrorCode } from "./mailer";

export type ImapConfig = { host: string; port: number; secure: boolean; user: string; password: string };

/** Connects, authenticates and reads the INBOX status to prove the configuration works. */
export async function testImap(cfg: ImapConfig): Promise<{ ok: true; messages: number } | { ok: false; error: EmailErrorCode; detail?: string }> {
  const client = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.password },
    logger: false,
    socketTimeout: 20_000,
    greetingTimeout: 15_000,
  });
  client.on("error", () => undefined);
  try {
    await client.connect();
    const status = await client.status("INBOX", { messages: true });
    await client.logout();
    return { ok: true, messages: status ? (status.messages ?? 0) : 0 };
  } catch (error) {
    const e = error as { authenticationFailed?: boolean; responseText?: string; message?: string };
    client.close();
    return {
      ok: false,
      error: e?.authenticationFailed ? "auth_failed" : classifyEmailError(error),
      detail: (e?.responseText ?? e?.message ?? "").slice(0, 300),
    };
  }
}
