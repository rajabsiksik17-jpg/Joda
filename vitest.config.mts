import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Integration tests run against a separate database: TEST_DATABASE_URL or "<DATABASE_URL db name>_test". */
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL?.replace(/\/([^/?]+)(\?|$)/, "/$1_test$2") ?? "";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      // Server-only guards are irrelevant in unit tests.
      "server-only": path.resolve(root, "tests/support/empty.ts"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    env: { DATABASE_URL: testDatabaseUrl, AUTH_SECRET: "test-secret-test-secret-test-secret-123456", NODE_ENV: "test" },
    globalSetup: ["tests/support/global-setup.ts"],
    setupFiles: ["tests/support/setup.ts"],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
