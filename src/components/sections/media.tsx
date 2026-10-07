import { tr, type L } from "@/lib/i18n/localized";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { getMedia } from "@/lib/media";
import { cn } from "@/lib/cn";
import { MediaImage } from "../site/media-image";
import { SectionHeading } from "../site/primitives";
import { toEmbedUrl } from "@/lib/video";
import { VideoPlayer } from "./video-player";
import { SectionShell, type SectionProps } from "./shell";

// ───────────────────────── Video ─────────────────────────
type VideoData = { eyebrow?: L; title?: L; text?: L; source?: string; video?: string | null; url?: string; poster?: string | null };

export async function VideoSection({ data, settings, ctx }: SectionProps<VideoData>) {
  const { locale } = ctx;
  const [video, poster] = await Promise.all([getMedia(data.video), getMedia(data.poster)]);
  const embed = data.source !== "upload" && data.url ? toEmbedUrl(data.url) : null;
  if (!embed && !(data.source === "upload" && video?.isVideo)) return null;
  const dict = getSiteDictionary(locale);
  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} className="mb-12" />
        <div data-reveal="scale">
          <VideoPlayer embedUrl={embed} fileUrl={video?.isVideo ? video.url : null} posterUrl={poster?.url ?? null} title={tr(data.title, locale) || dict.play} playLabel={dict.play} />
        </div>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Gallery ─────────────────────────
export async function GallerySection({ data, settings, ctx }: SectionProps<{ eyebrow?: L; title?: L; images?: { image?: string | null; caption?: L }[] }>) {
  const { locale } = ctx;
  const items = await Promise.all((data.images ?? []).map(async (i) => ({ asset: await getMedia(i.image), caption: tr(i.caption, locale) })));
  const images = items.filter((i) => i.asset && !i.asset.isVideo);
  if (!images.length) return null;
  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} locale={locale} className="mb-12" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li key={i} className={cn(i % 5 === 0 && "sm:col-span-2 lg:col-span-2")} data-reveal>
              <figure className="group">
                <div className={cn("relative overflow-hidden bg-surface", i % 5 === 0 ? "aspect-[16/9]" : "aspect-[4/3]")}>
                  <MediaImage asset={img.asset} locale={locale} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
                {img.caption && <figcaption className="mt-3 text-sm text-muted">{img.caption}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Logo cloud ─────────────────────────
export async function LogoCloudSection({ data, settings, ctx }: SectionProps<{ eyebrow?: L; title?: L; logos?: { image?: string | null; name?: L; url?: string }[] }>) {
  const { locale } = ctx;
  const logos = (await Promise.all((data.logos ?? []).map(async (l) => ({ asset: await getMedia(l.image), name: tr(l.name, locale, true), url: l.url })))).filter((l) => l.asset);
  if (!logos.length) return null;
  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} locale={locale} align="center" className="mb-12" />
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {logos.map((l, i) => {
            const img = <MediaImage asset={l.asset} locale={locale} alt={l.name} sizes="180px" className="h-12 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0" />;
            return <li key={i} data-reveal>{l.url && /^https?:\/\//.test(l.url) ? <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label={l.name}>{img}</a> : img}</li>;
          })}
        </ul>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Spacer ─────────────────────────
export function SpacerSection({ data, settings }: SectionProps<{ size?: string; line?: boolean }>) {
  const h = { sm: "h-8", md: "h-16", lg: "h-28" }[data.size ?? "md"] ?? "h-16";
  return (
    <SectionShell settings={settings} bare>
      <div className={cn("container-qe flex items-center", h)}>{data.line && <hr className="w-full border-line" />}</div>
    </SectionShell>
  );
}
