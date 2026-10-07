import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { tr, type L } from "@/lib/i18n/localized";
import { getFieldEnv } from "@/lib/admin/env";
import { PostEditorClient } from "./post-editor";

export const metadata: Metadata = { title: "Edit insight" };

export default async function PostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("blog.edit");
  const { id } = await params;
  const locale = await getAdminLocale();
  const env = await getFieldEnv(locale);
  const empty = { ar: "", en: "" };
  const canPublish = user.permissions.has("blog.publish");

  if (id === "new") {
    return (
      <PostEditorClient
        id={null}
        canPublish={canPublish}
        title={locale === "ar" ? "مقال جديد" : "New insight"}
        env={env}
        initial={{ title: empty, excerpt: empty, content: empty, status: "DRAFT", publishedAt: null, slug: "", coverId: null, categoryId: null, tags: [], authorName: "", featured: false, seoTitle: empty, seoDescription: empty, ogImageId: null }}
      />
    );
  }
  const p = await db.blogPost.findFirst({ where: { id, deletedAt: null } });
  if (!p) notFound();
  const seo = (p.seo as { title?: L; description?: L; ogImageId?: string | null }) ?? {};
  const live = p.status === "PUBLISHED" && !!p.publishedAt && p.publishedAt <= new Date();
  return (
    <PostEditorClient
      id={p.id}
      canPublish={canPublish}
      title={tr(p.title, locale, true) || (locale === "ar" ? "(بدون عنوان)" : "(untitled)")}
      status={p.status === "PUBLISHED" ? (live ? "live" : "scheduled") : "draft"}
      viewHref={live ? `/${tr(p.title, locale) ? locale : locale === "ar" ? "en" : "ar"}/insights/${p.slug}` : null}
      env={env}
      initial={{
        title: p.title,
        excerpt: p.excerpt ?? empty,
        content: p.content,
        status: p.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        publishedAt: p.publishedAt?.toISOString() ?? null,
        slug: p.slug,
        coverId: p.coverId,
        categoryId: p.categoryId,
        tags: p.tags,
        authorName: p.authorName ?? "",
        featured: p.featured,
        seoTitle: seo.title ?? empty,
        seoDescription: seo.description ?? empty,
        ogImageId: seo.ogImageId ?? null,
      }}
    />
  );
}
