import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { getFieldEnv } from "@/lib/admin/env";
import { PageHeader } from "@/components/admin/ui";
import { MenuEditor, type MenuRow } from "./menu-editor";

export const metadata: Metadata = { title: "Navigation" };

export default async function NavigationPage() {
  await requirePage("navigation.edit");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const [menus, env] = await Promise.all([db.menu.findMany({ include: { items: { orderBy: { order: "asc" } } } }), getFieldEnv(locale)]);

  // Flatten each menu tree into an ordered list with depth (children follow their parent).
  const flat = (key: string): MenuRow[] => {
    const items = menus.find((m) => m.key === key)?.items ?? [];
    const roots = items.filter((i) => !i.parentId);
    return roots.flatMap((r) => [r, ...items.filter((c) => c.parentId === r.id)]).map((i) => ({
      id: i.id,
      label: i.label as { ar: string; en: string },
      description: (i.description as { ar: string; en: string }) ?? { ar: "", en: "" },
      linkType: i.linkType,
      pageId: i.pageId,
      serviceId: i.serviceId,
      url: i.url ?? "",
      openInNewTab: i.openInNewTab,
      visible: i.visible,
      depth: i.parentId ? 1 : 0,
    }));
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={tx("Navigation", "القوائم")} description={tx("Menus in the header, footer and legal bar. Links to unpublished pages are hidden automatically.", "قوائم الرأس والتذييل والروابط القانونية. تُخفى الروابط إلى الصفحات غير المنشورة تلقائياً.")} />
      <MenuEditor env={env} menus={{ header: flat("header"), footer: flat("footer"), legal: flat("legal") }} />
    </div>
  );
}
