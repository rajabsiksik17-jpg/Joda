import "server-only";
import { cookies } from "next/headers";
import { db } from "../db";
import { randomToken, sha256 } from "../crypto";
import { getRequestMeta } from "../request";
import { secureCookies } from "./session";

export const DEVICE_COOKIE = "qe_device";

/** Coarse browser/OS family used to notice when a trusted cookie appears in a different browser. */
export function agentFamily(ua: string | null | undefined) {
  const s = ua ?? "";
  const browser = /Edg\//.test(s) ? "edge" : /OPR\//.test(s) ? "opera" : /Firefox\//.test(s) ? "firefox" : /Chrome\//.test(s) ? "chrome" : /Safari\//.test(s) ? "safari" : "other";
  const os = /Windows/.test(s) ? "windows" : /Android/.test(s) ? "android" : /iPhone|iPad|iOS/.test(s) ? "ios" : /Mac OS X/.test(s) ? "mac" : /Linux/.test(s) ? "linux" : "other";
  return `${browser}/${os}`;
}

export function describeAgent(ua: string | null | undefined) {
  const [b, o] = agentFamily(ua).split("/");
  const name: Record<string, string> = { edge: "Edge", opera: "Opera", firefox: "Firefox", chrome: "Chrome", safari: "Safari", windows: "Windows", android: "Android", ios: "iOS", mac: "macOS", linux: "Linux", other: "" };
  return [name[b] || "Browser", name[o]].filter(Boolean).join(" · ");
}

export type DeviceCheck = { trusted: true; deviceId: string } | { trusted: false; reason: "no_device" | "expired" | "other_user" | "agent_changed" };

/** Looks up the trusted-device cookie for this user. */
export async function checkTrustedDevice(userId: string): Promise<DeviceCheck> {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!token || token.length > 200) return { trusted: false, reason: "no_device" };
  const device = await db.trustedDevice.findUnique({ where: { tokenHash: sha256(token) } });
  if (!device) return { trusted: false, reason: "no_device" };
  if (device.userId !== userId) return { trusted: false, reason: "other_user" };
  if (device.expiresAt < new Date()) return { trusted: false, reason: "expired" };
  const { userAgent } = await getRequestMeta();
  if (agentFamily(userAgent) !== agentFamily(device.userAgent)) return { trusted: false, reason: "agent_changed" };
  return { trusted: true, deviceId: device.id };
}

export async function touchTrustedDevice(deviceId: string) {
  const { ip } = await getRequestMeta();
  await db.trustedDevice.update({ where: { id: deviceId }, data: { lastUsedAt: new Date(), ip } }).catch(() => undefined);
}

/** Marks the current browser as trusted after a successful e-mail verification. */
export async function trustCurrentDevice(userId: string, days: number) {
  const token = randomToken(32);
  const { ip, userAgent } = await getRequestMeta();
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  await db.trustedDevice.create({ data: { userId, tokenHash: sha256(token), label: describeAgent(userAgent), ip, userAgent, expiresAt } });
  // Keep the list tidy: drop expired devices for this user.
  await db.trustedDevice.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
  (await cookies()).set(DEVICE_COOKIE, token, { httpOnly: true, secure: secureCookies, sameSite: "lax", path: "/admin", expires: expiresAt });
}

export async function currentDeviceId(): Promise<string | null> {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!token) return null;
  const d = await db.trustedDevice.findUnique({ where: { tokenHash: sha256(token) }, select: { id: true } });
  return d?.id ?? null;
}
