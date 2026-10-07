import { ArrowUpRight, Handshake, MapPin } from "lucide-react";
import { tr, type L } from "@/lib/i18n/localized";
import { getSiteDictionary } from "@/lib/i18n/site-dictionary";
import { getPartners, getStats, getTeam } from "@/lib/content/collections";
import { getMedia } from "@/lib/media";
import { cn } from "@/lib/cn";
import { CountUp } from "../site/count-up";
import { MediaImage } from "../site/media-image";
import { LeaderCarousel } from "../team/leader-carousel";
import { TeamDirectory, type TeamPerson } from "../team/team-directory";
import { Paragraphs, SectionHeading } from "../site/primitives";
import { SectionShell, type SectionProps } from "./shell";
import { Icon } from "@/lib/icons";

// ───────────────────────── Statistics ─────────────────────────
type StatsData = { eyebrow?: L; title?: L; text?: L; layout?: string; markets?: { name?: L }[] };

export async function StatsSection({ data, settings, ctx }: SectionProps<StatsData>) {
  const { locale } = ctx;
  const stats = await getStats();
  const markets = (data.markets ?? []).map((m) => tr(m.name, locale)).filter(Boolean);
  if (!stats.length && !markets.length) return null;
  const dict = getSiteDictionary(locale);
  const dark = settings.theme === "navy";

  const iconFor = (icon: string | null, i: number) => icon || ["globe", "layers", "building", "award"][i % 4];

  if (data.layout === "band") {
    return (
      <SectionShell settings={settings} className="border-y border-line">
        <div className="container-qe grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
          </div>
          <dl className={cn("grid grid-cols-3 overflow-hidden rounded-sm border lg:col-span-7", dark ? "border-white/10 bg-white/[0.04]" : "border-line bg-white shadow-soft")}>
            {stats.map((s, i) => (
              <div key={s.id} className={cn("group flex flex-col items-center gap-2 px-2 py-6 text-center not-first:border-s sm:items-start sm:px-6 sm:text-start", dark ? "border-white/10" : "border-line")} data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}>
                <span className="icon-tile-soft size-9 rounded-sm sm:size-11"><Icon name={iconFor(s.icon, i)} className="size-4 sm:size-5" /></span>
                <dt className={cn("order-3 text-xs leading-snug sm:text-sm", dark ? "text-white/65" : "text-muted")}>{tr(s.label, locale, true)}</dt>
                <dd className={cn("display order-2 text-[1.6rem] leading-none sm:text-[2.4rem] rtl:font-[family-name:var(--font-cairo)]", dark ? "text-gradient-sky" : "text-gradient-brand")}><span dir="ltr"><CountUp value={s.value} /></span></dd>
              </div>
            ))}
          </dl>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell settings={settings}>
      <div className="container-qe grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
          {markets.length > 0 && (
            <div className="mt-8 lg:mt-10" data-reveal>
              <p className={cn("mb-4 text-sm font-semibold", dark ? "text-white" : "text-ink")}>{dict.markets}</p>
              <ul className="flex flex-wrap gap-2">
                {markets.map((m) => (
                  <li key={m} className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors", dark ? "border-white/20 text-white hover:bg-white/10" : "border-line-strong bg-white text-ink hover:border-tech-600 hover:text-tech-600")}>
                    <MapPin className="size-3.5 text-tech-600" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <dl className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:col-span-7 lg:grid-cols-1 xl:grid-cols-3 xl:self-end">
          {stats.map((s, i) => {
            const lead = i === 0;
            return (
              <div
                key={s.id}
                className={cn(
                  "group relative flex flex-col overflow-hidden p-3.5 sm:p-7 lg:flex-row lg:items-center lg:gap-6 xl:flex-col xl:items-stretch xl:gap-0 xl:min-h-64",
                  lead ? "bg-navy text-white shadow-lift" : dark ? "card-premium !border-white/10 !bg-white/[0.04]" : "card-premium",
                )}
                data-reveal
                style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
              >
                {lead && (
                  <>
                    <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
                    <div className="pointer-events-none absolute -end-16 -top-16 size-48 rounded-full bg-tech-600/40 blur-3xl" aria-hidden />
                  </>
                )}
                <div className="relative flex items-center justify-between">
                  <span className={cn("size-9 rounded-sm sm:size-12", lead ? "grid place-items-center bg-white/10 text-sky ring-1 ring-white/15" : "icon-tile")}>
                    <Icon name={iconFor(s.icon, i)} className="size-4 sm:size-5" strokeWidth={1.75} />
                  </span>
                  <span className={cn("hidden font-mono text-xs sm:inline lg:hidden xl:inline", lead ? "text-white/40" : "text-mist")} dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="relative mt-4 flex flex-col-reverse sm:mt-8 lg:mt-0 xl:mt-auto xl:pt-10">
                  <dt className={cn("mt-1.5 text-xs leading-snug font-medium sm:mt-2 sm:text-base", lead ? "text-white/75" : dark ? "text-white/70" : "text-body")}>{tr(s.label, locale, true)}</dt>
                  <dd className={cn("display text-[1.55rem] leading-none sm:text-[2.6rem] xl:text-[3.25rem] rtl:font-[family-name:var(--font-cairo)]", lead || dark ? "text-gradient-sky" : "text-gradient-brand")}>
                    <span dir="ltr"><CountUp value={s.value} /></span>
                  </dd>
                </div>
                <span className={cn("relative mt-4 hidden h-px w-full sm:block lg:hidden xl:block", lead ? "bg-gradient-to-r from-sky/60 to-transparent rtl:bg-gradient-to-l" : "bg-gradient-to-r from-tech-600/40 to-transparent rtl:bg-gradient-to-l")} aria-hidden />
              </div>
            );
          })}
        </dl>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Leadership message ─────────────────────────
type LeaderData = { eyebrow?: L; title?: L; mode?: string; memberId?: string | null; message?: L };

export async function LeaderMessageSection({ data, settings, ctx }: SectionProps<LeaderData>) {
  const { locale } = ctx;
  const team = await getTeam();
  const dark = settings.theme === "navy";
  const dict = getSiteDictionary(locale);
  // Featured people first, then leadership, then everyone else with a message — in their configured order.
  const leaders = team
    .filter((m) => tr(m.message, locale))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.isLeadership) - Number(a.isLeadership));
  const mode = data.mode ?? "single";
  const heading = (tr(data.eyebrow, locale) || tr(data.title, locale)) && (
    <div className="mb-8 lg:mb-12 max-w-3xl" data-reveal>
      {tr(data.eyebrow, locale) && <p className="eyebrow mb-5">{tr(data.eyebrow, locale)}</p>}
      {tr(data.title, locale) && <h2 className="display t-section">{tr(data.title, locale)}</h2>}
    </div>
  );

  if (mode !== "single" && leaders.length > 1) {
    const photos = await Promise.all(leaders.map((m) => getMedia(m.photoId)));
    if (mode === "rotating") {
      return (
        <SectionShell settings={settings} className="overflow-hidden">
          <div className="container-qe">
            {heading}
            <LeaderCarousel
              slides={leaders.map((m, i) => ({ id: m.id, name: tr(m.name, locale, true), position: tr(m.position, locale, true), message: tr(m.message, locale), photo: photos[i] }))}
              locale={locale}
              labels={{ previous: dict.previousMessage, next: dict.nextMessage }}
              dark={dark}
            />
          </div>
        </SectionShell>
      );
    }
    return (
      <SectionShell settings={settings}>
        <div className="container-qe">
          {heading}
          <ul className={cn("grid gap-6", leaders.length === 2 ? "lg:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3")}>
            {leaders.map((m, i) => (
              <li key={m.id} data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}>
                <figure className={cn("flex h-full flex-col border p-8 lg:p-10", dark ? "border-white/15 bg-white/5" : "border-line bg-white")}>
                  <span className="display block h-10 text-[5rem] leading-none text-tech/30 select-none" aria-hidden>“</span>
                  <blockquote className={cn("flex-1 space-y-4 leading-[1.85]", dark ? "text-white/85" : "text-ink/85")}>
                    <Paragraphs text={tr(m.message, locale)} />
                  </blockquote>
                  <figcaption className={cn("mt-8 flex items-center gap-4 border-t pt-6", dark ? "border-white/15" : "border-line")}>
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-surface">
                      {photos[i] && <MediaImage asset={photos[i]} locale={locale} alt="" fill sizes="56px" className="object-cover object-top" />}
                    </span>
                    <span>
                      <span className={cn("heading block", dark ? "text-white" : "text-ink")}>{tr(m.name, locale, true)}</span>
                      <span className="block text-sm text-muted">{tr(m.position, locale, true)}</span>
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

  const member = team.find((m) => m.id === data.memberId) ?? leaders[0];
  if (!member) return null;
  const message = tr(data.message, locale) || tr(member.message, locale);
  if (!message) return null;
  const photo = await getMedia(member.photoId);
  const name = tr(member.name, locale, true);

  return (
    <SectionShell settings={settings} className="overflow-hidden">
      <div className="container-qe grid items-center gap-10 lg:grid-cols-12 lg:gap-20">
        <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-md lg:col-span-5" data-reveal="clip">
          <div className="absolute inset-x-0 bottom-0 h-[78%] bg-navy" aria-hidden>
            <div className="grid-texture-dark absolute inset-0 opacity-60" />
            <div className="absolute end-6 top-6 grid grid-cols-3 gap-1.5" aria-hidden>
              {Array.from({ length: 9 }, (_, k) => <span key={k} className={cn("size-2.5", k % 3 === 0 ? "bg-sky" : k % 2 ? "bg-tech-600" : "bg-white/20")} />)}
            </div>
          </div>
          <div className="absolute -bottom-4 h-2 w-1/2 bg-tech-600 ltr:left-0 rtl:right-0" aria-hidden />
          {photo ? (
            <MediaImage asset={photo} locale={locale} alt={name} sizes="(min-width:1024px) 32vw, 90vw" className="relative mx-auto h-auto w-[88%]" />
          ) : (
            <div className="relative aspect-[4/5]" />
          )}
        </div>
        <figure className="lg:col-span-7" data-reveal>
          {tr(data.eyebrow, locale) && <p className="eyebrow mb-6">{tr(data.eyebrow, locale)}</p>}
          {tr(data.title, locale) && <h2 className="display t-section mb-8">{tr(data.title, locale)}</h2>}
          <span className="display block h-10 text-[5rem] leading-none text-tech/30 select-none sm:h-14 sm:text-[7rem]" aria-hidden>“</span>
          <blockquote className={cn("space-y-4 text-[1.05rem] leading-[1.9] sm:space-y-5 sm:text-xl", dark ? "text-white/85" : "text-ink/85")}>
            <Paragraphs text={message} />
          </blockquote>
          <figcaption className="mt-10 flex items-center gap-5">
            <span className="h-px w-12 bg-tech-600" aria-hidden />
            <span>
              <span className={cn("heading block text-xl", dark ? "text-white" : "text-ink")}>{name}</span>
              <span className="mt-0.5 block text-muted">{tr(member.position, locale, true)}</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Team ─────────────────────────
export async function TeamSection({ data, settings, ctx }: SectionProps<{ eyebrow?: L; title?: L; text?: L; filter?: string; layout?: string }>) {
  const { locale } = ctx;
  const team = (await getTeam()).filter((m) => (data.filter === "leadership" ? m.isLeadership : data.filter === "team" ? !m.isLeadership : true));
  if (!team.length) return null;
  const photos = await Promise.all(team.map((m) => getMedia(m.photoId)));
  const dict = getSiteDictionary(locale);
  const people: TeamPerson[] = team.map((m, i) => ({
    id: m.id,
    name: tr(m.name, locale, true),
    position: tr(m.position, locale, true),
    department: tr(m.department, locale),
    bio: tr(m.bio, locale),
    fullBio: tr(m.fullBio, locale),
    message: tr(m.message, locale),
    expertise: m.expertise.map((e) => tr(e, locale)).filter(Boolean),
    photo: photos[i],
    isLeadership: m.isLeadership,
    links: [...(m.linkedinUrl ? [{ platform: "linkedin", url: m.linkedinUrl }] : []), ...m.socials],
    email: m.email,
    phone: m.phone,
  }));
  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
        <div className="mt-9 lg:mt-14">
          <TeamDirectory
            people={people}
            locale={locale}
            layout={data.layout}
            dark={settings.theme === "navy"}
            labels={{ viewProfile: dict.viewProfile, close: dict.close, expertise: dict.expertise, email: dict.email, phone: dict.phone, leadership: dict.leadership }}
          />
        </div>
      </div>
    </SectionShell>
  );
}

// ───────────────────────── Partners ─────────────────────────
const TONE = { light: "bg-white", muted: "bg-[#bfc4c8]", dark: "bg-navy" } as const;

export async function PartnersSection({ data, settings, ctx }: SectionProps<{ eyebrow?: L; title?: L; text?: L; onlyStrategic?: boolean }>) {
  const { locale } = ctx;
  const partners = (await getPartners()).filter((p) => (data.onlyStrategic ? p.isStrategic : true));
  if (!partners.length) return null;
  const logos = await Promise.all(partners.map((p) => getMedia(p.logoId)));
  const dict = getSiteDictionary(locale);
  const featured = partners.find((p) => p.isStrategic && tr(p.description, locale));
  const featuredIdx = featured ? partners.indexOf(featured) : -1;
  const others = partners.filter((p) => p !== featured);
  const tone = (t: string) => TONE[t as keyof typeof TONE] ?? TONE.light;

  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
        {featured && (
          <article className="card-premium group mt-9 grid lg:mt-14 lg:grid-cols-12" data-reveal>
            <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-surface via-white to-sky-50 p-8 sm:p-12 lg:col-span-5">
              <div className="grid-texture pointer-events-none absolute inset-0 opacity-60" aria-hidden />
              <div className="pointer-events-none absolute end-5 top-5 grid grid-cols-3 gap-1" aria-hidden>
                {Array.from({ length: 6 }, (_, k) => <span key={k} className={cn("size-2", k % 3 === 0 ? "bg-tech-600" : k % 2 ? "bg-sky/60" : "bg-navy/15")} />)}
              </div>
              <div className={cn("relative flex w-full max-w-sm items-center justify-center rounded-sm p-6 shadow-soft ring-1 ring-line transition-transform duration-700 group-hover:scale-[1.02] sm:p-8", tone(featured.logoTone))}>
                {logos[featuredIdx] ? (
                  <MediaImage asset={logos[featuredIdx]} locale={locale} alt={tr(featured.name, locale, true)} sizes="(min-width:1024px) 26vw, 80vw" className="h-auto max-h-24 w-auto max-w-full object-contain" />
                ) : (
                  <span className="display t-sub text-ink">{tr(featured.name, locale, true)}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 sm:p-10 lg:col-span-7 lg:p-12">
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-tech-600 ring-1 ring-tech-600/15">
                <Handshake className="size-3.5" aria-hidden />
                {dict.strategicPartner}
              </span>
              <h3 className="heading t-title text-ink">{tr(featured.name, locale, true)}</h3>
              <p className="lede">{tr(featured.description, locale)}</p>
              {featured.url && (
                <a href={featured.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-2 self-start !min-h-11">
                  {dict.visitWebsite}
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              )}
            </div>
          </article>
        )}
        {others.length > 0 && (
          <ul className={cn("grid gap-3 sm:gap-4", featured ? "mt-4 sm:mt-5" : "mt-9 lg:mt-14", others.length === 1 ? "grid-cols-1 sm:max-w-lg" : others.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
            {others.map((p, i) => {
              const idx = partners.indexOf(p);
              const desc = tr(p.description, locale);
              const inner = (
                <>
                  <span className={cn("flex h-20 w-32 shrink-0 items-center justify-center rounded-sm p-3 ring-1 ring-line sm:h-24 sm:w-40", tone(p.logoTone))}>
                    {logos[idx] ? (
                      <MediaImage asset={logos[idx]} locale={locale} alt="" sizes="160px" className="h-auto max-h-14 w-auto max-w-full object-contain sm:max-h-16" />
                    ) : (
                      <span className="text-center text-sm font-semibold text-ink">{tr(p.name, locale, true)}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="heading block t-card text-ink">{tr(p.name, locale, true)}</span>
                    {desc ? <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-body">{desc}</span> : <span className="mt-1 block text-sm text-muted">{dict.partner}</span>}
                  </span>
                  {p.url && <ArrowUpRight className="size-4 shrink-0 text-muted transition-colors group-hover:text-tech-600" aria-hidden />}
                </>
              );
              const cls = "card-premium group flex h-full items-center gap-4 p-4 sm:gap-5 sm:p-5";
              return (
                <li key={p.id} data-reveal style={{ "--reveal-delay": `${(i % 3) * 80}ms` } as React.CSSProperties}>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className={cls} aria-label={`${tr(p.name, locale, true)} — ${dict.visitWebsite}`}>{inner}</a>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SectionShell>
  );
}
