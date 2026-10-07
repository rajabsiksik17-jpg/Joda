import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../db";
import { randomToken, sha256 } from "../crypto";
import { getRequestMeta } from "../request";
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE, isPermission, type Permission } from "./permissions";

export const SESSION_COOKIE = "qe_session";
export const CHALLENGE_COOKIE = "qe_challenge";

export const secureCookies = process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  preferredLocale: string;
  sessionId: string;
  role: { id: string; key: string; name: unknown };
  permissions: Set<Permission>;
};

export async function createSession(userId: string, hours: number) {
  const token = randomToken(32);
  const { ip, userAgent } = await getRequestMeta();
  const expiresAt = new Date(Date.now() + hours * 3600_000);
  await db.session.create({ data: { tokenHash: sha256(token), userId, expiresAt, ip, userAgent } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Resolves the signed-in admin for this request (memoised per request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 200) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { role: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;

  // Keep "last active" fresh without writing on every request.
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) {
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
  }

  const { user } = session;
  const permissions = new Set<Permission>(
    user.role.key === SUPER_ADMIN_ROLE ? ALL_PERMISSIONS : user.role.permissions.filter(isPermission),
  );
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    preferredLocale: user.preferredLocale,
    sessionId: session.id,
    role: { id: user.role.id, key: user.role.key, name: user.role.name },
    permissions,
  };
});

export function can(user: CurrentUser | null, permission: Permission) {
  return !!user && user.permissions.has(permission);
}

/** For admin pages: redirects to login, or to the dashboard with a notice when forbidden. */
export async function requirePage(permission?: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (permission && !user.permissions.has(permission)) redirect("/admin?denied=1");
  return user;
}

export class AuthError extends Error {
  constructor(public code: "unauthenticated" | "forbidden") {
    super(code);
  }
}

/** For server actions and route handlers: throws AuthError. */
export async function authorize(...required: Permission[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("unauthenticated");
  for (const p of required) if (!user.permissions.has(p)) throw new AuthError("forbidden");
  return user;
}
