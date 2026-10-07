import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a development server (local SMTP-less mode writes e-mails, including
 * sign-in codes, to storage/mail-outbox, which the tests read).
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3010",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /public\.spec\.ts/ },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3010/en",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
