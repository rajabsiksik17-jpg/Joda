import { cn } from "@/lib/cn";

/**
 * Static vector compositions built from the identity's motifs (network globe, connected nodes,
 * gradated digital squares). Used where a photograph is not available, so the site never relies
 * on generic stock imagery.
 */
export function BrandMotif({ variant, className, dark = false }: { variant: "network" | "squares"; className?: string; dark?: boolean }) {
  const line = dark ? "rgba(255,255,255,0.18)" : "rgba(7,31,63,0.14)";
  const node = dark ? "#ffffff" : "#071f3f";
  if (variant === "squares") {
    // Gradated digital squares: organic network on one side resolving into a pixel grid.
    const cells: { x: number; y: number; s: number; o: number; c: string }[] = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const seed = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453;
        const r = seed - Math.floor(seed);
        const density = col / 8;
        if (r > density * 0.95 + 0.08) continue;
        const s = 20 + Math.round(r * 18);
        cells.push({ x: 40 + col * 46 + (46 - s) / 2, y: 40 + row * 46 + (46 - s) / 2, s, o: 0.25 + density * 0.75, c: r > 0.55 ? "#3ab4e0" : "#168fc1" });
      }
    }
    return (
      <svg viewBox="0 0 494 494" className={cn("h-auto w-full", className)} role="presentation" aria-hidden="true">
        <defs>
          <linearGradient id="sq-fade" x1="0" x2="1">
            <stop offset="0" stopColor="#071f3f" stopOpacity="0.9" />
            <stop offset="1" stopColor="#071f3f" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="494" height="494" fill={dark ? "transparent" : "url(#sq-fade)"} rx="4" />
        <g stroke="rgba(255,255,255,0.08)">
          {Array.from({ length: 10 }, (_, i) => (
            <g key={i}>
              <line x1={40 + i * 46} y1="40" x2={40 + i * 46} y2="454" />
              <line x1="40" y1={40 + i * 46} x2="454" y2={40 + i * 46} />
            </g>
          ))}
        </g>
        <g stroke="rgba(58,180,224,0.45)" strokeWidth="1.2" fill="none">
          <path d="M70 120 L150 90 L210 170 L130 230 L70 120 M150 90 L250 60 M210 170 L280 210 M130 230 L170 320 L90 360 M170 320 L260 300" />
        </g>
        <g fill="#fff">
          {[[70, 120], [150, 90], [210, 170], [130, 230], [250, 60], [280, 210], [170, 320], [90, 360], [260, 300]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 6 : 4.5} />
          ))}
        </g>
        {cells.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={c.s} height={c.s} fill={c.c} opacity={c.o} rx="1.5" />
        ))}
        <path d="M30 430 C 180 470, 340 420, 470 300" stroke="#168fc1" strokeWidth="9" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 500 500" className={cn("h-auto w-full", className)} role="presentation" aria-hidden="true">
      <g fill="none" stroke={line} strokeWidth="1.2">
        <circle cx="250" cy="250" r="190" />
        <ellipse cx="250" cy="250" rx="190" ry="70" />
        <ellipse cx="250" cy="250" rx="190" ry="140" />
        <ellipse cx="250" cy="250" rx="70" ry="190" />
        <ellipse cx="250" cy="250" rx="140" ry="190" />
        <line x1="60" y1="250" x2="440" y2="250" />
        <line x1="250" y1="60" x2="250" y2="440" />
      </g>
      <g stroke="#168fc1" strokeWidth="1.6" fill="none" opacity="0.85">
        <path d="M150 140 L250 110 L330 175 L290 270 L180 290 L150 140 Z M250 110 L290 270 M180 290 L230 380 L330 345 L290 270 M330 175 L400 230 L330 345" />
      </g>
      <g fill={node}>
        {[[150, 140, 8], [250, 110, 10], [330, 175, 8], [290, 270, 11], [180, 290, 9], [230, 380, 8], [330, 345, 7], [400, 230, 7]].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g fill="#3ab4e0">
        <rect x="405" y="95" width="22" height="22" />
        <rect x="440" y="70" width="14" height="14" opacity="0.8" />
        <rect x="438" y="130" width="16" height="16" opacity="0.7" />
        <rect x="470" y="105" width="10" height="10" opacity="0.6" />
      </g>
      <g fill="#168fc1">
        <rect x="380" y="140" width="16" height="16" />
        <rect x="410" y="165" width="12" height="12" opacity="0.8" />
      </g>
      <path d="M40 420 C 170 470, 330 440, 470 330" stroke="#168fc1" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M120 470 C 250 480, 370 430, 450 370" stroke={dark ? "#ffffff" : "#071f3f"} strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}
