import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { tr, type L } from "@/lib/i18n/localized";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { getClientGroups, getServiceCategories, getServices, getTestimonials } from "@/lib/content/collections";
import { getBlogCategories, latestPosts, listPosts } from "@/lib/content/posts";
import { getMedia } from "@/lib/media";
import { Icon } from "@/lib/icons";
import { localizeHref } from "@/lib/links";
import { cn } from "@/lib/cn";
import { MediaImage } from "../site/media-image";
import { BrandMotif } from "../site/brand-motif";
import { PostCardBody, PostLead, toPostCardView } from "../site/post-card";
import { PostSlider } from "../site/post-slider";
import { CtaLink, SectionHeading } from "../site/primitives";
import { ClientTabs } from "./client-tabs";
import { ServicesShowcase } from "./services-showcase";
import { SectionShell, type SectionProps } from "./shell";

type LinkV = { label?: L; href?: string };

// ───────────────────────── Services ─────────────────────────
type ServicesData = { eyebrow?: L; title?: L; text?: L; layout?: string; categoryId?: string | null; onlyFeatured?: boolean; cta?: LinkV };

export async function ServicesSection({ data, settings, ctx }: SectionProps<ServicesData>) {
  const { locale } = ctx;
  const dict = getSiteDictionary(locale);
  const [all, categories] = await Promise.all([getServices(), getServiceCategories()]);
  const services = all.filter((s) => (!data.categoryId || s.category?.id === data.categoryId) && (!data.onlyFeatured || s.featured) && tr(s.title, locale));
  if (!services.length) return null;
  const href = (slug: string) => localizeHref(locale, `/services/${slug}`);
  const layout = data.layout ?? "showcase";
  const numberOf = (id: string) => String(all.findIndex((s) => s.id === id) + 1).padStart(2, "0");

  const header = (
    <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
      <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
      {data.cta?.href && <div className="shrink-0" data-reveal><CtaLink value={data.cta} locale={locale} variant="outline" /></div>}
    </div>
  );

  if (layout === "showcase") {
    return (
      <SectionShell settings={settings}>
        <div className="container-qe">
          {header}
          <ServicesShowcase
            exploreLabel={dict.exploreService}
            services={services.map((s) => ({
              id: s.id,
              title: tr(s.title, locale),
              summary: tr(s.summary, locale) || tr(s.description, locale),
              icon: s.icon,
              href: href(s.slug),
              category: s.category ? tr(s.category.name, locale, true) : "",
              highlights: [
                ...s.steps.map((st) => tr(st.title, locale)),
                ...s.capabilities.flatMap((g) => g.items.map((i) => tr(i, locale))),
              ].filter(Boolean).slice(0, 6),
            }))}
          />
        </div>
      </SectionShell>
    );
  }

  if (layout === "compact") {
    return (
      <SectionShell settings={settings}>
        <div className="container-qe">
          {header}
          <ul className="mt-12 grid gap-x-10 border-t border-line sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.id} className="border-b border-line">
                <Link href={href(s.slug)} className="group flex items-center gap-4 py-5">
                  <Icon name={s.icon} className="size-5 text-tech-600" />
                  <span className="heading flex-1 text-lg text-ink group-hover:text-tech-600">{tr(s.title, locale)}</span>
                  <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </SectionShell>
    );
  }

  // Grouped grid
  const groups = categories
    .map((c) => ({ id: c.id, name: tr(c.name, locale, true), services: services.filter((s) => s.category?.id === c.id) }))
    .filter((g) => g.services.length);
  const loose = services.filter((s) => !s.category);
  if (loose.length) groups.push({ id: "other", name: dict.services, services: loose });

  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        {(data.eyebrow || data.title || data.text) && <div className="mb-10 lg:mb-16">{header}</div>}
        <div className="space-y-10 lg:space-y-20">
          {groups.map((g) => (
            <div key={g.id} className="grid gap-5 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-3">
                <h2 className="heading border-t-2 border-tech pt-5 text-lg text-ink lg:sticky lg:top-28" data-reveal>{g.name}</h2>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:col-span-9">
                {g.services.map((s, i) => (
                  <li key={s.id} data-reveal style={{ "--reveal-delay": `${(i % 2) * 80}ms` } as React.CSSProperties}>
                    <Link href={href(s.slug)} className="group relative grid h-full grid-cols-[auto_1fr] gap-x-4 overflow-hidden border border-line bg-white p-5 transition-[border-color,box-shadow] duration-500 hover:border-tech/60 hover:shadow-lift sm:flex sm:flex-col sm:p-8">
                      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-tech-600 transition-transform duration-500 group-hover:scale-x-100 rtl:origin-right" aria-hidden />
                      <div className="row-span-3 flex items-start justify-between">
                        <span className="grid size-11 place-items-center rounded-sm bg-sky-50 text-tech-600 transition-colors duration-500 group-hover:bg-navy group-hover:text-sky sm:size-14">
                          <Icon name={s.icon} className="size-5 sm:size-7" strokeWidth={1.6} />
                        </span>
                        <span className="hidden font-mono text-sm text-mist sm:inline" dir="ltr">{numberOf(s.id)}</span>
                      </div>
                      <h3 className="heading t-sub text-ink sm:mt-7">{tr(s.title, locale)}</h3>
                      <p className="mt-1.5 flex-1 text-[0.95rem] leading-relaxed text-body sm:mt-3 sm:text-base">{tr(s.summary, locale)}</p>
                      <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-tech-600 sm:mt-7">
                        {dict.exploreService}
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Clients ─────────────────────────
export async function ClientsSection({ data, settings, ctx }: SectionProps<{ eyebrow?: L; title?: L; text?: L; layout?: string }>) {
  const { locale } = ctx;
  const groups = await getClientGroups();
  if (!groups.length) return null;
  const views = await Promise.all(
    groups.map(async (g) => ({
      id: g.id,
      name: tr(g.name, locale, true),
      clients: await Promise.all(
        g.clients.map(async (c) => {
          const logo = await getMedia(c.logoId);
          return { id: c.id, name: tr(c.name, locale, true), url: c.url, logo: logo && !logo.isVideo ? { url: logo.url, width: logo.width ?? 300, height: logo.height ?? 150 } : null };
        }),
      ),
    })),
  );
  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} className="mb-8 lg:mb-12" />
        <div data-reveal>
          <ClientTabs groups={views} layout={data.layout === "wall" ? "wall" : "tabs"} />
        </div>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Testimonials ─────────────────────────
export async function TestimonialsSection({ data, settings, ctx }: SectionProps<{ eyebrow?: L; title?: L }>) {
  const { locale } = ctx;
  const items = (await getTestimonials()).filter((t) => tr(t.quote, locale));
  if (!items.length) return null;
  const photos = await Promise.all(items.map((t) => getMedia(t.photoId)));
  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} locale={locale} />
        <ul className={cn("mt-9 lg:mt-14 grid gap-6", items.length > 1 && "md:grid-cols-2", items.length > 2 && "lg:grid-cols-3")}>
          {items.map((t, i) => (
            <li key={t.id} data-reveal style={{ "--reveal-delay": `${(i % 3) * 80}ms` } as React.CSSProperties}>
              <figure className="flex h-full flex-col border border-line bg-white p-8">
                <span className="display t-page text-tech/40" aria-hidden>“</span>
                <blockquote className="mt-2 flex-1 text-lg leading-relaxed text-ink">{tr(t.quote, locale)}</blockquote>
                <figcaption className="mt-8 flex items-center gap-4 border-t border-line pt-6">
                  {photos[i] && <MediaImage asset={photos[i]} locale={locale} sizes="48px" className="size-12 rounded-full object-cover" />}
                  <span>
                    <span className="block font-semibold text-ink">{tr(t.author, locale, true)}</span>
                    <span className="block text-sm text-muted">{[tr(t.position, locale, true), tr(t.company, locale, true)].filter(Boolean).join(" · ")}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Latest insights ─────────────────────────
export async function LatestPostsSection({ data, settings, ctx }: SectionProps<{ eyebrow?: L; title?: L; text?: L; limit?: number; layout?: string; cta?: LinkV }>) {
  const { locale } = ctx;
  const posts = await latestPosts(locale, Math.min(Math.max(Number(data.limit) || 6, 1), 12));
  // Hidden automatically until the first article is published.
  if (!posts.length) return null;
  const dict = getSiteDictionary(locale);
  const views = await Promise.all(posts.map((p) => toPostCardView(p, locale)));
  const slider = (data.layout ?? "slider") === "slider" && views.length > 1;
  return (
    <SectionShell settings={settings} className="overflow-hidden">
      <div className="container-qe">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
          {data.cta?.href && <div className="shrink-0" data-reveal><CtaLink value={data.cta} locale={locale} variant="outline" /></div>}
        </div>
        <div className="mt-9 lg:mt-14" data-reveal>
          {slider ? (
            <PostSlider posts={views} locale={locale} labels={{ previous: dict.previous, next: dict.next, read: dict.readArticle }} />
          ) : (
            <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {views.map((p) => <PostCardBody key={p.id} post={p} locale={locale} readLabel={dict.readArticle} />)}
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Insights listing ─────────────────────────
export async function PostListingSection({ data, settings, ctx }: SectionProps<{ pageSize?: number; showSearch?: boolean; showCategories?: boolean }>) {
  const { locale, searchParams, path } = ctx;
  const dict = getSiteDictionary(locale);
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(searchParams.q).slice(0, 100);
  const category = one(searchParams.category).slice(0, 80);
  const page = Math.max(1, Math.min(500, Number(one(searchParams.page)) || 1));
  const [result, categories] = await Promise.all([listPosts({ locale, q, category: category || undefined, page, pageSize: Number(data.pageSize) || 9 }), data.showCategories ? getBlogCategories() : Promise.resolve([])]);
  const base = `/${locale}${path}`;
  const filtered = !!(q || category);
  const views = await Promise.all(result.posts.map((p) => toPostCardView(p, locale)));
  // The newest article leads the first, unfiltered page.
  const lead = !filtered && page === 1 && views.length > 2 ? views[0] : null;
  const rest = lead ? views.slice(1) : views;
  const qs = (params: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, String(v));
    const s = sp.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        {(data.showSearch || categories.length > 0) && (
          <div className="mb-9 lg:mb-14 flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-center lg:justify-between">
            {categories.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                <li><Link href={qs({ q })} className={cn("inline-block rounded-full border px-4 py-2 text-sm font-semibold", !category ? "border-navy bg-navy text-white" : "border-line-strong text-ink hover:border-navy")}>{dict.allCategories}</Link></li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={qs({ q, category: c.slug })} className={cn("inline-block rounded-full border px-4 py-2 text-sm font-semibold", category === c.slug ? "border-navy bg-navy text-white" : "border-line-strong text-ink hover:border-navy")}>{tr(c.name, locale, true)}</Link>
                  </li>
                ))}
              </ul>
            )}
            {data.showSearch && (
              <form action={base} method="get" role="search" className="relative w-full lg:max-w-sm">
                {category && <input type="hidden" name="category" value={category} />}
                <label htmlFor="post-search" className="sr-only">{dict.search}</label>
                <input id="post-search" name="q" type="search" defaultValue={q} placeholder={dict.searchPlaceholder} maxLength={100} className="h-12 w-full border border-line-strong bg-white ps-11 pe-4 text-ink placeholder:text-muted focus:border-tech focus:outline-none" />
                <Search className="pointer-events-none absolute top-1/2 start-4 size-4 -translate-y-1/2 text-muted" aria-hidden />
              </form>
            )}
          </div>
        )}

        {result.posts.length === 0 ? (
          filtered ? (
            <p className="py-16 text-center text-lg text-muted">{dict.noResults}</p>
          ) : (
            <div className="relative overflow-hidden border border-line bg-surface px-8 py-16 text-center sm:px-16" data-reveal>
              <div className="mx-auto mb-8 w-40 opacity-80"><BrandMotif variant="network" /></div>
              <h2 className="display t-title text-ink">{dict.noPostsTitle}</h2>
              <p className="lede mx-auto mt-4 max-w-xl">{dict.noPostsText}</p>
              <Link href={`/${locale}/services`} className="btn btn-outline mt-8">{dict.exploreServices}</Link>
            </div>
          )
        ) : (
          <>
            {lead && <PostLead post={lead} locale={locale} readLabel={dict.readArticle} label={dict.featuredArticle} />}
            {rest.length > 0 && (
              <div className={cn("grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3", lead && "mt-10 lg:mt-16")}>
                {rest.map((p) => <PostCardBody key={p.id} post={p} locale={locale} readLabel={dict.readArticle} />)}
              </div>
            )}
          </>
        )}

        {result.pages > 1 && (
          <nav className="mt-10 lg:mt-16 flex items-center justify-between border-t border-line pt-8" aria-label={dict.page}>
            {page > 1 ? <Link href={qs({ q, category, page: page - 1 })} className="btn btn-outline" rel="prev">{dict.previous}</Link> : <span />}
            <span className="text-sm text-muted">{dict.page} {page} {dict.of} {result.pages}</span>
            {page < result.pages ? <Link href={qs({ q, category, page: page + 1 })} className="btn btn-outline" rel="next">{dict.next}</Link> : <span />}
          </nav>
        )}
      </div>
    </SectionShell>
  );
}
