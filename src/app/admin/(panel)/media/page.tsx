import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { PageHeader } from "@/components/admin/ui";
import { MediaBrowser } from "@/components/admin/media/media-browser";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  await requirePage("media.manage");
  const tx = makeTx(await getAdminLocale());
  const { open } = await searchParams;
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={tx("Media library", "مكتبة الوسائط")} description={tx("Upload and manage images and videos. Files are validated, stripped of metadata and optimized automatically.", "ارفع الصور ومقاطع الفيديو وأدِرها. يتم التحقق من الملفات وإزالة بياناتها الوصفية وتحسينها تلقائياً.")} />
      <MediaBrowser mode="manage" initialOpenId={open} />
    </div>
  );
}
