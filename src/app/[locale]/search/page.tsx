import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { searchSite } from "@/lib/content/search";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, path: "/search", title: getSiteDictionary(locale).search, noindex: true });
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getSiteDictionary(locale);
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim().slice(0, 100);
  let hits: Awaited<ReturnType<typeof searchSite>> = [];
  if (q.length >= 2) {
    const { ip } = await getRequestMeta();
    const limit = await rateLimit(`search:${ip}`, 60, 60);
    if (limit.ok) hits = await searchSite(q, locale);
  }
  const kindLabel = { service: dict.services, post: dict.insights, page: dict.pageKind };

  return (
    <>
      <section className="theme-navy relative overflow-hidden">
        <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-qe relative max-w-4xl pt-36 pb-16 lg:pt-44">
          <Breadcrumbs locale={locale} items={[{ label: dict.search }]} />
          <h1 className="display t-section text-white">{q ? `${dict.searchResultsFor} “${q}”` : dict.search}</h1>
          <form action={`/${locale}/search`} method="get" role="search" className="relative mt-10">
            <label htmlFor="site-search" className="sr-only">{dict.search}</label>
            <input id="site-search" name="q" type="search" defaultValue={q} placeholder={dict.searchPlaceholder} maxLength={100} autoFocus className="h-16 w-full border border-white/20 bg-white/5 ps-14 pe-36 text-lg text-white placeholder:text-white/45 focus:border-sky focus:outline-none" />
            <Search className="pointer-events-none absolute top-1/2 start-5 size-5 -translate-y-1/2 text-white/60" aria-hidden />
            <button type="submit" className="btn btn-primary absolute top-2 end-2 !min-h-12">{dict.search}</button>
          </form>
        </div>
      </section>
      <section className="section-y-compact">
        <div className="container-qe max-w-4xl">
          {q.length >= 2 && hits.length === 0 && <p className="py-10 text-lg text-muted">{dict.noResults}</p>}
          <ul className="divide-y divide-line">
            {hits.map((h) => (
              <li key={h.href}>
                <Link href={h.href} className="group block py-7">
                  <p className="text-xs font-semibold tracking-[0.14em] text-tech-600 uppercase rtl:tracking-normal">{kindLabel[h.kind]}</p>
                  <h2 className="heading mt-2 flex items-center gap-2 text-xl text-ink group-hover:text-tech-600">
                    {h.title}
                    <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100" aria-hidden />
                  </h2>
                  {h.snippet && <p className="mt-2 line-clamp-2 text-body">{h.snippet}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
