"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Sticky in-page navigation with reading progress for long service pages. */
export function ServiceSubnav({ items, label }: { items: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [items]);

  return (
    <nav aria-label={label} className="sticky top-[4.5rem] z-30 border-b border-line bg-white/90 backdrop-blur-md lg:top-20">
      <div className="container-qe">
        <ul className="-mx-1 flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
          {items.map((i) => (
            <li key={i.id} className="shrink-0">
              <a
                href={`#${i.id}`}
                aria-current={active === i.id ? "true" : undefined}
                className={cn("inline-block rounded-full px-4 py-2 text-sm font-medium transition-colors", active === i.id ? "bg-navy text-white" : "text-body hover:bg-surface hover:text-ink")}
              >
                {i.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div ref={barRef} className="h-0.5 origin-left bg-tech-600 rtl:origin-right" style={{ transform: "scaleX(0)" }} aria-hidden />
    </nav>
  );
}
