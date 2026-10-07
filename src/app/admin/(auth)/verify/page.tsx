import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CHALLENGE_COOKIE, getCurrentUser } from "@/lib/auth/session";
import { readSetting } from "@/lib/settings";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify" };

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"•".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

function secondsSince(date: Date) {
  return (Date.now() - date.getTime()) / 1000;
}

function isPast(date: Date) {
  return date.getTime() < Date.now();
}

export default async function VerifyPage() {
  if (await getCurrentUser()) redirect("/admin");
  const id = (await cookies()).get(CHALLENGE_COOKIE)?.value;
  const challenge = id ? await db.loginChallenge.findUnique({ where: { id }, include: { user: { select: { email: true } } } }) : null;
  if (!challenge || challenge.consumedAt || isPast(challenge.expiresAt)) redirect("/admin/login?expired=1");
  const security = await readSetting("security");
  const cooldown = Math.max(0, Math.ceil(security.otpResendCooldownSeconds - secondsSince(challenge.lastSentAt)));
  return (
    <VerifyForm
      email={maskEmail(challenge.user.email)}
      initialCooldown={cooldown}
      minutes={security.otpTtlMinutes}
      trustDays={security.otpMode === "new_device" ? security.trustedDeviceDays : null}
    />
  );
}
