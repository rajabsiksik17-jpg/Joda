import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { apiAuthorize } from "@/lib/api-guard";
import { audit } from "@/lib/audit";
import { safeEqual } from "@/lib/crypto";
import { GOOGLE_STATE_COOKIE, GoogleApiError, completeAuthorization } from "@/lib/google/client";
import { GOOGLE_DATA_TAG } from "@/lib/google/reports";

export const dynamic = "force-dynamic";

/** Google redirects here after consent. Verifies state, exchanges the code and stores the encrypted refresh token. */
export async function GET(request: Request) {
  const back = (result: string) => NextResponse.redirect(new URL(`/admin/integrations?google=${result}`, request.url));
  const user = await apiAuthorize(request, ["settings.edit"]);
  if (user instanceof Response) return NextResponse.redirect(new URL("/admin/login", request.url));

  const url = new URL(request.url);
  const jar = await cookies();
  const expected = jar.get(GOOGLE_STATE_COOKIE)?.value ?? "";
  jar.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/admin/google" });
  const state = url.searchParams.get("state") ?? "";
  if (!expected || !state || !safeEqual(expected, state)) return back("state_mismatch");
  if (url.searchParams.get("error")) return back(url.searchParams.get("error") === "access_denied" ? "denied" : "error");
  const code = url.searchParams.get("code");
  if (!code) return back("error");

  try {
    const { email } = await completeAuthorization(code);
    await audit({ action: "integration.connect", userId: user.id, actorEmail: user.email, entityType: "integration", entityId: "google", metadata: { account: email } });
    revalidateTag(GOOGLE_DATA_TAG, { expire: 0 });
    return back("connected");
  } catch (error) {
    await audit({ action: "integration.error", userId: user.id, actorEmail: user.email, entityType: "integration", entityId: "google", metadata: { stage: "authorize", code: error instanceof GoogleApiError ? error.code : "unknown" } });
    return back(error instanceof GoogleApiError && error.code === "auth" ? "auth_failed" : "error");
  }
}
