"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, Mail, Phone, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { MediaAsset } from "@/lib/media";
import { SocialIcon } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { MediaImage } from "../site/media-image";

export type TeamPerson = {
  id: string;
  name: string;
  position: string;
  department: string;
  bio: string;
  fullBio: string;
  message: string;
  expertise: string[];
  photo: MediaAsset | null;
  isLeadership: boolean;
  links: { platform: string; url: string }[];
  email: string | null;
  phone: string | null;
};

export type TeamLabels = { viewProfile: string; close: string; expertise: string; email: string; phone: string; leadership: string };

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
const paragraphs = (t: string) => t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
const hasProfile = (p: TeamPerson) => !!(p.fullBio || p.bio || p.message || p.expertise.length || p.links.length || p.email || p.phone);

/** Team cards; each card opens a profile in a native modal dialog (focus trap, Esc, backdrop click). */
export function TeamDirectory({ people, locale, labels, layout = "grid", dark = false }: { people: TeamPerson[]; locale: Locale; labels: TeamLabels; layout?: string; dark?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<TeamPerson | null>(null);

  const open = (p: TeamPerson) => {
    setCurrent(p);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  // A single person reads better as a wide feature than as a lonely card.
  const solo = people.length === 1;
  const spotlight = !solo && layout === "spotlight" ? people[0] : null;
  const rest = spotlight ? people.slice(1) : people;

  return (
    <>
      {solo ? (
        <SoloCard person={people[0]} locale={locale} labels={labels} onOpen={open} dark={dark} />
      ) : (
        <>
          {spotlight && <SoloCard person={spotlight} locale={locale} labels={labels} onOpen={open} dark={dark} />}
          <ul className={cn("grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", spotlight && "mt-12")}>
            {rest.map((p, i) => (
              <li key={p.id} data-reveal style={{ "--reveal-delay": `${(i % 4) * 80}ms` } as React.CSSProperties}>
                <PersonCard person={p} locale={locale} labels={labels} onOpen={open} dark={dark} />
              </li>
            ))}
          </ul>
        </>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="team-profile-name"
        onClose={() => setCurrent(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="profile-dialog"
      >
        {current && <Profile person={current} locale={locale} labels={labels} onClose={close} />}
      </dialog>
    </>
  );
}

function Portrait({ person, locale, sizes, className }: { person: TeamPerson; locale: Locale; sizes: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-b from-surface to-surface-2", className)}>
      {person.photo ? (
        <MediaImage asset={person.photo} locale={locale} alt={person.name} fill sizes={sizes} className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
      ) : (
        <span className="absolute inset-0 grid place-items-center">
          <span className="display relative text-5xl text-navy/25" aria-hidden>{initials(person.name)}</span>
        </span>
      )}
    </div>
  );
}

function PersonCard({ person, locale, labels, onOpen, dark }: { person: TeamPerson; locale: Locale; labels: TeamLabels; onOpen: (p: TeamPerson) => void; dark: boolean }) {
  const interactive = hasProfile(person);
  const body = (
    <>
      <div className="relative">
        <Portrait person={person} locale={locale} sizes="(min-width:1280px) 22vw, (min-width:640px) 45vw, 90vw" className="aspect-[4/5]" />
        <span className="absolute bottom-0 h-1 w-0 bg-tech-600 transition-[width] duration-500 group-hover:w-full group-focus-visible:w-full ltr:left-0 rtl:right-0" aria-hidden />
        {interactive && (
          <span className="absolute end-3 bottom-4 grid size-10 translate-y-2 place-items-center rounded-full bg-white text-navy opacity-0 shadow-lift transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100" aria-hidden>
            <ArrowUpRight className="size-4 rtl:-scale-x-100" />
          </span>
        )}
      </div>
      <span className={cn("heading mt-5 block text-lg", dark ? "text-white" : "text-ink")}>{person.name}</span>
      <span className={cn("mt-0.5 block", dark ? "text-white/70" : "text-muted")}>{person.position}</span>
      {person.department && <span className="mt-2 inline-block text-xs font-semibold tracking-wide text-tech-600 uppercase rtl:tracking-normal">{person.department}</span>}
    </>
  );
  if (!interactive) return <div className="group">{body}</div>;
  return (
    <button type="button" onClick={() => onOpen(person)} className="group block w-full text-start" aria-haspopup="dialog" aria-label={`${labels.viewProfile}: ${person.name}`}>
      {body}
    </button>
  );
}

function SoloCard({ person, locale, labels, onOpen, dark }: { person: TeamPerson; locale: Locale; labels: TeamLabels; onOpen: (p: TeamPerson) => void; dark: boolean }) {
  return (
    <div className={cn("group grid overflow-hidden border md:grid-cols-12", dark ? "border-white/15 bg-white/5" : "border-line bg-white shadow-soft")} data-reveal>
      <div className="md:col-span-5" data-reveal="clip">
        <Portrait person={person} locale={locale} sizes="(min-width:768px) 40vw, 100vw" className="aspect-[5/4] h-full sm:aspect-[4/5] md:aspect-auto md:min-h-96" />
      </div>
      <div className="flex flex-col justify-center gap-3 p-6 sm:gap-4 sm:p-8 md:col-span-7 lg:p-12">
        {person.department && <p className="eyebrow">{person.department}</p>}
        <h3 className={cn("display t-title", dark ? "text-white" : "text-ink")}>{person.name}</h3>
        <p className={dark ? "text-white/75" : "text-muted"}>
          {person.position}
        </p>
        {person.bio && <p className={cn("lede", dark && "text-white/80")}>{person.bio}</p>}
        {person.expertise.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {person.expertise.slice(0, 5).map((e) => (
              <li key={e} className={cn("rounded-full border px-3 py-1 text-sm", dark ? "border-white/20 text-white/85" : "border-line-strong text-ink")}>{e}</li>
            ))}
          </ul>
        )}
        {hasProfile(person) && (
          <button type="button" onClick={() => onOpen(person)} className={cn("btn mt-2 self-start", dark ? "btn-outline-light" : "btn-outline")} aria-haspopup="dialog">
            {labels.viewProfile}
            <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

function Profile({ person, locale, labels, onClose }: { person: TeamPerson; locale: Locale; labels: TeamLabels; onClose: () => void }) {
  const bio = person.fullBio || person.bio;
  return (
    <div className="profile-panel flex h-full flex-col overflow-y-auto overscroll-contain bg-white">
      <div className="relative shrink-0 bg-navy">
        <div className="grid-texture-dark absolute inset-0 opacity-60" aria-hidden />
        <div className="relative flex items-end gap-5 px-6 pt-16 pb-7 sm:px-8">
          <Portrait person={person} locale={locale} sizes="160px" className="size-28 shrink-0 border-4 border-white/10 sm:size-32" />
          <div className="min-w-0 pb-1">
            <h2 id="team-profile-name" className="heading text-2xl leading-tight text-white">{person.name}</h2>
            <p className="mt-1 text-white/75">{person.position}</p>
            {person.department && <p className="mt-2 text-xs font-semibold tracking-wide text-sky uppercase rtl:tracking-normal">{person.department}</p>}
          </div>
        </div>
        <button type="button" onClick={onClose} autoFocus className="absolute end-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" aria-label={labels.close}>
          <X className="size-5" aria-hidden />
        </button>
        <span className="absolute bottom-0 h-1 w-1/3 bg-tech-600 ltr:left-0 rtl:right-0" aria-hidden />
      </div>

      <div className="flex-1 space-y-8 px-6 py-8 sm:px-8">
        {bio && (
          <div className="space-y-4 leading-[1.85] text-body">
            {paragraphs(bio).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {person.expertise.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">{labels.expertise}</h3>
            <ul className="flex flex-wrap gap-2">
              {person.expertise.map((e) => (
                <li key={e} className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-medium text-tech-600">{e}</li>
              ))}
            </ul>
          </div>
        )}

        {person.message && (
          <blockquote className="space-y-4 border-s-2 border-tech-600 ps-5 leading-[1.85] text-ink/85">
            {/* With a biography the message is a short excerpt; without one it is the main content. */}
            {(bio ? paragraphs(person.message).slice(0, 1) : paragraphs(person.message)).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </blockquote>
        )}

        {(person.email || person.phone || person.links.length > 0) && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
            {person.email && (
              <a href={`mailto:${person.email}`} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-tech-600 hover:text-tech-600" aria-label={`${labels.email}: ${person.email}`}>
                <Mail className="size-4" aria-hidden /> <span dir="ltr">{person.email}</span>
              </a>
            )}
            {person.phone && (
              <a href={`tel:${person.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-tech-600 hover:text-tech-600" aria-label={`${labels.phone}: ${person.phone}`}>
                <Phone className="size-4" aria-hidden /> <span dir="ltr">{person.phone}</span>
              </a>
            )}
            {person.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-full border border-line text-ink transition-colors hover:border-tech-600 hover:text-tech-600" aria-label={`${l.platform} — ${person.name}`}>
                <SocialIcon platform={l.platform} className="size-4" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
