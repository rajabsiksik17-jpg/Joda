"use client";

import { useEffect, useRef } from "react";

/** Muted background video that does not autoplay for visitors who prefer reduced motion. */
export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
    v.play().catch(() => undefined);
  }, []);
  return (
    <>
      <video ref={ref} className="absolute inset-0 size-full object-cover opacity-50" src={src} poster={poster} muted loop playsInline preload="metadata" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/40" />
    </>
  );
}
