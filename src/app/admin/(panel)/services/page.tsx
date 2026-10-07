import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { tr } from "@/lib/i18n/localized";
import { COLLECTIONS } from "@/lib/admin/collections";
import { listCollection } from "@/lib/admin/collection-store";
import { getFieldEnv } from "@/lib/admin/env";
import { PageHeader } from "@/components/admin/ui";
import { CollectionManager } from "@/components/admin/collection-manager";
import { ServicesList } from "./services-list";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  await requirePage("services.edit");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const [services, categories, env] = await Promise.all([
    db.service.findMany({ where: { deletedAt: null }, orderBy: { order: "asc" }, include: { category: true } }),
    listCollection("serviceCategories"),
    getFieldEnv(locale),
  ]);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={tx("Services", "الخدمات")}
        description={tx("The consulting services shown across the website, in menus and on their own pages.", "الخدمات الاستشارية المعروضة في الموقع والقوائم وصفحاتها الخاصة.")}
        actions={<Link href="/admin/services/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-tech-600 px-4 text-sm font-medium text-white hover:bg-tech-700"><Plus className="size-4" />{tx("New service", "خدمة جديدة")}</Link>}
      />
      <ServicesList
        services={services.map((s) => ({ id: s.id, slug: s.slug, title: tr(s.title, locale, true), icon: s.icon, category: s.category ? tr(s.category.name, locale, true) : "", published: s.status === "PUBLISHED", featured: s.featured, missingEn: !tr(s.title, "en"), missingAr: !tr(s.title, "ar") }))}
      />
      <section className="mt-12">
        <h2 className="mb-1 text-lg font-bold text-ink">{tx("Service categories", "فئات الخدمات")}</h2>
        <p className="mb-4 text-sm text-muted">{locale === "ar" ? COLLECTIONS.serviceCategories.description.ar : COLLECTIONS.serviceCategories.description.en}</p>
        <CollectionManager config={COLLECTIONS.serviceCategories} initialRows={categories as never} env={env} compact />
      </section>
    </div>
  );
}
