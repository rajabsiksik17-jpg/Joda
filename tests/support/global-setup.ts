import { execSync } from "node:child_process";
import type { TestProject } from "vitest/node";

/** Applies migrations to the test database before the run. */
export default function setup(project: TestProject) {
  const url = project.config.env.DATABASE_URL;
  if (!url || !url.includes("_test")) throw new Error(`Refusing to run integration tests against a non-test database: ${url}`);
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: { ...process.env, DATABASE_URL: url } });
}
