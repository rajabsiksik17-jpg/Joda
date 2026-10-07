import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { PageHeader } from "@/components/admin/ui";
import { RolesManager } from "./roles-manager";

export const metadata: Metadata = { title: "Roles" };

export default async function RolesPage() {
  await requirePage("roles.manage");
  const tx = makeTx(await getAdminLocale());
  const roles = await db.role.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { users: true } } } });
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={tx("Roles & permissions", "الأدوار والصلاحيات")} description={tx("Control what each role can see and change. Permissions are enforced on the server for every action.", "تحكم فيما يمكن لكل دور رؤيته وتعديله. تُطبَّق الصلاحيات على الخادم في كل إجراء.")} />
      <RolesManager roles={roles.map((r) => ({ id: r.id, key: r.key, name: r.name as { ar: string; en: string }, description: (r.description as { ar: string; en: string }) ?? { ar: "", en: "" }, permissions: r.permissions, isSystem: r.isSystem, users: r._count.users }))} />
    </div>
  );
}
