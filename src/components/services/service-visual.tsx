import { cn } from "@/lib/cn";

/**
 * Bespoke illustrations giving each service its own visual identity, drawn from the brand motifs
 * (connected nodes, the network globe, gradated digital squares). Text inside the drawings is limited
 * to framework/standard names that appear in the official service content.
 * Animations are CSS-only (stroke drawing, slow float, pulse) and disabled for reduced motion.
 */
const W = "rgba(255,255,255,0.85)";
const W2 = "rgba(255,255,255,0.22)";
const SKY = "#3ab4e0";
const TECH = "#168fc1";

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 480 420" className={cn("svc-visual h-auto w-full", className)} role="presentation" aria-hidden="true">
      <defs>
        <radialGradient id="svc-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={TECH} stopOpacity="0.45" />
          <stop offset="1" stopColor={TECH} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="svc-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKY} />
          <stop offset="1" stopColor={TECH} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <circle cx="240" cy="210" r="200" fill="url(#svc-glow)" />
      {children}
    </svg>
  );
}

const Node = ({ x, y, r = 7, fill = W, pulse = false, delay = 0 }: { x: number; y: number; r?: number; fill?: string; pulse?: boolean; delay?: number }) => (
  <circle cx={x} cy={y} r={r} fill={fill} className={pulse ? "svc-pulse" : undefined} style={pulse ? { animationDelay: `${delay}ms` } : undefined} />
);
const Line = ({ d, color = W2, w = 1.5, draw = true, delay = 0 }: { d: string; color?: string; w?: number; draw?: boolean; delay?: number }) => (
  <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" pathLength={draw ? 1 : undefined} className={draw ? "svc-draw" : undefined} style={draw ? { animationDelay: `${delay}ms` } : undefined} />
);
const Label = ({ x, y, children, size = 13, color = W, anchor = "middle" }: { x: number; y: number; children: React.ReactNode; size?: number; color?: string; anchor?: "start" | "middle" | "end" }) => (
  <text x={x} y={y} fill={color} fontSize={size} fontWeight={700} textAnchor={anchor} fontFamily="var(--font-inter), sans-serif" letterSpacing="0.06em" direction="ltr">{children}</text>
);
const Squares = ({ x, y, n = 6, delay = 0 }: { x: number; y: number; n?: number; delay?: number }) => (
  <g className="svc-float" style={{ animationDelay: `${delay}ms` }}>
    {Array.from({ length: n }, (_, i) => {
      const s = 10 + ((i * 7) % 12);
      return <rect key={i} x={x + (i % 3) * 22} y={y + Math.floor(i / 3) * 22} width={s} height={s} fill={i % 2 ? SKY : TECH} opacity={0.45 + (i % 3) * 0.2} />;
    })}
  </g>
);

function Governance() {
  // Temple of governance at the centre, with the five management offices orbiting it.
  const offices = [[240, 62], [372, 146], [330, 314], [150, 314], [108, 146]] as const;
  return (
    <Frame>
      <circle cx="240" cy="210" r="150" stroke={W2} fill="none" strokeDasharray="4 7" className="svc-spin" />
      {offices.map(([x, y], i) => <Line key={i} d={`M240 210 L${x} ${y}`} delay={i * 120} />)}
      <g className="svc-float">
        <path d="M190 180 L240 150 L290 180 Z" fill={W} />
        {[198, 222, 246, 270].map((x) => <rect key={x} x={x} y={188} width="12" height="52" fill={W} opacity="0.9" />)}
        <rect x="186" y="244" width="108" height="10" fill={SKY} />
      </g>
      {offices.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="24" fill="rgba(7,31,63,0.9)" stroke={i < 2 ? SKY : W2} strokeWidth="1.5" />
          <Node x={x} y={y} r={5} fill={i < 2 ? SKY : W} pulse delay={i * 300} />
        </g>
      ))}
      <Label x={240} y={34} size={12}>SMO</Label>
      <Label x={412} y={150} size={12} anchor="start">PMO</Label>
    </Frame>
  );
}

