import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page } from "@playwright/test";
import "dotenv/config";

const OUTBOX = path.resolve(process.cwd(), "storage", "mail-outbox");

/** Returns the newest verification code e-mailed to `email` after `since`. */
export async function readOtp(email: string, since: number): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const files = (await readdir(OUTBOX).catch(() => [])).filter((f) => f.endsWith(".json")).sort().reverse();
    for (const f of files) {
      if (Number(f.split("-")[0]) < since) break;
      const mail = JSON.parse(await readFile(path.join(OUTBOX, f), "utf8")) as { to: string | string[]; subject: string };
      const to = Array.isArray(mail.to) ? mail.to : [mail.to];
      const code = mail.subject.match(/\d{6}/)?.[0];
      if (code && to.includes(email)) return code;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No verification e-mail found for ${email}`);
}

export const admin = {
  email: process.env.SEED_ADMIN_EMAIL ?? "admin@qc-jo.com",
  password: process.env.SEED_ADMIN_PASSWORD ?? "",
};

export async function signIn(page: Page, email = admin.email, password = admin.password) {
  const since = Date.now() - 1000;
  await page.goto("/admin/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('form button[type="submit"]').click();
  // A code is only requested when e-mail is configured, verified and enabled.
  await page.waitForURL((url) => url.pathname === "/admin" || url.pathname === "/admin/verify");
  if (new URL(page.url()).pathname === "/admin/verify") {
    const code = await readOtp(email, since);
    await page.locator('input[autocomplete="one-time-code"]').fill(code);
    await page.waitForURL((url) => url.pathname === "/admin");
  }
  await expect(page.locator("main h1")).toBeVisible();
}
