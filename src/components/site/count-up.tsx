"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates the numeric part of a statistic ("+100", "4", "98%") when it enters the viewport.
 * Server-rendered with the final value so it is correct without JavaScript and for crawlers.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const match = value.match(/^(\D*)(\d[\d,]*)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!match || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, prefix, digits, suffix] = match;
    const target = Number(digits.replace(/,/g, ""));
    if (!Number.isFinite(target) || target === 0) return;
    const el = ref.current;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const duration = 1600;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 4);
          setDisplay(`${prefix}${Math.round(target * eased).toLocaleString("en-US")}${suffix}`);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        setDisplay(`${prefix}0${suffix}`);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className} dir="ltr" aria-label={value}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