function Ai() {
  // A small neural network: inputs → hidden layers → outputs, with signals travelling through.
  const layers = [[90, [120, 190, 260, 330]], [200, [100, 170, 240, 310, 380]], [310, [130, 210, 290]], [410, [175, 255]]] as const;
  const lines: string[] = [];
  for (let i = 0; i < layers.length - 1; i++) for (const a of layers[i][1]) for (const b of layers[i + 1][1]) lines.push(`M${layers[i][0]} ${a} L${layers[i + 1][0]} ${b}`);
  return (
    <Frame>
      {lines.map((d, i) => <Line key={i} d={d} color="rgba(58,180,224,0.28)" w={1} delay={(i % 12) * 60} />)}
      {layers.map(([x, ys], li) => ys.map((y, i) => <Node key={`${li}-${i}`} x={x} y={y} r={li === 3 ? 10 : 7} fill={li === 3 ? SKY : W} pulse delay={(li * 4 + i) * 180} />))}
      <circle r="4" fill={SKY} className="svc-signal">
        <animateMotion dur="3.2s" repeatCount="indefinite" path="M90 190 L200 240 L310 210 L410 175" />
      </circle>
      <circle r="4" fill="#fff" className="svc-signal">
        <animateMotion dur="3.8s" begin="1.2s" repeatCount="indefinite" path="M90 330 L200 310 L310 290 L410 255" />
      </circle>
    </Frame>
  );
}

function Digital() {
  // Legacy blocks on one side resolving into the brand's digital squares on the other.
  return (
    <Frame>
      {[0, 1, 2].map((i) => <rect key={i} x={60} y={110 + i * 70} width={110} height={50} rx="4" fill="none" stroke={W2} strokeWidth="1.5" strokeDasharray="5 5" />)}
      {[0, 1, 2].map((i) => <rect key={`f${i}`} x={72} y={124 + i * 70} width={56} height={6} fill={W2} />)}
      <Line d="M180 215 C 230 215, 240 160, 290 160" color={SKY} w={2} />
      <Line d="M180 215 C 230 215, 240 270, 290 270" color={SKY} w={2} delay={200} />
      <Line d="M180 215 L 290 215" color={SKY} w={2} delay={100} />
      <polygon points="300,215 288,207 288,223" fill={SKY} />
      <g className="svc-float">
        {Array.from({ length: 16 }, (_, i) => {
          const col = i % 4, row = Math.floor(i / 4);
          return <rect key={i} x={310 + col * 30} y={150 + row * 30} width={22} height={22} fill={(col + row) % 3 === 0 ? SKY : TECH} opacity={0.35 + (col / 4) * 0.6} className="svc-pop" style={{ animationDelay: `${300 + i * 60}ms` }} />;
        })}
      </g>
    </Frame>
  );
}

function Efficiency() {
  // Spending bars narrowing while a value line rises.
  const bars = [190, 168, 150, 128, 112, 96];
  return (
    <Frame>
      <line x1="70" y1="340" x2="420" y2="340" stroke={W2} />
      {bars.map((h, i) => (
        <rect key={i} x={86 + i * 56} y={340 - h} width="32" height={h} fill="url(#svc-bar)" className="svc-grow" style={{ animationDelay: `${i * 90}ms`, transformOrigin: `${102 + i * 56}px 340px` }} />
      ))}
      <Line d="M90 290 L146 262 L202 230 L258 204 L314 166 L370 128 L410 104" color="#fff" w={2.5} delay={400} />
      {[[146, 262], [258, 204], [370, 128]].map(([x, y], i) => <Node key={i} x={x} y={y} r={6} fill={SKY} pulse delay={i * 300} />)}
      <Squares x={360} y={52} n={5} />
    </Frame>
  );
}

