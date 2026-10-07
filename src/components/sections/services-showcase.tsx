"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/cn";

export type ShowcaseService = { id: string; title: string; summary: string; icon: string; href: string; category: string; highlights: string[] };

/**
 * Interactive service explorer: a numbered index on one side and a detail panel on the other.
 * Implemented as an accessible tab list (arrow keys move between services). On small screens it
 * becomes a list of expandable cards.
 */
export function ServicesShowcase({ services, exploreLabel }: { services: ShowcaseService[]; exploreLabel: string }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const current = services[active];

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const rtl = document.documentElement.dir === "rtl";
    let next = index;
    if (e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = (index + 1) % services.length;
    else if (e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = (index - 1 + services.length) % services.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = services.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  return (
    <>
      {/* Desktop: tabbed explorer */}
      <div className="mt-14 hidden grid-cols-12 gap-10 lg:grid">
        <div role="tablist" aria-orientation="vertical" className="col-span-5 border-t border-line" data-reveal>
          {services.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => { tabsRef.current[i] = el; }}
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={active === i}
              aria-controls={`${id}-panel`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "group relative flex w-full items-center gap-5 border-b border-line py-5 text-start transition-colors",
                active === i ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              <span className={cn("absolute inset-y-0 w-0.5 transition-all duration-500 ltr:left-0 rtl:right-0", active === i ? "bg-tech-600" : "bg-transparent")} aria-hidden />
              <span className={cn("w-10 ps-4 font-mono text-sm transition-colors", active === i ? "text-tech-600" : "text-mist")} dir="ltr">{String(i + 1).padStart(2, "0")}</span>
              <span className="heading flex-1 text-xl">{s.title}</span>
              <ArrowRight className={cn("size-5 transition-all duration-300 rtl:-scale-x-100", active === i ? "translate-x-0 text-tech-600 opacity-100" : "-translate-x-2 opacity-0 rtl:translate-x-2")} aria-hidden />
            </button>
          ))}
        </div>
        <div className="col-span-7">
          {current && (
            <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} className="sticky top-28 overflow-hidden bg-navy p-12 text-white" key={current.id}>
              <div className="grid-texture-dark pointer-events-none absolute inset-0 opacity-60" />
              <div className="pointer-events-none absolute -end-20 -top-20 size-72 rounded-full bg-tech/30 blur-3xl" />
              <div className="relative animate-fade-up">
                <div className="flex items-center justify-between">
                  <span className="grid size-16 place-items-center rounded-sm bg-white/10 text-sky">
                    <Icon name={current.icon} className="size-8" strokeWidth={1.5} />
                  </span>
                  {current.category && <span className="text-sm text-white/60">{current.category}</span>}
                </div>
                <h3 className="display t-title mt-10 text-white">{current.title}</h3>
                <p className="mt-5 text-lg leading-relaxed text-white/75">{current.summary}</p>
                {current.highlights.length > 0 && (
                  <ul className="mt-8 grid gap-3 border-t border-white/10 pt-8 sm:grid-cols-2">
                    {current.highlights.map((h) => (
                      <li key={h} className="flex gap-3 text-sm leading-relaxed text-white/85">
                        <Check className="mt-0.5 size-4 shrink-0 text-sky" aria-hidden />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={current.href} className="btn btn-primary mt-10">
                  {exploreLabel}
                  <ArrowRight className="btn-arrow size-4" aria-hidden />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile & tablet: touch-first explorer — the tapped service expands in place */}
      <MobileExplorer services={services} exploreLabel={exploreLabel} />
    </>
  );
}

function MobileExplorer({ services, exploreLabel }: { services: ShowcaseService[]; exploreLabel: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const id = useId();
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const toggle = (sid: string) => {
    const next = open === sid ? null : sid;
    // Keep the tapped row anchored: remember its position, then compensate after the layout change.
    const el = itemRefs.current[sid];
    const before = el?.getBoundingClientRect().top ?? 0;
    setOpen(next);
    requestAnimationFrame(() => {
      const after = el?.getBoundingClientRect().top ?? 0;
      if (Math.abs(after - before) > 2) window.scrollBy({ top: after - before, behavior: "instant" as ScrollBehavior });
      if (next && el) {
        const r = el.getBoundingClientRect();
        if (r.top < 80) window.scrollBy({ top: r.top - 90, behavior: "smooth" });
      }
    });
  };

  return (
    <ul data-mobile-services className="mt-10 overflow-hidden rounded-sm border border-line bg-white lg:hidden">
      {services.map((s, i) => {
        const isOpen = open === s.id;
        return (
          <li key={s.id} ref={(el) => { itemRefs.current[s.id] = el; }} className={cn("border-b border-line transition-colors duration-500 last:border-b-0", isOpen && "bg-navy")}>
            <button
              type="button"
              onClick={() => toggle(s.id)}
              aria-expanded={isOpen}
              aria-controls={`${id}-${i}`}
              className="flex w-full items-center gap-4 px-5 py-5 text-start"
            >
              <span className={cn("grid size-11 shrink-0 place-items-center rounded-sm transition-colors duration-500", isOpen ? "bg-tech-600 text-white" : "bg-sky-50 text-tech-600")}>
                <Icon name={s.icon} className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block font-mono text-xs transition-colors", isOpen ? "text-sky" : "text-mist")} dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                <span className={cn("heading block text-[1.05rem] leading-snug transition-colors", isOpen ? "text-white" : "text-ink")}>{s.title}</span>
              </span>
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border transition-all duration-500", isOpen ? "rotate-45 border-white/30 text-white" : "border-line-strong text-ink")}>
                <Plus className="size-4" aria-hidden />
              </span>
            </button>
            <div id={`${id}-${i}`} role="region" aria-hidden={!isOpen} className={cn("grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden">
                <div className={cn("px-5 pb-6 transition-[opacity,transform] duration-500", isOpen ? "translate-y-0 opacity-100 delay-100" : "-translate-y-2 opacity-0")}>
                  {s.category && <p className="mb-2 text-xs font-semibold tracking-wide text-sky uppercase rtl:tracking-normal">{s.category}</p>}
                  <p className="leading-relaxed text-white/80">{s.summary}</p>
                  {s.highlights.length > 0 && (
                    <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
                      {s.highlights.slice(0, 4).map((h) => (
                        <li key={h} className="flex gap-3 text-sm leading-relaxed text-white/85">
                          <Check className="mt-0.5 size-4 shrink-0 text-sky" aria-hidden />
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href={s.href} tabIndex={isOpen ? 0 : -1} className="btn btn-primary mt-6 w-full">
                    {exploreLabel}
                    <ArrowRight className="btn-arrow size-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
