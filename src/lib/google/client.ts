import "server-only";
import { decryptSecret, encryptSecret } from "../crypto";
import { readSetting, writeSetting } from "../settings";
import { siteUrl } from "../seo";

/**
 * Google OAuth 2.0 (web server flow) for read-only Analytics and Search Console access.
 * The client secret and refresh token are stored encrypted; access tokens live only in memory.
 */
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
];

export const GOOGLE_STATE_COOKIE = "qe_google_state";

export function googleRedirectUri() {
  return `${siteUrl()}/api/admin/google/callback`;
}

export class GoogleApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: "not_configured" | "not_connected" | "auth" | "permission" | "not_found" | "quota" | "network" | "api",
  ) {
    super(message);
  }
}

export async function getGoogleConfig() {
  const s = await readSetting("google");
  return {
    ...s,
    hasClient: !!(s.clientId && s.clientSecretEnc),
    connected: !!s.refreshTokenEnc,
  };
}

export function buildAuthUrl(clientId: string, state: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    // Always ask for consent so Google returns a refresh token on reconnection.
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function tokenRequest(body: Record<string, string>) {
  let res: Response;
  try {
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new GoogleApiError("Could not reach Google.", 0, "network");
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = String(json.error ?? "");
    throw new GoogleApiError(String(json.error_description ?? err ?? "Token request failed"), res.status, err === "invalid_grant" || err === "invalid_client" || err === "unauthorized_client" ? "auth" : "api");
  }
  return json;
}

/** Exchanges the authorization code and stores the encrypted refresh token. */
export async function completeAuthorization(code: string) {
  const s = await readSetting("google");
  const json = await tokenRequest({
    code,
    client_id: s.clientId,
    client_secret: decryptSecret(s.clientSecretEnc),
    redirect_uri: googleRedirectUri(),
    grant_type: "authorization_code",
  });
  const refresh = String(json.refresh_token ?? "");
  if (!refresh) throw new GoogleApiError("Google did not return a refresh token. Remove the app's access from your Google account and connect again.", 400, "auth");
  // The ID token comes straight from Google's token endpoint over TLS, so its payload can be read directly.
  let email = "";
  const idToken = String(json.id_token ?? "");
  if (idToken.split(".").length === 3) {
    try {
      email = String((JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")) as { email?: string }).email ?? "");
    } catch {
      email = "";
    }
  }
  cacheToken(String(json.access_token ?? ""), Number(json.expires_in ?? 0));
  await writeSetting("google", {
    ...s,
    refreshTokenEnc: encryptSecret(refresh),
    accountEmail: email.slice(0, 320),
    scopes: String(json.scope ?? "").split(" ").filter(Boolean).slice(0, 20),
    connectedAt: new Date().toISOString(),
    lastError: "",
  });
  return { email };
}

// ─── Access tokens (memory only) ───
let tokenCache: { token: string; expiresAt: number } | null = null;

function cacheToken(token: string, expiresIn: number) {
  tokenCache = token ? { token, expiresAt: Date.now() + Math.max(0, expiresIn - 60) * 1000 } : null;
}

export function forgetAccessToken() {
  tokenCache = null;
}

async function accessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  const s = await readSetting("google");
  if (!s.clientId || !s.clientSecretEnc) throw new GoogleApiError("Google API credentials are not configured.", 0, "not_configured");
  if (!s.refreshTokenEnc) throw new GoogleApiError("Google account is not connected.", 0, "not_connected");
  const json = await tokenRequest({
    client_id: s.clientId,
    client_secret: decryptSecret(s.clientSecretEnc),
    refresh_token: decryptSecret(s.refreshTokenEnc),
    grant_type: "refresh_token",
  });
  cacheToken(String(json.access_token ?? ""), Number(json.expires_in ?? 3600));
  return tokenCache!.token;
}

/** Revokes the refresh token at Google (best effort) and clears it locally. */
export async function disconnectGoogle() {
  const s = await readSetting("google");
  const refresh = decryptSecret(s.refreshTokenEnc);
  if (refresh) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, { method: "POST", signal: AbortSignal.timeout(10_000) }).catch(() => undefined);
  }
  forgetAccessToken();
  await writeSetting("google", { ...s, refreshTokenEnc: "", accountEmail: "", scopes: [], connectedAt: "", lastSyncAt: "", lastError: "" });
}

/** Authenticated JSON request to a Google API, with errors mapped to readable categories. */
export async function googleFetch<T>(url: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const token = await accessToken();
  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
  } catch {
    throw new GoogleApiError("Could not reach Google.", 0, "network");
  }
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string; status?: string } } & T;
  if (!res.ok) {
    if (res.status === 401) forgetAccessToken();
    const code = res.status === 401 ? "auth" : res.status === 403 ? "permission" : res.status === 404 ? "not_found" : res.status === 429 ? "quota" : "api";
    throw new GoogleApiError(json.error?.message ?? `Google API error (${res.status})`, res.status, code);
  }
  return json;
}

/** Records the outcome of a sync so the admin can see when data was last fetched and why it failed. */
export async function recordSync(error?: unknown) {
  const s = await readSetting("google");
  const message = error ? (error instanceof Error ? error.message : String(error)).slice(0, 500) : "";
  await writeSetting("google", { ...s, lastSyncAt: error ? s.lastSyncAt : new Date().toISOString(), lastError: message });
}
