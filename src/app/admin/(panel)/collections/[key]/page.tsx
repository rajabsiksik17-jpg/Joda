import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { COLLECTIONS, isCollectionKey } from "@/lib/admin/collections";
import { listCollection } from "@/lib/admin/collection-store";
import { getFieldEnv } from "@/lib/admin/env";
import { PageHeader } from "@/components/admin/ui";
import { CollectionManager } from "@/components/admin/collection-manager";

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  return { title: isCollectionKey(key) ? COLLECTIONS[key].title.en : "Collection" };
}

export default async function CollectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isCollectionKey(key)) notFound();
  const config = COLLECTIONS[key];
  await requirePage(config.permission);
  const locale = await getAdminLocale();
  const [rows, env] = await Promise.all([listCollection(key), getFieldEnv(locale)]);
  const groups = key === "clients" ? await listCollection("clientGroups") : null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={locale === "ar" ? config.title.ar : config.title.en} description={locale === "ar" ? config.description.ar : config.description.en} />
      <CollectionManager config={config} initialRows={rows as never} env={env} />
      {groups && (
        <section className="mt-12">
          <h2 className="mb-1 text-lg font-bold text-ink">{locale === "ar" ? COLLECTIONS.clientGroups.title.ar : COLLECTIONS.clientGroups.title.en}</h2>
          <p className="mb-4 text-sm text-muted">{locale === "ar" ? COLLECTIONS.clientGroups.description.ar : COLLECTIONS.clientGroups.description.en}</p>
          <CollectionManager config={COLLECTIONS.clientGroups} initialRows={groups as never} env={env} compact />
        </section>
      )}
    </div>
  );
}
