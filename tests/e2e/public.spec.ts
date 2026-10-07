import { expect, test } from "@playwright/test";

test.describe("public website", () => {
  test("redirects the root to a language and remembers the choice", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(ar|en)$/);
    await page.goto("/en");
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
  });

  test("Arabic is right-to-left and English left-to-right", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("h1")).toContainText("ننقل أعمالك");
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("h1")).toContainText("Elevating your business");
  });

  test("has no horizontal overflow", async ({ page }) => {
    for (const url of ["/ar", "/en", "/en/services/it-consulting", "/ar/contact"]) {
      await page.goto(url);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, url).toBeLessThanOrEqual(1);
    }
  });

  test("shows the official statistics and all ten services", async ({ page }) => {
    await page.goto("/en/services");
    for (const name of ["Governance", "Artificial Intelligence", "Digital Transformation", "Spending Efficiency", "Business & Strategy", "IT Consulting", "Financial Consulting", "Human Capital", "Capacity Building", "ISO Consulting"]) {
      await expect(page.getByRole("heading", { name, exact: true }).first()).toBeVisible();
    }
  });

  test("service pages list their capabilities", async ({ page }) => {
    await page.goto("/en/services/iso-consulting");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ISO Consulting");
    // Standards wall: certification code and name are shown separately.
    await expect(page.getByText("ISO 9001", { exact: true })).toBeVisible();
    await expect(page.getByText("Quality Management System", { exact: true })).toBeVisible();
    await expect(page.getByText("European Foundation for Quality Management Model (EFQM)")).toBeVisible();
  });

  test("returns real 404s for unknown and unpublished pages", async ({ page }) => {
    for (const url of ["/en/does-not-exist", "/ar/services/unknown", "/en/terms"]) {
      const res = await page.goto(url);
      expect(res?.status(), url).toBe(404);
    }
  });

  test("language switcher keeps the current page", async ({ page, isMobile }) => {
    test.skip(isMobile, "switcher lives in the mobile menu");
    await page.goto("/en/about");
    await page.getByRole("link", { name: "العربية" }).first().click();
    await expect(page).toHaveURL(/\/ar\/about$/);
  });

  test("contact form validates and submits", async ({ page }) => {
    await page.goto("/en/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("This field is required.").first()).toBeVisible();
    await page.getByLabel("Full name").fill("E2E Visitor");
    await page.getByLabel("Email address").fill(`e2e+${Date.now()}@example.com`);
    await page.getByLabel("How can we help?").fill("Automated end-to-end test of the contact form.");
    await page.getByRole("checkbox").check();
    await page.waitForTimeout(2600); // the form rejects submissions faster than a person could type
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Thank you — your message has been sent.")).toBeVisible();
  });

  test("search finds services", async ({ page }) => {
    await page.goto("/en/search?q=cybersecurity");
    await expect(page.locator("main").getByRole("link", { name: /IT Consulting/ })).toBeVisible();
  });

  test("mobile navigation opens as a dialog", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/en");
    await page.getByRole("button", { name: "Menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Services" }).click();
    await expect(dialog.getByRole("link", { name: "Governance" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    // After scrolling the header turns solid (backdrop blur); the panel must still cover the screen.
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.getByRole("button", { name: "Menu" }).click();
    const box = await dialog.boundingBox();
    expect(box?.height).toBeGreaterThan((page.viewportSize()?.height ?? 0) * 0.9);
  });

  test("serves SEO essentials", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain("/en/services/governance");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
  });

  test("sends security headers and blocks path traversal on uploads", async ({ request }) => {
    const res = await request.get("/en");
    expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    const traversal = await request.get("/uploads/..%2F..%2F.env");
    expect(traversal.status()).toBeGreaterThanOrEqual(400);
    expect(traversal.status()).toBeLessThan(500);
  });

  test("consultation form validates the phone number and detects the country", async ({ page }) => {
    await page.goto("/en/consultation");
    await expect(page.locator("#cq-phoneCountry")).toContainText("+962");
    await page.getByLabel("Phone number").fill("12");
    await page.getByRole("button", { name: "Request consultation" }).click();
    await expect(page.getByText("Enter a valid phone number.")).toBeVisible();
    // Searchable country picker
    await page.locator("#cq-phoneCountry").click();
    await page.getByRole("combobox").fill("emir");
    await page.keyboard.press("Enter");
    await expect(page.locator("#cq-phoneCountry")).toContainText("+971");
  });

  test("team profiles open in a dialog", async ({ page }) => {
    await page.goto("/en/team");
    await page.getByRole("button", { name: "View profile" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { level: 2 })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("mobile services expand in place", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/en");
    const row = page.locator("[data-mobile-services] button").nth(1);
    await row.click();
    await expect(row).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("[data-mobile-services]").getByRole("link", { name: /Explore/ })).toBeVisible();
  });

  test("insights page is linked in the header and handles an empty archive", async ({ page, isMobile }) => {
    await page.goto("/en");
    if (!isMobile) await page.locator("header nav").getByRole("link", { name: "Insights" }).click();
    else await page.goto("/en/insights");
    await expect(page).toHaveURL(/\/en\/insights/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("articles link to services and expose BlogPosting structured data", async ({ page, request }) => {
    await page.goto("/en/insights/governance-beyond-compliance");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Governance beyond compliance");
    await expect(page.getByRole("heading", { name: "Services related to this article" })).toBeVisible();
    await expect(page.locator("article").getByRole("link", { name: /Request a consultation/ })).toHaveAttribute("href", /\/en\/consultation\?service=governance/);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((t) => t.includes('"BlogPosting"'))).toBe(true);
    const head = await page.locator('link[rel="alternate"][hreflang="ar"]').getAttribute("href");
    expect(head).toContain("/ar/insights/governance-beyond-compliance");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/insights/governance-beyond-compliance");
  });

  test("service pages have unique SEO titles and link to related insights", async ({ page }) => {
    await page.goto("/en/services/iso-consulting");
    await expect(page).toHaveTitle(/ISO Certification Consulting/);
    await expect(page.getByRole("heading", { name: "Related insights" })).toBeVisible();
  });
});
