"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type ClientTile = { id: string; name: string; logo: { url: string; width: number; height: number } | null; url: string | null };
export type ClientGroupView = { id: string; name: string; clients: ClientTile[] };

const MONO = ["bg-navy text-white", "bg-tech-600 text-white", "bg-sky-50 text-tech-600 ring-1 ring-inset ring-tech-600/15"];

function initials(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s&]/gu, " ").split(/\s+/).filter((w) => w && w !== "&");
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "").slice(0, 2)).toUpperCase();
}

function Tile({ c, i }: { c: ClientTile; i: number }) {
  const inner = c.logo ? (
    <span className="flex h-full w-full items-center justify-center">
      <Image src={c.logo.url} alt={c.name} width={c.logo.width} height={c.logo.height} sizes="200px" className="h-auto max-h-12 w-auto max-w-[80%] object-contain opacity-80 grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0" />
    </span>
  ) : (
    <>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-sm text-[0.8rem] font-bold tracking-wide transition-transform duration-500 group-hover:-rotate-6 sm:size-11", MONO[i % MONO.length])} aria-hidden dir="ltr">
        {initials(c.name)}
      </span>
      <span className="min-w-0 flex-1 text-[0.9rem] leading-snug font-semibold text-ink transition-colors group-hover:text-tech-600 sm:text-[0.95rem]" dir="auto">{c.name}</span>
    </>
  );
  const cls = cn("card-premium group flex h-full items-center gap-3 p-3 sm:gap-3.5 sm:p-4", c.logo ? "min-h-24 justify-center" : "min-h-[4.25rem] sm:min-h-[4.75rem]");
  return c.url ? (
    <a href={c.url} target="_blank" rel="noopener noreferrer" className={cls} aria-label={c.name}>{inner}</a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function Wall({ clients }: { clients: ClientTile[] }) {
  return (
    <ul className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
      {clients.map((c, i) => (
        <li key={c.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
          <Tile c={c} i={i} />
        </li>
      ))}
    </ul>
  );
}

export function ClientTabs({ groups, layout }: { groups: ClientGroupView[]; layout: "tabs" | "wall" }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  if (layout === "wall" || groups.length < 2) return <Wall clients={groups.flatMap((g) => g.clients)} />;

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const rtl = document.documentElement.dir === "rtl";
    let next = i;
    if (e.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = (i + 1) % groups.length;
    else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = (i - 1 + groups.length) % groups.length;
    else return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <div>
      <div role="tablist" className="mb-6 flex flex-wrap gap-2 sm:mb-8">
        {groups.map((g, i) => (
          <button
            key={g.id}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            id={`${id}-t${i}`}
            aria-selected={active === i}
            aria-controls={`${id}-p`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 sm:px-5 sm:py-2.5",
              active === i ? "border-navy bg-navy text-white shadow-lift" : "border-line-strong bg-white text-ink hover:border-tech-600 hover:text-tech-600",
            )}
          >
            {g.name}
            <span className={cn("rounded-full px-2 py-0.5 text-xs", active === i ? "bg-white/15" : "bg-surface")} dir="ltr">{g.clients.length}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-p`} aria-labelledby={`${id}-t${active}`} key={active} className="animate-fade-up">
        <Wall clients={groups[active].clients} />
      </div>
    </div>
  );
}
