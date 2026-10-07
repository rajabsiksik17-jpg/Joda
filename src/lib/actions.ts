import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { AuthError } from "./auth/session";
import { CONTENT_TAG } from "./settings";

export type FieldErrors = Record<string, string>;
export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; fieldErrors?: FieldErrors };

/** Flattens zod issues into "path.to.field" → message codes for the form UI. */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Wraps a server action body: maps authorization failures, validation errors and unique
 * constraint violations to safe, typed results. Internal errors are logged, never leaked.
 */
export async function guarded<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.code };
    if (error instanceof z.ZodError) return { ok: false, error: "invalid", fieldErrors: zodFieldErrors(error) };
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return { ok: false, error: "duplicate" };
    if (code === "P2025") return { ok: false, error: "not_found" };
    if (code === "P2003") return { ok: false, error: "in_use" };
    console.error("[action] unexpected error", error);
    return { ok: false, error: "server" };
  }
}

/** Refreshes every cached public read after a content change. */
export function invalidateContent() {
  updateTag(CONTENT_TAG);
}
