"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/** Click-to-play: nothing third-party loads until the visitor presses play. */
export function VideoPlayer({ embedUrl, fileUrl, posterUrl, title, playLabel }: { embedUrl: string | null; fileUrl: string | null; posterUrl: string | null; title: string; playLabel: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden bg-navy">
      {playing ? (
        embedUrl ? (
          <iframe src={embedUrl} title={title} className="size-full border-0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        ) : fileUrl ? (
          <video src={fileUrl} poster={posterUrl ?? undefined} controls autoPlay playsInline className="size-full bg-black" />
        ) : null
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 grid size-full place-items-center" aria-label={`${playLabel}: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {posterUrl && <img src={posterUrl} alt="" className="absolute inset-0 size-full object-cover opacity-80" />}
          <span className="grid-texture-dark absolute inset-0" aria-hidden />
          <span className="relative grid size-20 place-items-center rounded-full bg-tech-600 text-white shadow-[0_0_0_14px_rgba(22,143,193,0.25)] transition-transform duration-500 group-hover:scale-110">
            <Play className="ms-1 size-8 fill-current" aria-hidden />
          </span>
        </button>
      )}
    </div>
  );
}
