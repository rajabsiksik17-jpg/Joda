import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { MediaAsset } from "@/lib/media";
import { cn } from "@/lib/cn";
import { BrandMotif } from "./brand-motif";
import { MediaImage } from "./media-image";

/** Plain, serializable card data — usable by server sections and the client slider alike. */
export type PostCardView = { id: string; href: string; title: string; excerpt: string; category: string; date: string; dateIso: string; cover: MediaAsset | null };

export function PostCardBody({ post, locale, readLabel, className, reveal = true }: { post: PostCardView; locale: Locale; readLabel: string; className?: string; reveal?: boolean }) {
  return (
    <article className={cn("group flex h-full flex-col", className)} data-reveal={reveal ? "" : undefined}>
      <Link href={post.href} className="relative block aspect-[16/10] overflow-hidden bg-navy" tabIndex={-1} aria-hidden>
        {post.cover ? (
          <MediaImage asset={post.cover} locale={locale} fill sizes="(min-width:1024px) 30vw, (min-width:640px) 50vw, 90vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-10 opacity-70"><BrandMotif variant="network" dark className="w-2/3" /></div>
        )}
        {post.category && <span className="absolute start-4 top-4 bg-white/95 px-3 py-1 text-xs font-semibold text-navy">{post.category}</span>}
      </Link>
      <div className="flex flex-1 flex-col pt-6">
        <time dateTime={post.dateIso} className="text-sm text-muted">{post.date}</time>
        <h3 className="heading mt-2 t-card leading-snug text-ink">
          <Link href={post.href} className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px] rtl:bg-[position:100%_100%]">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-3 line-clamp-3 leading-relaxed text-body">{post.excerpt}</p>}
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-tech-600" aria-hidden>
          {readLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
        </span>
      </div>
    </article>
  );
}

/** Wide lead card for the newest/featured article. */
export function PostLead({ post, locale, readLabel, label }: { post: PostCardView; locale: Locale; readLabel: string; label: string }) {
  return (
    <article className="group grid overflow-hidden border border-line bg-white shadow-soft lg:grid-cols-12" data-reveal>
      <Link href={post.href} className="relative block aspect-[16/10] overflow-hidden bg-navy lg:col-span-7 lg:aspect-auto lg:min-h-[26rem]" tabIndex={-1} aria-hidden>
        {post.cover ? (
          <MediaImage asset={post.cover} locale={locale} fill priority sizes="(min-width:1024px) 55vw, 100vw" className="object-cover transition-transform duration-1000 group-hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-12 opacity-75"><BrandMotif variant="network" dark className="w-1/2" /></div>
        )}
      </Link>
      <div className="relative flex flex-col justify-center gap-5 p-8 lg:col-span-5 lg:p-12">
        <span className="absolute start-0 top-0 h-1 w-24 bg-tech-600" aria-hidden />
        <p className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold tracking-wide text-tech-600 uppercase rtl:tracking-normal">{label}</span>
          {post.category && <span className="text-muted">· {post.category}</span>}
        </p>
        <h2 className="display t-title text-ink">
          <Link href={post.href} className="hover:text-tech-600">{post.title}</Link>
        </h2>
        {post.excerpt && <p className="line-clamp-4 leading-relaxed text-body">{post.excerpt}</p>}
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-line pt-5">
          <time dateTime={post.dateIso} className="text-sm text-muted">{post.date}</time>
          <Link href={post.href} className="inline-flex items-center gap-2 text-sm font-semibold text-tech-600">
            {readLabel}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
