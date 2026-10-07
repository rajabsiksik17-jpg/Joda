import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { tr } from "@/lib/i18n/localized";
import { PageHeader } from "@/components/admin/ui";
import { PagesTable } from "./pages-table";

export const metadata: Metadata = { title: "Pages" };

export default async function PagesPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const user = await requirePage("pages.view");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const pages = await db.page.findMany({ where: { deletedAt: null }, orderBy: [{ kind: "asc" }, { updatedAt: "desc" }], include: { _count: { select: { sections: true } } } });
  const { new: openNew } = await searchParams;
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={tx("Pages", "الصفحات")} description={tx("Build pages from sections. Changes stay private until you publish.", "ابنِ الصفحات من الأقسام. تبقى التغييرات خاصة حتى تقوم بالنشر.")} />
      <PagesTable
        openNew={openNew === "1"}
        can={{ edit: user.permissions.has("pages.edit"), publish: user.permissions.has("pages.publish"), del: user.permissions.has("pages.delete") }}
        pages={pages.map((p) => ({
          id: p.id,
          slug: p.slug,
          kind: p.kind,
          title: tr(p.title, locale, true),
          status: p.status,
          changed: p.hasUnpublishedChanges,
          sections: p._count.sections,
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
