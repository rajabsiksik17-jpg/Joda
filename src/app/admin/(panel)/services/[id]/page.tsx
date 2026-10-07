import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { tr, type L } from "@/lib/i18n/localized";
import { getFieldEnv } from "@/lib/admin/env";
import { ServiceEditorClient } from "./service-editor";

export const metadata: Metadata = { title: "Edit service" };

type Group = { title?: L; text?: L; items?: L[] };

export default async function ServiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("services.edit");
  const { id } = await params;
  const locale = await getAdminLocale();
  const env = await getFieldEnv(locale);
  const empty = { ar: "", en: "" };

  if (id === "new") {
    return (
      <ServiceEditorClient
        id={null}
        title={locale === "ar" ? "خدمة جديدة" : "New service"}
        env={env}
        initial={{ title: empty, summary: empty, description: empty, whyItMatters: empty, outcomes: [], visual: "auto", capabilityLayout: "grid", capabilities: [], steps: [], ctaLabel: empty, status: "DRAFT", slug: "", icon: "sparkles", categoryId: null, featured: false, imageId: null, relatedIds: [], seoTitle: empty, seoDescription: empty, ogImageId: null }}
      />
    );
  }

  const s = await db.service.findFirst({ where: { id, deletedAt: null }, include: { related: { select: { id: true } } } });
  if (!s) notFound();
  const seo = (s.seo as { title?: L; description?: L; ogImageId?: string | null }) ?? {};
  return (
    <ServiceEditorClient
      id={s.id}
      title={tr(s.title, locale, true)}
      published={s.status === "PUBLISHED"}
      slug={s.slug}
      env={env}
      initial={{
        title: s.title,
        summary: s.summary ?? empty,
        description: s.description ?? empty,
        whyItMatters: s.whyItMatters ?? empty,
        outcomes: (s.outcomes as unknown[]) ?? [],
        visual: s.visual,
        capabilityLayout: s.capabilityLayout,
        capabilities: ((s.capabilities as Group[]) ?? []).map((g) => ({ title: g.title ?? empty, text: g.text ?? empty, items: (g.items ?? []).map((t) => ({ text: t })) })),
        steps: (s.steps as unknown[]) ?? [],
        ctaLabel: s.ctaLabel ?? empty,
        status: s.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        slug: s.slug,
        icon: s.icon,
        categoryId: s.categoryId,
        featured: s.featured,
        imageId: s.imageId,
        relatedIds: s.related.map((r) => r.id),
        seoTitle: seo.title ?? empty,
        seoDescription: seo.description ?? empty,
        ogImageId: seo.ogImageId ?? null,
      }}
    />
  );
}
