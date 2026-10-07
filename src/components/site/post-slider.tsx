"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";
import { PostCardBody, type PostCardView } from "./post-card-view";

/**
 * Horizontal article slider built on native scroll-snap: swipe on touch, buttons and keyboard
 * elsewhere. No auto-play, so reading is never interrupted.
 */
export function PostSlider({ posts, locale, labels }: { posts: PostCardView[]; locale: Locale; labels: { previous: string; next: string; read: string } }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: posts.length <= 1 });
  const [active, setActive] = useState(0);

  const update = () => {
    const el = trackRef.current;
    if (!el) return;
    // scrollLeft is negative in RTL; use magnitudes.
    const pos = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    setEdge({ start: pos < 8, end: pos > max - 8 });
    const item = el.firstElementChild as HTMLElement | null;
    if (item) setActive(Math.round(pos / (item.offsetWidth + 24)));
  };

  const go = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const item = el.firstElementChild as HTMLElement | null;
    const step = (item?.offsetWidth ?? el.clientWidth) + 24;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * step * (rtl ? -1 : 1), behavior: "smooth" });
  };

  const navBtn = "grid size-12 place-items-center rounded-full border border-line-strong text-ink transition-all hover:border-navy hover:bg-navy hover:text-white disabled:pointer-events-none disabled:opacity-35";

  return (
    <div>
      <ul
        ref={trackRef}
        onScroll={update}
        className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carousel"
      >
        {posts.map((p, i) => (
          <li key={p.id} className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]" aria-roledescription="slide" aria-label={`${i + 1} / ${posts.length}`}>
            <PostCardBody post={p} locale={locale} readLabel={labels.read} reveal={false} />
          </li>
        ))}
      </ul>
      {posts.length > 1 && (
        <div className="mt-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5" aria-hidden>
            {posts.map((p, i) => (
              <span key={p.id} className={cn("h-1 rounded-full transition-all duration-500", i === active ? "w-8 bg-tech-600" : "w-3 bg-line-strong")} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className={navBtn} onClick={() => go(-1)} disabled={edge.start} aria-label={labels.previous}>
              <ArrowLeft className="size-5 rtl:-scale-x-100" aria-hidden />
            </button>
            <button type="button" className={navBtn} onClick={() => go(1)} disabled={edge.end} aria-label={labels.next}>
              <ArrowRight className="size-5 rtl:-scale-x-100" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
