"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type ClientTile = { id: string; name: string; logo: { url: string; width: number; height: number } | null; url: string | null };
export type ClientGroupView = { id: string; name: string; clients: ClientTile[] };

function Tile({ c }: { c: ClientTile }) {
  const inner = c.logo ? (
    <Image src={c.logo.url} alt={c.name} width={c.logo.width} height={c.logo.height} sizes="200px" className="h-auto max-h-14 w-auto max-w-[78%] object-contain opacity-80 grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0" />
  ) : (
    <span className="px-3 text-center text-[0.95rem] leading-snug font-semibold text-ink/80 transition-colors group-hover:text-navy" dir="auto">{c.name}</span>
  );
  const cls = "group flex h-28 items-center justify-center bg-white transition-colors hover:bg-sky-50/60";
  return c.url ? (
    <a href={c.url} target="_blank" rel="noopener noreferrer" className={cls} aria-label={c.name}>{inner}</a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function Wall({ clients }: { clients: ClientTile[] }) {
  return (
    <ul className="grid grid-cols-2 border-s border-t border-line sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {clients.map((c) => (
        <li key={c.id} className="border-e border-b border-line"><Tile c={c} /></li>
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
      <div role="tablist" className="mb-8 flex flex-wrap gap-2">
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
              "inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors",
              active === i ? "border-navy bg-navy text-white" : "border-line-strong text-ink hover:border-navy",
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
