"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { MediaAsset } from "@/lib/media";
import { cn } from "@/lib/cn";
import { MediaImage } from "../site/media-image";

export type LeaderSlide = { id: string; name: string; position: string; message: string; photo: MediaAsset | null };

const paragraphs = (t: string) => t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

/** Several leadership messages, one at a time. Manual navigation only — no auto-advance to keep long messages readable. */
export function LeaderCarousel({ slides, locale, labels, dark }: { slides: LeaderSlide[]; locale: Locale; labels: { previous: string; next: string }; dark: boolean }) {
  const [index, setIndex] = useState(0);
  const s = slides[index];
  const go = (n: number) => setIndex((n + slides.length) % slides.length);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20" aria-roledescription="carousel">
      <div className="relative mx-auto w-full max-w-md lg:col-span-5">
        <div className="absolute inset-x-0 bottom-0 h-[78%] bg-navy" aria-hidden>
          <div className="grid-texture-dark absolute inset-0 opacity-60" />
        </div>
        <div className="absolute -bottom-4 h-2 w-1/2 bg-tech-600 ltr:left-0 rtl:right-0" aria-hidden />
        <div key={s.id} className="relative animate-fade-up">
          {s.photo ? (
            <MediaImage asset={s.photo} locale={locale} alt={s.name} sizes="(min-width:1024px) 32vw, 90vw" className="relative mx-auto h-auto w-[88%]" />
          ) : (
            <div className="relative aspect-[4/5]" />
          )}
        </div>
      </div>

      <div className="lg:col-span-7">
        <figure key={s.id} className="animate-fade-up" aria-live="polite" aria-roledescription="slide" aria-label={`${index + 1} / ${slides.length}`}>
          <span className="display block h-14 text-[7rem] leading-none text-tech/30 select-none" aria-hidden>“</span>
          <blockquote className={cn("space-y-5 text-lg leading-[1.9] sm:text-xl", dark ? "text-white/85" : "text-ink/85")}>
            {paragraphs(s.message).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </blockquote>
          <figcaption className="mt-10 flex items-center gap-5">
            <span className="h-px w-12 bg-tech-600" aria-hidden />
            <span>
              <span className={cn("heading block text-xl", dark ? "text-white" : "text-ink")}>{s.name}</span>
              <span className="mt-0.5 block text-muted">{s.position}</span>
            </span>
          </figcaption>
        </figure>

        <div className={cn("mt-10 flex flex-wrap items-center gap-4 border-t pt-6", dark ? "border-white/15" : "border-line")}>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(index - 1)} className={cn("grid size-11 place-items-center rounded-full border transition-colors", dark ? "border-white/25 text-white hover:bg-white hover:text-navy" : "border-line-strong text-ink hover:border-navy hover:bg-navy hover:text-white")} aria-label={labels.previous}>
              <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            </button>
            <button type="button" onClick={() => go(index + 1)} className={cn("grid size-11 place-items-center rounded-full border transition-colors", dark ? "border-white/25 text-white hover:bg-white hover:text-navy" : "border-line-strong text-ink hover:border-navy hover:bg-navy hover:text-white")} aria-label={labels.next}>
              <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
            </button>
          </div>
          <ul className="flex flex-1 flex-wrap justify-end gap-2">
            {slides.map((sl, i) => (
              <li key={sl.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={i === index}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                    i === index ? "bg-tech-600 text-white" : dark ? "text-white/70 hover:text-white" : "text-muted hover:text-ink",
                  )}
                >
                  {sl.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
