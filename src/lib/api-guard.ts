import "server-only";
import { AuthError, authorize, type CurrentUser } from "./auth/session";
import type { Permission } from "./auth/permissions";

/**
 * CSRF defence for route handlers that change state (server actions have Next's built-in origin
 * check). Requires the Origin header to match the request host.
 */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function apiAuthorize(request: Request, permissions: Permission[], opts: { mutation?: boolean } = {}): Promise<CurrentUser | Response> {
  if (opts.mutation && !isSameOrigin(request)) return Response.json({ error: "forbidden_origin" }, { status: 403 });
  try {
    return await authorize(...permissions);
  } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.code }, { status: e.code === "unauthenticated" ? 401 : 403 });
    throw e;
  }
}