function Strategy() {
  // A target with a strategy map of objectives converging on it.
  return (
    <Frame>
      {[120, 85, 50, 18].map((r, i) => <circle key={r} cx="300" cy="190" r={r} fill={i === 3 ? SKY : "none"} stroke={i === 3 ? "none" : i === 0 ? W2 : "rgba(255,255,255,0.35)"} strokeWidth="1.5" />)}
      {[[80, 330], [150, 260], [90, 190], [170, 130]].map(([x, y], i, a) => (
        <g key={i}>
          {i > 0 && <Line d={`M${a[i - 1][0]} ${a[i - 1][1]} L${x} ${y}`} color="rgba(255,255,255,0.45)" delay={i * 150} />}
          <rect x={x - 26} y={y - 14} width="52" height="28" rx="4" fill="rgba(7,31,63,0.9)" stroke={i === 3 ? SKY : W2} />
          <Node x={x} y={y} r={4} fill={i === 3 ? SKY : W} pulse delay={i * 250} />
        </g>
      ))}
      <Line d="M196 130 C 240 120, 270 150, 290 182" color={SKY} w={2.5} delay={700} />
      <polygon points="296,190 282,184 290,174" fill={SKY} />
    </Frame>
  );
}

function It() {
  // Isometric technology stack, framed by the standards named in the service.
  const layer = (y: number, fill: string, i: number) => (
    <g key={y} className="svc-float" style={{ animationDelay: `${i * 400}ms` }}>
      <path d={`M240 ${y} L360 ${y + 50} L240 ${y + 100} L120 ${y + 50} Z`} fill={fill} stroke="rgba(255,255,255,0.4)" />
      <path d={`M120 ${y + 50} L120 ${y + 64} L240 ${y + 114} L240 ${y + 100} Z`} fill="rgba(7,31,63,0.8)" />
      <path d={`M360 ${y + 50} L360 ${y + 64} L240 ${y + 114} L240 ${y + 100} Z`} fill="rgba(5,23,47,0.95)" />
    </g>
  );
  return (
    <Frame>
      {layer(220, "rgba(22,143,193,0.35)", 2)}
      {layer(160, "rgba(58,180,224,0.45)", 1)}
      {layer(100, "rgba(255,255,255,0.18)", 0)}
      <Label x={70} y={120} anchor="start" color={SKY}>COBIT</Label>
      <Label x={410} y={120} anchor="end" color={SKY}>ITIL</Label>
      <Label x={60} y={330} anchor="start">ISO/IEC 27001</Label>
      <Label x={420} y={330} anchor="end">ISO/IEC 20000</Label>
      <Line d="M118 126 L170 160" delay={300} />
      <Line d="M362 126 L310 160" delay={300} />
    </Frame>
  );
}

function Finance() {
  // A performance curve over structured columns — analysis, structure and reporting.
  return (
    <Frame>
      {[300, 250, 200, 150].map((y) => <line key={y} x1="70" y1={y} x2="420" y2={y} stroke="rgba(255,255,255,0.08)" />)}
      {[120, 90, 140, 110, 160, 135, 180].map((h, i) => (
        <rect key={i} x={84 + i * 48} y={330 - h} width="20" height={h} fill={i % 2 ? "rgba(255,255,255,0.18)" : "url(#svc-bar)"} className="svc-grow" style={{ animationDelay: `${i * 80}ms`, transformOrigin: `${94 + i * 48}px 330px` }} />
      ))}
      <path d="M80 250 C 140 240, 160 200, 210 205 S 300 150, 340 140 S 400 100, 420 92 L420 330 L80 330 Z" fill="rgba(58,180,224,0.12)" />
      <Line d="M80 250 C 140 240, 160 200, 210 205 S 300 150, 340 140 S 400 100, 420 92" color={SKY} w={3} />
      <Node x={420} y={92} r={8} fill="#fff" pulse />
      <line x1="70" y1="330" x2="420" y2="330" stroke={W2} />
    </Frame>
  );
}

function People() {
  // An organisation chart: structure, roles and connections between people.
  const person = (x: number, y: number, r: number, color: string, i: number) => (
    <g key={`${x}-${y}`} className="svc-pop" style={{ animationDelay: `${i * 90}ms` }}>
      <circle cx={x} cy={y - r * 0.45} r={r * 0.42} fill={color} />
      <path d={`M${x - r * 0.75} ${y + r * 0.75} C ${x - r * 0.75} ${y + r * 0.05}, ${x + r * 0.75} ${y + r * 0.05}, ${x + r * 0.75} ${y + r * 0.75} Z`} fill={color} />
    </g>
  );
  return (
    <Frame>
      <Line d="M240 128 L240 168 M120 168 L360 168 M120 168 L120 208 M240 168 L240 208 M360 168 L360 208" color="rgba(255,255,255,0.4)" />
      <Line d="M120 262 L120 288 M70 288 L170 288 M70 288 L70 312 M170 288 L170 312 M360 262 L360 288 M310 288 L410 288 M310 288 L310 312 M410 288 L410 312" color="rgba(255,255,255,0.25)" delay={300} />
      {person(240, 98, 44, SKY, 0)}
      {[120, 240, 360].map((x, i) => person(x, 236, 34, "rgba(255,255,255,0.9)", i + 1))}
      {[70, 170, 310, 410].map((x, i) => person(x, 338, 26, i % 2 ? TECH : "rgba(255,255,255,0.55)", i + 4))}
    </Frame>
  );
}

