import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Newspaper, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth/session";
import { getAdminLocale, makeTx } from "@/lib/i18n/admin-locale";
import { tr } from "@/lib/i18n/localized";
import { COLLECTIONS } from "@/lib/admin/collections";
import { listCollection } from "@/lib/admin/collection-store";
import { getFieldEnv } from "@/lib/admin/env";
import { formatDate } from "@/lib/format";
import { publicUrl } from "@/lib/media/storage";
import { Badge, EmptyState, PageHeader } from "@/components/admin/ui";
import { CollectionManager } from "@/components/admin/collection-manager";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Insights" };

type Filter = "all" | "published" | "scheduled" | "draft";

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requirePage("blog.edit");
  const locale = await getAdminLocale();
  const tx = makeTx(locale);
  const sp = await searchParams;
  const status = (["all", "published", "scheduled", "draft"].includes(sp.status ?? "") ? sp.status : "all") as Filter;
  const q = sp.q?.trim().slice(0, 80) ?? "";
  const now = new Date();
  const where = {
    deletedAt: null,
    ...(status === "published" ? { status: "PUBLISHED" as const, publishedAt: { lte: now } } : status === "scheduled" ? { status: "PUBLISHED" as const, publishedAt: { gt: now } } : status === "draft" ? { status: "DRAFT" as const } : {}),
    ...(q ? { OR: [{ slug: { contains: q, mode: "insensitive" as const } }, { title: { path: ["en"], string_contains: q } }, { title: { path: ["ar"], string_contains: q } }] } : {}),
  };
  const [posts, counts, categories, env] = await Promise.all([
    db.blogPost.findMany({ where, orderBy: [{ updatedAt: "desc" }], take: 100, include: { category: true } }),
    Promise.all([
      db.blogPost.count({ where: { deletedAt: null } }),
      db.blogPost.count({ where: { deletedAt: null, status: "PUBLISHED", publishedAt: { lte: now } } }),
      db.blogPost.count({ where: { deletedAt: null, status: "PUBLISHED", publishedAt: { gt: now } } }),
      db.blogPost.count({ where: { deletedAt: null, status: "DRAFT" } }),
    ]),
    listCollection("blogCategories"),
    getFieldEnv(locale),
  ]);
  const covers = await db.media.findMany({ where: { id: { in: posts.map((p) => p.coverId).filter((x): x is string => !!x) } } });
  const coverUrl = new Map(covers.map((c) => [c.id, publicUrl(c.key)]));
  const tabs: [Filter, string, number][] = [["all", tx("All", "الكل"), counts[0]], ["published", tx("Published", "منشورة"), counts[1]], ["scheduled", tx("Scheduled", "مجدولة"), counts[2]], ["draft", tx("Drafts", "مسودات"), counts[3]]];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={tx("Insights", "المقالات")}
        description={tx("Articles in Arabic and/or English. An article appears in each language that has a title.", "مقالات بالعربية و/أو الإنجليزية. يظهر المقال في كل لغة لها عنوان.")}
        actions={<Link href="/admin/insights/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-tech-600 px-4 text-sm font-medium text-white hover:bg-tech-700"><Plus className="size-4" />{tx("New insight", "مقال جديد")}</Link>}
      />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <nav className="flex gap-1 overflow-x-auto" aria-label={tx("Filter", "تصفية")}>
          {tabs.map(([key, label, n]) => (
            <Link key={key} href={`/admin/insights?status=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={cn("shrink-0 rounded-md px-3 py-1.5 text-sm font-medium", status === key ? "bg-navy text-white" : "text-ink hover:bg-white")}>
              {label} <span className="opacity-60" dir="ltr">{n}</span>
            </Link>
          ))}
        </nav>
        <form className="md:ms-auto" action="/admin/insights">
          <input type="hidden" name="status" value={status} />
          <input name="q" defaultValue={q} placeholder={tx("Search…", "بحث…")} className="h-10 w-full rounded-md border border-line-strong bg-white px-3 text-sm md:w-64" aria-label={tx("Search insights", "البحث في المقالات")} />
        </form>
      </div>
      {posts.length === 0 ? (
        <EmptyState icon={<Newspaper className="size-5" />} title={q || status !== "all" ? tx("No matching insights", "لا توجد مقالات مطابقة") : tx("No insights yet", "لا توجد مقالات بعد")} text={tx("Write your first article. Publish the Insights page from Pages once you have articles.", "اكتب مقالك الأول. انشر صفحة المقالات من قسم الصفحات عندما تتوفر مقالات.")} />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
          {posts.map((p) => {
            const scheduled = p.status === "PUBLISHED" && p.publishedAt && p.publishedAt > now;
            const cover = p.coverId ? coverUrl.get(p.coverId) : null;
            return (
              <li key={p.id}>
                <Link href={`/admin/insights/${p.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-surface/60">
                  <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-navy">{cover && <Image src={cover} alt="" fill sizes="64px" className="object-cover" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{tr(p.title, locale, true) || tx("(untitled)", "(بدون عنوان)")}</span>
                    <span className="block truncate text-xs text-muted">{p.category ? tr(p.category.name, locale, true) : tx("Uncategorized", "بدون تصنيف")} · {formatDate(p.publishedAt ?? p.updatedAt, locale)}</span>
                  </span>
                  <span className="hidden gap-1 sm:flex">
                    {tr(p.title, "ar") && <Badge>AR</Badge>}
                    {tr(p.title, "en") && <Badge>EN</Badge>}
                  </span>
                  {scheduled ? <Badge tone="info"><CalendarClock className="size-3" />{tx("Scheduled", "مجدول")}</Badge> : p.status === "PUBLISHED" ? <Badge tone="success">{tx("Published", "منشور")}</Badge> : <Badge>{tx("Draft", "مسودة")}</Badge>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <section className="mt-12">
        <h2 className="mb-1 text-lg font-bold text-ink">{tx("Categories", "التصنيفات")}</h2>
        <p className="mb-4 text-sm text-muted">{locale === "ar" ? COLLECTIONS.blogCategories.description.ar : COLLECTIONS.blogCategories.description.en}</p>
        <CollectionManager config={COLLECTIONS.blogCategories} initialRows={categories as never} env={env} compact />
      </section>
    </div>
  );
}
