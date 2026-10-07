import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { tr } from "@/lib/i18n/localized";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { ADMIN_NAV } from "@/components/admin/nav";
import { AdminShell } from "@/components/admin/shell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePage();
  const locale = await getAdminLocale();
  const [unread, consultations] = await Promise.all([
    user.permissions.has("messages.view") ? db.contactMessage.count({ where: { status: "NEW" } }) : 0,
    user.permissions.has("consultations.view") ? db.consultationRequest.count({ where: { status: "PENDING" } }) : 0,
  ]);
  const nav = ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.permission || user.permissions.has(i.permission)) })).filter((g) => g.items.length);
  return (
    <AdminShell
      nav={nav}
      badges={{ unread, consultations }}
      user={{ name: user.name, email: user.email, role: tr(user.role.name, locale, true) }}
      locale={locale}
    >
      {children}
    </AdminShell>
  );
}
