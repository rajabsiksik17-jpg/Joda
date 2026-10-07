import path from "node:path";
import { expect, test } from "@playwright/test";
import { admin, readOtp, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

test("admin area requires authentication", async ({ page }) => {
  await page.goto("/admin/pages");
  await expect(page).toHaveURL(/\/admin\/login/);
  const api = await page.request.get("/api/admin/search?q=gov");
  expect(api.status()).toBe(401);
});

test("wrong password is rejected without revealing whether the account exists", async ({ page }) => {
  await page.goto("/admin/login");
  await page.locator("#email").fill("nobody@example.com");
  await page.locator("#password").fill("Wrong-password-1");
  await page.locator('form button[type="submit"]').click();
  const alert = page.locator('main [role="alert"]');
  await expect(alert).toBeVisible();
  const unknown = await alert.textContent();
  await page.locator("#email").fill(admin.email);
  await page.locator("#password").fill("Wrong-password-1");
  await page.locator('form button[type="submit"]').click();
  await expect(alert).toHaveText(unknown ?? "");
});

test("a wrong verification code is rejected", async ({ page }) => {
  const since = Date.now() - 1000;
  await page.goto("/admin/login");
  await page.locator("#email").fill(admin.email);
  await page.locator("#password").fill(admin.password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname === "/admin" || url.pathname === "/admin/verify");
  // Codes are only used once outgoing e-mail is configured, tested and enabled.
  test.skip(new URL(page.url()).pathname === "/admin", "e-mail verification is not active in this environment");
  const code = await readOtp(admin.email, since);
  const wrong = code === "000000" ? "111111" : "000000";
  await page.locator('input[autocomplete="one-time-code"]').fill(wrong);
  await expect(page.locator('main [role="alert"]')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/verify/);
});

test("sign in with password + e-mailed code, then edit, save and publish a page", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/pages");
  await page.getByRole("link", { name: /About|من نحن/ }).first().click();
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();

  // Edit the English eyebrow of the first section (page header).
  const original = await page.locator('input[lang="en"]').first().inputValue();
  const marker = `E2E ${Date.now()}`;
  await page.locator('input[lang="en"]').first().fill(marker);
  await page.keyboard.press("Control+s");
  await expect(page.getByText(/Draft saved|تم حفظ المسودة/)).toBeVisible();

  // The draft is not public yet…
  expect(await (await page.request.get("/en/about")).text()).not.toContain(marker);
  // …until it is published.
  await page.getByRole("button", { name: /Publish changes|نشر التغييرات/ }).click();
  await expect(page.getByText(/Published —|تم النشر/)).toBeVisible();
  await expect.poll(async () => (await page.request.get("/en/about")).text()).toContain(marker);

  // Restore the original text.
  await page.locator('input[lang="en"]').first().fill(original);
  await page.keyboard.press("Control+s");
  await expect(page.getByText(/Draft saved|تم حفظ المسودة/).last()).toBeVisible();
  await page.getByRole("button", { name: /Publish changes|نشر التغييرات/ }).click();
  await expect.poll(async () => (await page.request.get("/en/about")).text()).not.toContain(marker);
});

test("media upload validates file types and accepts images", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/media");
  const input = page.locator('input[type="file"]').first();
  await input.setInputFiles({ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("<?php echo 1; ?>") });
  await expect(page.getByText(/Unsupported file type|نوع ملف غير مدعوم/)).toBeVisible();
  await input.setInputFiles(path.resolve("public/brand/icon-192.png"));
  await expect(page.getByText("icon-192.png").first()).toBeVisible();
});

test("permission-limited roles cannot reach system settings", async ({ page }) => {
  await signIn(page);
  const email = `cm-${Date.now()}@example.com`;
  await page.goto("/admin/users");
  await page.getByRole("button", { name: /Add user|إضافة مستخدم/ }).click();
  await page.locator("#u-name").fill("Content Manager E2E");
  await page.locator("#u-email").fill(email);
  const roleValue = await page.locator("#u-role option", { hasText: /Content Manager|مدير محتوى/ }).getAttribute("value");
  await page.locator("#u-role").selectOption(roleValue!);
  await page.getByRole("button", { name: /Create user|إنشاء المستخدم/ }).click();
  const tempPassword = (await page.locator("code").textContent())?.trim() ?? "";
  expect(tempPassword.length).toBeGreaterThan(10);
  await page.getByRole("button", { name: /Done|تم/ }).click();

  // Sign in as the new user in a fresh context.
  const ctx = await page.context().browser()!.newContext();
  const p2 = await ctx.newPage();
  await signIn(p2, email, tempPassword);
  await p2.goto("/admin/users");
  await expect(p2).toHaveURL(/denied=1/);
  await p2.goto("/admin/email");
  await expect(p2).toHaveURL(/denied=1/);
  await expect(p2.getByRole("link", { name: /Users|المستخدمون/ })).toHaveCount(0);
  await ctx.close();
});

test("audit log records sign-ins", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/audit?area=auth");
  await expect(page.getByText(/Signed in|تسجيل دخول/).first()).toBeVisible();
});

test("consultation requests can be found, updated and annotated", async ({ page }) => {
  const marker = `E2E consult ${Date.now()}`;
  // Submit through the public form first.
  await page.goto("/en/consultation?service=governance");
  await page.getByLabel("Full name").fill(marker);
  await page.getByLabel("Work email").fill(`e2e+${Date.now()}@example.com`);
  await page.getByLabel("Phone number").fill("0791234567");
  await page.getByLabel("Tell us about your needs").fill("Automated end-to-end consultation request.");
  await page.getByRole("checkbox").check();
  await page.waitForTimeout(2600);
  await page.getByRole("button", { name: "Request consultation" }).click();
  await expect(page.getByText("Thank you — your request has been received.")).toBeVisible();

  await signIn(page);
  await page.goto(`/admin/consultations?q=${encodeURIComponent(marker)}`);
  await page.getByRole("button", { name: new RegExp(marker) }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByText("+962791234567")).toBeVisible();
  await expect(drawer.getByText(/Governance|الحوكمة/).first()).toBeVisible();
  await drawer.getByRole("radio", { name: /Contacted|تم التواصل/ }).click();
  await expect(drawer.getByRole("radio", { name: /Contacted|تم التواصل/ })).toHaveAttribute("aria-checked", "true");
  await drawer.locator("#cr-notes").fill("Called back — e2e");
  await drawer.getByRole("button", { name: /Save notes|حفظ الملاحظات/ }).click();
  await expect(page.getByText(/Notes saved|تم حفظ الملاحظات/)).toBeVisible();

  // Clean up the test request.
  await drawer.getByRole("button", { name: /^(Delete|حذف)$/ }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /Delete|حذف/ }).click();
  await expect(page.getByText(/Deleted|تم الحذف/)).toBeVisible();
});
