import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { getPost, relatedPosts } from "@/lib/content/posts";
import { getMedia } from "@/lib/media";
import { readingMinutes } from "@/lib/sanitize";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { getSetting } from "@/lib/settings";
import { getBrandAssets } from "@/lib/content/brand";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { MediaImage } from "@/components/site/media-image";
import { PostCard, formatDate } from "@/components/site/post-card";
import { SocialIcon } from "@/lib/icons";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = await getPost(slug, locale);
  if (!post) return {};
  const [ar, en] = await Promise.all([getPost(slug, "ar"), getPost(slug, "en")]);
  return buildMetadata({
    locale,
    path: `/insights/${slug}`,
    title: tr(post.seo?.title, locale) || tr(post.title, locale),
    description: tr(post.seo?.description, locale) || tr(post.excerpt, locale),
    ogImageId: post.seo?.ogImageId ?? post.coverId,
    type: "article",
    publishedTime: post.publishedAt,
    availableLocales: [ar && "ar", en && "en"].filter(Boolean) as Locale[],
  });
}

export default async function InsightPage({ params }: { params: Params }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const post = await getPost(slug, locale);
  if (!post) notFound();
  const dict = getSiteDictionary(locale);
  const [cover, related, general, brand] = await Promise.all([getMedia(post.coverId), relatedPosts(post, locale), getSetting("general"), getBrandAssets()]);
  const content = tr(post.content, locale);
  const title = tr(post.title, locale);
  const url = absoluteUrl(`/${locale}/insights/${slug}`);
  const share = [
    { platform: "linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { platform: "x", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { platform: "whatsapp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  ];

  return (
    <article>
      <header className="theme-navy relative overflow-hidden">
        <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="container-qe relative max-w-5xl pt-36 pb-16 lg:pt-44 lg:pb-20">
          <Breadcrumbs locale={locale} items={[{ label: dict.insights, href: `/${locale}/insights` }, { label: title }]} />
          {post.category && <p className="eyebrow mb-6">{tr(post.category.name, locale, true)}</p>}
          <h1 className="display t-page text-white">{title}</h1>
          {tr(post.excerpt, locale) && <p className="mt-6 max-w-3xl text-xl leading-relaxed text-white/75">{tr(post.excerpt, locale)}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/60">
            {post.authorName && <span className="font-semibold text-white/85">{post.authorName}</span>}
            <time dateTime={post.publishedAt}>{dict.publishedOn} {formatDate(post.publishedAt, locale)}</time>
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden />{readingMinutes(content)} {dict.minRead}</span>
          </div>
        </div>
      </header>

      {cover && (
        <div className="container-qe relative -mb-4 max-w-6xl">
          <div className="relative -mt-2 aspect-[21/9] overflow-hidden bg-surface">
            <MediaImage asset={cover} locale={locale} fill priority sizes="(min-width:1280px) 1150px, 100vw" className="object-cover" />
          </div>
        </div>
      )}

      <div className="section-y">
        <div className="container-qe grid max-w-6xl gap-12 lg:grid-cols-12">
          <aside className="order-2 lg:order-1 lg:col-span-2">
            <div className="lg:sticky lg:top-28">
              <p className="mb-3 text-sm font-semibold text-ink">{dict.shareArticle}</p>
              <ul className="flex gap-2 lg:flex-col">
                {share.map((s) => (
                  <li key={s.platform}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-tech hover:bg-tech hover:text-white" aria-label={`${dict.shareArticle}: ${s.platform}`}>
                      <SocialIcon platform={s.platform} className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <div className="order-1 lg:order-2 lg:col-span-9">
            <div className="prose-qe text-[1.1rem]" dangerouslySetInnerHTML={{ __html: content }} />
            {post.tags.length > 0 && (
              <ul className="mt-12 flex flex-wrap gap-2 border-t border-line pt-8">
                {post.tags.map((t) => (
                  <li key={t}><Link href={`/${locale}/insights?q=${encodeURIComponent(t)}`} className="inline-block rounded-full bg-surface px-3.5 py-1.5 text-sm text-ink hover:bg-surface-2">#{t}</Link></li>
                ))}
              </ul>
            )}
            <Link href={`/${locale}/insights`} className="mt-12 inline-flex items-center gap-2 font-semibold text-tech-600 hover:text-tech-700">
              <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
              {dict.insights}
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="theme-muted section-y">
          <div className="container-qe">
            <h2 className="display t-title" data-reveal>{dict.relatedArticles}</h2>
            <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => <PostCard key={p.id} post={p} locale={locale} readLabel={dict.readArticle} />)}
            </div>
          </div>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: tr(post.excerpt, locale) || undefined,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          inLanguage: locale,
          mainEntityOfPage: url,
          image: cover ? absoluteUrl(cover.url) : absoluteUrl("/brand/og-default.jpg"),
          author: post.authorName ? { "@type": "Person", name: post.authorName } : { "@type": "Organization", name: tr(general.siteName, locale, true) },
          publisher: { "@type": "Organization", name: tr(general.siteName, locale, true), logo: { "@type": "ImageObject", url: absoluteUrl(brand.logoColor.url) } },
        }}
      />
    </article>
  );
}
