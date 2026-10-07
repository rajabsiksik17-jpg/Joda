import { vi } from "vitest";

// Unit tests run outside a Next.js request: provide the request-scoped APIs our modules use.
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "vitest", "x-real-ip": "127.0.0.1" }),
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
}));
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  updateTag: () => undefined,
  revalidateTag: () => undefined,
}));
