import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { getFieldEnv } from "@/lib/admin/env";
import { PageBuilder } from "@/components/admin/builder/page-builder";

export const metadata: Metadata = { title: "Page builder" };

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("pages.view");
  const { id } = await params;
  const locale = await getAdminLocale();
  const [page, env, templates] = await Promise.all([
    db.page.findFirst({ where: { id, deletedAt: null }, include: { sections: { orderBy: { order: "asc" } } } }),
    getFieldEnv(locale),
    db.sectionTemplate.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, type: true } }),
  ]);
  if (!page) notFound();
  return (
    <PageBuilder
      env={env}
      templates={templates}
      can={{ edit: user.permissions.has("pages.edit"), publish: user.permissions.has("pages.publish"), del: user.permissions.has("pages.delete") }}
      page={{
        id: page.id,
        slug: page.slug,
        kind: page.kind,
        title: page.title as { ar: string; en: string },
        seo: (page.seo as Record<string, unknown>) ?? {},
        status: page.status,
        changed: page.hasUnpublishedChanges,
        publishedAt: page.publishedAt?.toISOString() ?? null,
        updatedAt: page.updatedAt.toISOString(),
      }}
      initialSections={page.sections.map((s) => ({ id: s.id, type: s.type, visible: s.visible, data: s.data as Record<string, unknown>, settings: (s.settings as Record<string, unknown>) ?? {} }))}
    />
  );
}
