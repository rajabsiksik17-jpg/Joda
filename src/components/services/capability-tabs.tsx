"use client";

import { useId, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Group = { title: string; text: string; items: string[] };

/** Capability groups as an accessible tab set (arrow keys move between tabs). */
export function CapabilityTabs({ groups }: { groups: Group[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const g = groups[active];

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const rtl = document.documentElement.dir === "rtl";
    let n = i;
    if (e.key === (rtl ? "ArrowLeft" : "ArrowRight") || e.key === "ArrowDown") n = (i + 1) % groups.length;
    else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft") || e.key === "ArrowUp") n = (i - 1 + groups.length) % groups.length;
    else return;
    e.preventDefault();
    setActive(n);
    refs.current[n]?.focus();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div role="tablist" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-1 lg:col-span-4 lg:flex-col lg:overflow-visible">
        {groups.map((gr, i) => (
          <button
            key={gr.title}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            id={`${id}-t${i}`}
            aria-selected={active === i}
            aria-controls={`${id}-p`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "group flex shrink-0 items-center gap-4 rounded-sm border px-4 py-3.5 text-start transition-all duration-300 lg:px-5 lg:py-4",
              active === i ? "border-navy bg-navy text-white shadow-lift" : "border-line bg-white text-ink hover:border-tech-600",
            )}
          >
            <span className={cn("font-mono text-xs", active === i ? "text-sky" : "text-muted")} dir="ltr">{String(i + 1).padStart(2, "0")}</span>
            <span className="heading flex-1 text-[0.98rem] leading-snug">{gr.title}</span>
            <span className={cn("hidden rounded-full px-2 py-0.5 text-xs lg:inline", active === i ? "bg-white/15" : "bg-surface")} dir="ltr">{gr.items.length}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-p`} aria-labelledby={`${id}-t${active}`} key={active} className="animate-fade-up lg:col-span-8">
        {g.text && <p className="lede mb-6">{g.text}</p>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {g.items.map((item, i) => (
            <li key={item} className="flex gap-3.5 rounded-sm border border-line bg-white p-5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-tech-600/50" style={{ animationDelay: `${i * 40}ms` }}>
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sky-50 text-tech-600"><Check className="size-3.5" aria-hidden /></span>
              <span className="leading-relaxed font-medium text-ink">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
