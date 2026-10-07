import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { getDraftPage } from "@/lib/content/pages";
import { SectionList } from "@/components/sections/section-renderer";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Renders the unpublished (draft) state of a page for signed-in editors. */
export default async function PreviewPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!user.permissions.has("pages.view")) notFound();
  const page = await getDraftPage(id);
  if (!page) notFound();
  const dict = getSiteDictionary(locale);
  return (
    <>
      <div className="fixed bottom-4 start-1/2 z-[80] flex -translate-x-1/2 items-center gap-4 rounded-full bg-ink/95 py-2 ps-5 pe-2 text-sm text-white shadow-lift backdrop-blur rtl:translate-x-1/2" role="status">
        <Eye className="size-4 text-sky" aria-hidden />
        <span>{dict.previewBanner}</span>
        <Link href={`/admin/pages/${id}`} className="rounded-full bg-tech-600 px-4 py-1.5 font-semibold hover:bg-tech-700">{dict.exitPreview}</Link>
      </div>
      <SectionList sections={page.sections} ctx={{ locale, path: page.slug === "home" ? "/" : `/${page.slug}`, pageTitle: tr(page.title, locale, true), searchParams: await searchParams, isPreview: true }} />
    </>
  );
}
