import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import type { PostCard as PostCardData } from "@/lib/content/posts";
import { getMedia } from "@/lib/media";
import { PostCardBody, type PostCardView } from "./post-card-view";

export { PostLead, PostCardBody, type PostCardView } from "./post-card-view";

export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

export async function toPostCardView(post: PostCardData, locale: Locale): Promise<PostCardView> {
  return {
    id: post.id,
    href: `/${locale}/insights/${post.slug}`,
    title: tr(post.title, locale),
    excerpt: tr(post.excerpt, locale),
    category: post.category ? tr(post.category.name, locale, true) : "",
    date: formatDate(post.publishedAt, locale),
    dateIso: post.publishedAt,
    cover: await getMedia(post.coverId),
  };
}

export async function PostCard({ post, locale, readLabel }: { post: PostCardData; locale: Locale; readLabel: string }) {
  return <PostCardBody post={await toPostCardView(post, locale)} locale={locale} readLabel={readLabel} />;
}

