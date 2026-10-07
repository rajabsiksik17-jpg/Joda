import type { Metadata } from "next";
import { db } from "@/lib/db";
import { currentDeviceId } from "@/lib/auth/trusted-device";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { PageHeader } from "@/components/admin/ui";
import { AccountForms } from "./account-forms";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requirePage();
  const tx = makeTx(await getAdminLocale());
  const [sessions, devices, thisDevice] = await Promise.all([
    db.session.findMany({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" } }),
    db.trustedDevice.findMany({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { lastUsedAt: "desc" } }),
    currentDeviceId(),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={tx("My account", "حسابي")} description={user.email} />
      <AccountForms
        profile={{ name: user.name, preferredLocale: user.preferredLocale === "en" ? "en" : "ar" }}
        sessions={sessions.map((s) => ({ id: s.id, current: s.id === user.sessionId, userAgent: s.userAgent ?? "", ip: s.ip ?? "", lastSeenAt: s.lastSeenAt.toISOString(), createdAt: s.createdAt.toISOString() }))}
        devices={devices.map((d) => ({ id: d.id, current: d.id === thisDevice, label: d.label ?? "", ip: d.ip ?? "", lastUsedAt: d.lastUsedAt.toISOString(), expiresAt: d.expiresAt.toISOString() }))}
      />
    </div>
  );
}
