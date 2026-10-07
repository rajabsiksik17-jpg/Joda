"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/session";
import { encryptSecret } from "@/lib/crypto";
import { guarded, type ActionResult } from "@/lib/actions";
import { GoogleApiError, disconnectGoogle, forgetAccessToken, recordSync } from "@/lib/google/client";
import { GOOGLE_DATA_TAG, listGa4Properties, listSearchConsoleSites } from "@/lib/google/reports";
import { readSetting, writeSetting } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";

const googleError = (e: unknown): { ok: false; error: string } => ({ ok: false, error: e instanceof GoogleApiError ? `google_${e.code}` : "server" });

export async function saveGoogleCredentials(input: unknown): Promise<ActionResult> {
  return guarded<undefined>(async () => {
    const user = await authorize("settings.edit");
    const v = z.object({ clientId: z.string().trim().max(300), clientSecret: z.string().trim().max(500) }).safeParse(input);
    const fieldErrors: Record<string, string> = {};
    if (!v.success || !/^[\w.-]+\.apps\.googleusercontent\.com$/.test(v.data.clientId)) fieldErrors.clientId = "invalid";
    const s = await readSetting("google");
    if (v.success && !v.data.clientSecret && !s.clientSecretEnc) fieldErrors.clientSecret = "required";
    if (!v.success || Object.keys(fieldErrors).length) return { ok: false, error: "invalid", fieldErrors };
    const clientChanged = s.clientId !== v.data.clientId;
    // A refresh token belongs to one OAuth client: changing the client disconnects the account.
    if (clientChanged && s.refreshTokenEnc) await disconnectGoogle();
    const fresh = clientChanged ? await readSetting("google") : s;
    await writeSetting("google", { ...fresh, clientId: v.data.clientId, clientSecretEnc: v.data.clientSecret ? encryptSecret(v.data.clientSecret) : fresh.clientSecretEnc }, user.id);
    forgetAccessToken();
    await audit({ action: "integration.update", userId: user.id, actorEmail: user.email, entityType: "integration", entityId: "google", metadata: { clientId: v.data.clientId, secretChanged: !!v.data.clientSecret } });
    return { ok: true };
  });
}

export async function disconnectGoogleAction(): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("settings.edit");
    await disconnectGoogle();
    updateTag(GOOGLE_DATA_TAG);
    await audit({ action: "integration.disconnect", userId: user.id, actorEmail: user.email, entityType: "integration", entityId: "google" });
    return { ok: true };
  });
}

export async function removeGoogleCredentials(): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("settings.edit");
    await disconnectGoogle();
    const s = await readSetting("google");
    await writeSetting("google", { ...s, clientId: "", clientSecretEnc: "", ga4Property: "", ga4PropertyName: "", searchConsoleSite: "" }, user.id);
    updateTag(GOOGLE_DATA_TAG);
    await audit({ action: "integration.disconnect", userId: user.id, actorEmail: user.email, entityType: "integration", entityId: "google", metadata: { credentialsRemoved: true } });
    return { ok: true };
  });
}

/** Lists the GA4 properties and Search Console sites the connected account can read (also serves as a connection test). */
type Choices = { properties: { id: string; name: string }[]; sites: { url: string; permission: string }[]; errors: { analytics?: string; searchConsole?: string } };

export async function loadGoogleChoices(): Promise<ActionResult<Choices>> {
  return guarded<Choices>(async () => {
    await authorize("settings.edit");
    const [p, s] = await Promise.allSettled([listGa4Properties(), listSearchConsoleSites()]);
    const code = (r: PromiseSettledResult<unknown>) => (r.status === "rejected" ? (r.reason instanceof GoogleApiError ? r.reason.code : "api") : undefined);
    if (p.status === "rejected" && s.status === "rejected") {
      await recordSync(p.reason);
      return googleError(p.reason);
    }
    await recordSync(p.status === "rejected" ? p.reason : s.status === "rejected" ? s.reason : undefined);
    return {
      ok: true,
      data: {
        properties: p.status === "fulfilled" ? p.value : [],
        sites: s.status === "fulfilled" ? s.value : [],
        errors: { analytics: code(p), searchConsole: code(s) },
      },
    };
  });
}

export async function saveGoogleTargets(input: unknown): Promise<ActionResult> {
  return guarded(async () => {
    const user = await authorize("settings.edit");
    const v = z
      .object({ ga4Property: z.string().regex(/^(properties\/\d+)?$/), ga4PropertyName: z.string().max(200), searchConsoleSite: z.string().max(300) })
      .safeParse(input);
    if (!v.success) return { ok: false, error: "invalid" };
    const s = await readSetting("google");
    await writeSetting("google", { ...s, ...v.data }, user.id);
    updateTag(GOOGLE_DATA_TAG);
    await audit({ action: "integration.update", userId: user.id, actorEmail: user.email, entityType: "integration", entityId: "google", metadata: { ga4Property: v.data.ga4Property, searchConsoleSite: v.data.searchConsoleSite } });
    return { ok: true };
  });
}

/**
 * Checks Search Console site verification without Google credentials: the public home page must carry the
 * configured <meta name="google-site-verification"> tag. When an account is connected, also reports
 * whether Google lists the site as verified for that account.
 */
export async function testSiteVerification(): Promise<ActionResult<{ code: string; metaFound: boolean; url: string; googleStatus: "verified" | "unverified" | "not_listed" | "not_connected" }>> {
  return guarded(async () => {
    await authorize("settings.edit");
    const seo = await readSetting("seo");
    const url = `${siteUrl()}/`;
    let metaFound = false;
    if (seo.googleVerification) {
      try {
        const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15_000), cache: "no-store" });
        const html = await res.text();
        const tags = html.match(/<meta[^>]+name=["']google-site-verification["'][^>]*>/gi) ?? [];
        metaFound = tags.some((t) => t.includes(`content="${seo.googleVerification}"`) || t.includes(`content='${seo.googleVerification}'`));
      } catch {
        metaFound = false;
      }
    }
    const g = await readSetting("google");
    let googleStatus: "verified" | "unverified" | "not_listed" | "not_connected" = "not_connected";
    if (g.refreshTokenEnc) {
      try {
        const sites = await listSearchConsoleSites();
        const host = new URL(url).host;
        const match = sites.find((s) => s.url === g.searchConsoleSite) ?? sites.find((s) => s.url.includes(host));
        googleStatus = !match ? "not_listed" : match.permission === "siteUnverifiedUser" ? "unverified" : "verified";
      } catch {
        googleStatus = "not_connected";
      }
    }
    return { ok: true, data: { code: seo.googleVerification, metaFound, url, googleStatus } };
  });
}

export async function refreshGoogleData(): Promise<ActionResult> {
  return guarded(async () => {
    await authorize("analytics.view");
    updateTag(GOOGLE_DATA_TAG);
    return { ok: true };
  });
}
