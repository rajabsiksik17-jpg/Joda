import { ArrowUpRight, MapPin } from "lucide-react";
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

// ───────────────────────── Statistics ─────────────────────────
type StatsData = { eyebrow?: L; title?: L; text?: L; layout?: string; markets?: { name?: L }[] };

export async function StatsSection({ data, settings, ctx }: SectionProps<StatsData>) {
  const { locale } = ctx;
  const stats = await getStats();
  const markets = (data.markets ?? []).map((m) => tr(m.name, locale)).filter(Boolean);
  if (!stats.length && !markets.length) return null;
  const dict = getSiteDictionary(locale);
  const dark = settings.theme === "navy";

  if (data.layout === "band") {
    return (
      <SectionShell settings={settings} className="border-y border-line">
        <div className="container-qe grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
          </div>
          <dl className="grid grid-cols-3 gap-6 lg:col-span-7">
            {stats.map((s) => (
              <div key={s.id} className="flex flex-col-reverse border-s border-line ps-5" data-reveal>
                <dt className="mt-2 text-sm text-muted sm:text-base">{tr(s.label, locale, true)}</dt>
                <dd className="display t-page text-navy rtl:font-[family-name:var(--font-cairo)]"><CountUp value={s.value} /></dd>
              </div>
            ))}
          </dl>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell settings={settings}>
      <div className="container-qe grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
          {markets.length > 0 && (
            <div className="mt-10" data-reveal>
              <p className={cn("mb-4 text-sm font-semibold", dark ? "text-white" : "text-ink")}>{dict.markets}</p>
              <ul className="flex flex-wrap gap-2">
                {markets.map((m) => (
                  <li key={m} className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium", dark ? "border-white/20 text-white" : "border-line-strong text-ink")}>
                    <MapPin className="size-3.5 text-tech-600" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <dl className="grid gap-5 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-1 xl:grid-cols-3 xl:self-end">
          {stats.map((s, i) => (
            <div
              key={s.id}
              className={cn("relative flex flex-col-reverse justify-between overflow-hidden p-7 hover-lift xl:min-h-64", i === 0 ? "bg-navy text-white" : i === 1 ? "bg-tech-600 text-white" : dark ? "bg-white/10 text-white" : "bg-surface text-ink")}
              data-reveal
              style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
            >
              <dt className={cn("mt-4 text-base font-medium", i < 2 ? "text-white/80" : dark ? "text-white/75" : "text-body")}>{tr(s.label, locale, true)}</dt>
              <dd className={cn("display t-stat rtl:font-[family-name:var(--font-cairo)]", i < 2 || dark ? "text-white" : "text-navy")}>
                <CountUp value={s.value} />
              </dd>
              <span className="pointer-events-none absolute top-5 end-5 grid grid-cols-3 gap-1 opacity-40" aria-hidden>
                {Array.from({ length: 6 }, (_, k) => <span key={k} className={cn("size-1.5", k % 2 ? "bg-sky" : "bg-white/70")} />)}
              </span>
            </div>
          ))}
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
    <div className="mb-12 max-w-3xl" data-reveal>
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
      <div className="container-qe grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
        <div className="relative mx-auto w-full max-w-md lg:col-span-5" data-reveal="clip">
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
          <span className="display block h-14 text-[7rem] leading-none text-tech/30 select-none" aria-hidden>“</span>
          <blockquote className={cn("space-y-5 text-lg leading-[1.9] sm:text-xl", dark ? "text-white/85" : "text-ink/85")}>
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
        <div className="mt-14">
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

  return (
    <SectionShell settings={settings}>
      <div className="container-qe">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} text={data.text} locale={locale} />
        {featured && (
          <div className="mt-14 grid overflow-hidden border border-line bg-white shadow-soft lg:grid-cols-12" data-reveal>
            <div className={cn("relative flex items-center justify-center p-10 lg:col-span-5 lg:p-14", TONE[featured.logoTone as keyof typeof TONE] ?? TONE.light)}>
              <div className="absolute start-0 top-0 h-full w-1 bg-tech-600" aria-hidden />
              {logos[featuredIdx] ? (
                <MediaImage asset={logos[featuredIdx]} locale={locale} alt={tr(featured.name, locale, true)} sizes="(min-width:1024px) 30vw, 80vw" className="h-auto max-h-28 w-auto max-w-full object-contain" />
              ) : (
                <span className="display t-sub text-ink">{tr(featured.name, locale, true)}</span>
              )}
            </div>
            <div className="flex flex-col justify-center gap-5 p-8 lg:col-span-7 lg:p-14">
              <p className="text-xs font-semibold tracking-[0.16em] text-tech-600 uppercase rtl:text-sm rtl:tracking-normal">{dict.strategicPartner}</p>
              <h3 className="heading text-2xl text-ink">{tr(featured.name, locale, true)}</h3>
              <p className="lede">{tr(featured.description, locale)}</p>
              {featured.url && (
                <a href={featured.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-tech-600 hover:text-tech-700">
                  {dict.visitWebsite}
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              )}
            </div>
          </div>
        )}
        {others.length > 0 && (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {others.map((p) => {
              const idx = partners.indexOf(p);
              const content = logos[idx] ? (
                <MediaImage asset={logos[idx]} locale={locale} alt={tr(p.name, locale, true)} sizes="240px" className="h-auto max-h-20 w-auto max-w-[80%] object-contain" />
              ) : (
                <span className="heading text-lg text-ink">{tr(p.name, locale, true)}</span>
              );
              return (
                <li key={p.id} data-reveal>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className={cn("flex h-36 items-center justify-center border border-line p-6 hover-lift", TONE[p.logoTone as keyof typeof TONE] ?? TONE.light)} aria-label={tr(p.name, locale, true)}>{content}</a>
                  ) : (
                    <div className={cn("flex h-36 items-center justify-center border border-line p-6", TONE[p.logoTone as keyof typeof TONE] ?? TONE.light)}>{content}</div>
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
