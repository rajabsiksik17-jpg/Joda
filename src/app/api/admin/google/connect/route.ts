import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiAuthorize } from "@/lib/api-guard";
import { randomToken } from "@/lib/crypto";
import { secureCookies } from "@/lib/auth/session";
import { GOOGLE_STATE_COOKIE, buildAuthUrl, getGoogleConfig } from "@/lib/google/client";

export const dynamic = "force-dynamic";

/** Starts the Google OAuth flow. A random state value in an HttpOnly cookie protects the callback (CSRF). */
export async function GET(request: Request) {
  const user = await apiAuthorize(request, ["settings.edit"]);
  if (user instanceof Response) return NextResponse.redirect(new URL("/admin/login", request.url));
  const cfg = await getGoogleConfig();
  if (!cfg.hasClient) return NextResponse.redirect(new URL("/admin/integrations?google=not_configured", request.url));
  const state = randomToken(24);
  (await cookies()).set(GOOGLE_STATE_COOKIE, state, { httpOnly: true, secure: secureCookies, sameSite: "lax", path: "/api/admin/google", maxAge: 600 });
  return NextResponse.redirect(buildAuthUrl(cfg.clientId, state));
}
