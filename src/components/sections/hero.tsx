import { tr, type L } from "@/lib/i18n/localized";
import { getStats } from "@/lib/content/collections";
import { getMedia } from "@/lib/media";
import { cn } from "@/lib/cn";
import { CountUp } from "../site/count-up";
import { Icon } from "@/lib/icons";
import { MediaImage } from "../site/media-image";
import { NetworkGlobe } from "../site/network-globe";
import { CtaLink } from "../site/primitives";
import { Breadcrumbs } from "../site/breadcrumbs";
import { HeroVideo } from "./hero-video";
import { SectionShell, type SectionProps } from "./shell";

type LinkV = { label?: L; href?: string };
type HeroData = { variant?: string; eyebrow?: L; title?: L; titleAccent?: L; text?: L; primaryCta?: LinkV; secondaryCta?: LinkV; image?: string | null; video?: string | null; showStats?: boolean };

export async function HeroSection({ data, settings, ctx }: SectionProps<HeroData>) {
  const { locale } = ctx;
  const variant = data.variant ?? "network";
  const [stats, image, video] = await Promise.all([data.showStats ? getStats() : Promise.resolve([]), getMedia(data.image), getMedia(data.video)]);
  const title = tr(data.title, locale);
  const accent = tr(data.titleAccent, locale);
  const eyebrow = tr(data.eyebrow, locale);
  const text = tr(data.text, locale);
  const HeadingTag = ctx.index === 0 ? "h1" : "h2";

  const copy = (
    <div className={cn("relative z-10", variant === "minimal" ? "mx-auto max-w-4xl text-center" : "max-w-3xl")}>
      {eyebrow && <p className={cn("eyebrow mb-7 animate-fade-up", variant === "minimal" && "justify-center")}>{eyebrow}</p>}
      <HeadingTag className="display t-hero text-white animate-fade-up [animation-delay:80ms]">
        {title}
        {accent && (
          <>
            {" "}
            <span className="block text-sky">{accent}</span>
          </>
        )}
      </HeadingTag>
      {text && <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/75 animate-fade-up [animation-delay:160ms] sm:text-xl">{text}</p>}
      <div className={cn("mt-10 flex flex-wrap gap-3 animate-fade-up [animation-delay:240ms]", variant === "minimal" && "justify-center")}>
        <CtaLink value={data.primaryCta} locale={locale} variant="primary" />
        <CtaLink value={data.secondaryCta} locale={locale} variant="outline-light" />
      </div>
    </div>
  );

  const statsBar = stats.length > 0 && (
    <div className="relative z-10 mt-12 sm:mt-16 lg:mt-20">
      <dl className={cn("grid overflow-hidden rounded-sm border border-white/10 bg-white/[0.04] shadow-[0_30px_60px_-40px_rgba(0,0,0,0.6)] backdrop-blur-md", stats.length >= 3 ? "grid-cols-3" : "grid-cols-2")}>
        {stats.slice(0, 4).map((s, i) => (
          <div
            key={s.id}
            className="group relative flex flex-col items-center gap-2.5 border-white/10 px-2 py-5 text-center transition-colors duration-500 not-first:border-s hover:bg-white/[0.05] sm:flex-row sm:gap-4 sm:px-6 sm:py-6 sm:text-start lg:px-8 animate-fade-up"
            style={{ animationDelay: `${320 + i * 90}ms` }}
          >
            <span className="absolute inset-x-6 top-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-sky to-transparent transition-transform duration-700 group-hover:scale-x-100" aria-hidden />
            <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-white/[0.07] text-sky ring-1 ring-white/10 transition-colors duration-500 group-hover:bg-tech-600 group-hover:text-white sm:size-12">
              <Icon name={s.icon || ["globe", "layers", "building", "award"][i]} className="size-4 sm:size-5" strokeWidth={1.75} />
            </span>
            <div className="flex min-w-0 flex-col-reverse">
              <dt className="mt-1 text-xs leading-snug text-white/65 sm:text-sm">{tr(s.label, locale, true)}</dt>
              <dd className="display text-gradient-sky text-[1.65rem] leading-none sm:text-[2.2rem] lg:text-[2.6rem] rtl:font-[family-name:var(--font-cairo)]">
                <span dir="ltr"><CountUp value={s.value} /></span>
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <SectionShell settings={{ ...settings, theme: "navy" }} bare className="overflow-hidden">
      <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="pointer-events-none absolute -top-40 end-[-10%] size-[46rem] rounded-full bg-tech/25 blur-[140px]" />

      {variant === "video" && video && <HeroVideo src={video.url} poster={image?.url} />}
      {variant === "image" && image && (
        <div className="absolute inset-y-0 end-0 hidden w-[44%] lg:block">
          <MediaImage asset={image} locale={locale} fill priority sizes="44vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/30 to-transparent rtl:bg-gradient-to-l" />
        </div>
      )}
      {variant === "network" && (
        <div className="pointer-events-none absolute inset-y-0 end-0 w-full opacity-40 sm:opacity-60 lg:w-[58%] lg:opacity-100">
          <NetworkGlobe className="size-full" mirrored={locale === "ar"} />
        </div>
      )}

      <div className={cn("container-qe relative flex min-h-[92svh] flex-col justify-end pt-36 pb-10 lg:pb-14", variant === "minimal" && "min-h-[70svh] justify-center")}>
        {ctx.index === 0 && ctx.path !== "/" && ctx.path !== "" && <Breadcrumbs locale={locale} items={[{ label: ctx.pageTitle }]} />}
        <div className="flex flex-1 items-center">{copy}</div>
        {statsBar}
      </div>
    </SectionShell>
  );
}

type HeaderData = { eyebrow?: L; title?: L; text?: L; showBreadcrumbs?: boolean; image?: string | null };

export async function PageHeaderSection({ data, settings, ctx }: SectionProps<HeaderData>) {
  const { locale } = ctx;
  const image = await getMedia(data.image);
  const Tag = ctx.index === 0 ? "h1" : "h2";
  const title = tr(data.title, locale) || ctx.pageTitle;
  return (
    <SectionShell settings={{ ...settings, theme: "navy" }} bare className="overflow-hidden">
      {image && (
        <>
          <MediaImage asset={image} locale={locale} fill priority sizes="100vw" className="object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/50" />
        </>
      )}
      <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="pointer-events-none absolute -bottom-48 end-[-8%] size-[34rem] rounded-full bg-tech/25 blur-[120px]" />
      <svg className="pointer-events-none absolute end-6 bottom-10 hidden w-48 text-sky/40 lg:block" viewBox="0 0 200 120" aria-hidden="true">
        {[[0, 40, 18], [30, 10, 12], [60, 50, 22], [100, 20, 10], [120, 70, 16], [160, 35, 12], [90, 90, 8]].map(([x, y, s], i) => (
          <rect key={i} x={x} y={y} width={s} height={s} fill="currentColor" opacity={0.35 + (i % 3) * 0.2} />
        ))}
      </svg>
      <div className="container-qe relative pt-36 pb-16 lg:pt-44 lg:pb-24">
        {data.showBreadcrumbs !== false && ctx.path !== "/" && <Breadcrumbs locale={locale} items={[{ label: ctx.pageTitle }]} />}
        <div className="max-w-4xl">
          {tr(data.eyebrow, locale) && <p className="eyebrow mb-6 animate-fade-up">{tr(data.eyebrow, locale)}</p>}
          <Tag className="display t-page text-white animate-fade-up [animation-delay:60ms]">{title}</Tag>
          {tr(data.text, locale) && <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/75 animate-fade-up [animation-delay:120ms] sm:text-xl">{tr(data.text, locale)}</p>}
        </div>
      </div>
    </SectionShell>
  );
}
