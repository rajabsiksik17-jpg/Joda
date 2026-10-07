import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { tr } from "@/lib/i18n/localized";
import { PageHeader } from "@/components/admin/ui";
import { UsersManager } from "./users-manager";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const me = await requirePage("users.manage");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const [users, roles, sessions] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "asc" }, include: { role: true } }),
    db.role.findMany({ orderBy: { createdAt: "asc" } }),
    db.session.groupBy({ by: ["userId"], where: { expiresAt: { gt: new Date() } }, _count: true }),
  ]);
  const { open } = await searchParams;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={tx("Users", "المستخدمون")} description={tx("Staff accounts for the CMS. Every sign-in requires a password and an e-mailed code.", "حسابات الموظفين في نظام الإدارة. يتطلب كل تسجيل دخول كلمة مرور ورمزاً يُرسل بالبريد.")} />
      <UsersManager
        meId={me.id}
        meIsSuper={me.role.key === "super_admin"}
        openId={open}
        roles={roles.map((r) => ({ id: r.id, key: r.key, name: tr(r.name, locale, true) }))}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          roleId: u.roleId,
          roleKey: u.role.key,
          roleName: tr(u.role.name, locale, true),
          isActive: u.isActive,
          locked: !!u.lockedUntil && u.lockedUntil > new Date(),
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          sessions: sessions.find((s) => s.userId === u.id)?._count ?? 0,
        }))}
      />
    </div>
  );
}
