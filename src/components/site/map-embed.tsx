"use client";

import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";

/**
 * Click-to-load Google Map: no third-party request (and no Google cookies) until the visitor asks
 * for the interactive map.
 */
export function MapEmbed({ embedUrl, openUrl, address, labels, height = 420 }: { embedUrl: string; openUrl: string; address: string; labels: { load: string; open: string; note: string }; height?: number }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative overflow-hidden border border-line bg-navy" style={{ height }}>
      {loaded ? (
        <iframe src={embedUrl} title={address || "Map"} className="size-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      ) : (
        <div className="relative flex size-full flex-col items-center justify-center p-6 text-center text-white">
          <div className="grid-texture-dark absolute inset-0" aria-hidden />
          <svg className="absolute inset-0 size-full opacity-25" aria-hidden="true">
            <defs>
              <pattern id="map-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#3ab4e0" /></pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-dots)" />
          </svg>
          <span className="relative grid size-16 place-items-center rounded-full bg-tech-600 shadow-[0_0_0_12px_rgba(22,143,193,0.2)]">
            <MapPin className="size-7" aria-hidden />
          </span>
          {address && <p className="relative mt-6 text-lg font-semibold">{address}</p>}
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-primary" onClick={() => setLoaded(true)}>{labels.load}</button>
            <a href={openUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light">
              {labels.open}
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </div>
          <p className="relative mt-4 text-xs text-white/55">{labels.note}</p>
        </div>
      )}
    </div>
  );
}