function Capacity() {
  // Ascending steps of capability, ending in sustained growth.
  return (
    <Frame>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={80 + i * 80} y={300 - i * 55} width={80} height={45 + i * 55} fill={i === 3 ? "url(#svc-bar)" : `rgba(255,255,255,${0.1 + i * 0.07})`} stroke="rgba(255,255,255,0.25)" className="svc-grow" style={{ animationDelay: `${i * 150}ms`, transformOrigin: `${120 + i * 80}px 345px` }} />
      ))}
      <Line d="M100 280 L180 225 L260 170 L340 115 L410 70" color="#fff" w={2.5} delay={500} />
      <polygon points="418,64 404,66 412,78" fill="#fff" />
      {[[180, 225], [260, 170], [340, 115]].map(([x, y], i) => <Node key={i} x={x} y={y} r={7} fill={SKY} pulse delay={i * 250} />)}
      <Squares x={80} y={70} n={4} delay={300} />
    </Frame>
  );
}

function Iso() {
  // A certification seal surrounded by the standards supported.
  const std = ["9001", "14001", "45001", "27001", "22301", "31000", "50001", "37000"];
  return (
    <Frame>
      <circle cx="240" cy="210" r="150" fill="none" stroke={W2} />
      <g className="svc-spin-slow" style={{ transformOrigin: "240px 210px" }}>
        {std.map((s, i) => {
          const a = (i / std.length) * Math.PI * 2 - Math.PI / 2;
          const x = 240 + Math.cos(a) * 150, y = 210 + Math.sin(a) * 150;
          return (
            <g key={s}>
              <rect x={x - 30} y={y - 14} width="60" height="28" rx="14" fill="rgba(7,31,63,0.95)" stroke={i % 3 === 0 ? SKY : "rgba(255,255,255,0.3)"} />
              <Label x={x} y={y + 4.5} size={11} color={i % 3 === 0 ? SKY : W}>{s}</Label>
            </g>
          );
        })}
      </g>
      <circle cx="240" cy="210" r="78" fill={TECH} opacity="0.25" />
      <circle cx="240" cy="210" r="62" fill="rgba(7,31,63,0.95)" stroke={SKY} strokeWidth="2" />
      <Label x={240} y={206} size={24}>ISO</Label>
      <path d="M222 222 L236 236 L262 208" stroke={SKY} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="svc-draw" style={{ animationDelay: "500ms" }} />
    </Frame>
  );
}

const VISUALS: Record<string, () => React.JSX.Element> = {
  governance: Governance, ai: Ai, digital: Digital, efficiency: Efficiency, strategy: Strategy, it: It, finance: Finance, people: People, capacity: Capacity, iso: Iso,
};

export const SERVICE_VISUAL_KEYS = Object.keys(VISUALS);

/** Picks the illustration for a service; "auto" falls back by slug or to the network motif. */
export function ServiceVisual({ visual, slug, className }: { visual: string; slug?: string; className?: string }) {
  const bySlug: Record<string, string> = { governance: "governance", "artificial-intelligence": "ai", "digital-transformation": "digital", "spending-efficiency": "efficiency", "business-strategy": "strategy", "it-consulting": "it", "financial-consulting": "finance", "human-capital": "people", "capacity-building": "capacity", "iso-consulting": "iso" };
  const key = visual !== "auto" && VISUALS[visual] ? visual : (slug && bySlug[slug]) || "ai";
  const Cmp = VISUALS[key];
  return (
    <div className={className}>
      <Cmp />
    </div>
  );
}
