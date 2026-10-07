// Generates the brand-style cover images used by the initial Insights articles.
//   node scripts/generate-covers.mjs   → prisma/seed-assets/insight-*.png (1600×900)
import sharp from "sharp";
import path from "node:path";

const W = 1600;
const H = 900;
const OUT = path.resolve("prisma/seed-assets");

const frame = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a2a52"/><stop offset="1" stop-color="#050f22"/></linearGradient>
  <radialGradient id="glow" cx="0.68" cy="0.42" r="0.55"><stop offset="0" stop-color="#168fc1" stop-opacity="0.45"/><stop offset="1" stop-color="#168fc1" stop-opacity="0"/></radialGradient>
  <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/></pattern>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#grid)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
${squares()}
${inner}
<rect x="0" y="${H - 10}" width="${W * 0.34}" height="10" fill="#127aa6"/>
</svg>`;

function squares() {
  const cells = [[90, 110, 0.9], [138, 110, 0.5], [186, 110, 0.25], [90, 158, 0.5], [138, 158, 0.2], [90, 206, 0.25]];
  return cells.map(([x, y, o]) => `<rect x="${x}" y="${y}" width="34" height="34" fill="#3ab4e0" fill-opacity="${o}"/>`).join("");
}

const node = (x, y, r = 10, fill = "#ffffff") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const line = (x1, y1, x2, y2, o = 0.35) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3ab4e0" stroke-opacity="${o}" stroke-width="2"/>`;

const covers = {
  "insight-governance.png": (() => {
    const cx = 1060, cy = 450;
    const sats = [[cx, 190], [cx + 250, 330], [cx + 190, 640], [cx - 190, 640], [cx - 250, 330]];
    return frame(`
<circle cx="${cx}" cy="${cy}" r="270" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-dasharray="6 10" stroke-width="2"/>
${sats.map(([x, y]) => line(cx, cy, x, y, 0.45)).join("")}
${sats.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="30" fill="#0a2a52" stroke="${i % 2 ? "#ffffff" : "#3ab4e0"}" stroke-opacity="0.8" stroke-width="3"/>${node(x, y, 9, i % 2 ? "#ffffff" : "#3ab4e0")}`).join("")}
<g transform="translate(${cx - 110} ${cy - 110})" fill="#ffffff">
  <polygon points="110,0 220,60 0,60" fill-opacity="0.95"/>
  ${[30, 75, 120, 165].map((x) => `<rect x="${x}" y="78" width="26" height="100" fill-opacity="0.9"/>`).join("")}
  <rect x="0" y="190" width="220" height="18" fill="#3ab4e0"/>
</g>`);
  })(),
  "insight-ai.png": (() => {
    const layers = [[760, [200, 330, 460, 590, 720]], [980, [260, 390, 520, 650]], [1200, [330, 450, 570]], [1400, [390, 510]]];
    let s = "";
    for (let i = 0; i < layers.length - 1; i++) for (const y1 of layers[i][1]) for (const y2 of layers[i + 1][1]) s += line(layers[i][0], y1, layers[i + 1][0], y2, 0.22);
    layers.forEach(([x, ys], i) => ys.forEach((y) => (s += node(x, y, i === layers.length - 1 ? 18 : 12, i === layers.length - 1 ? "#3ab4e0" : "#ffffff"))));
    return frame(s);
  })(),
  "insight-efficiency.png": (() => {
    const bars = [[700, 300], [800, 380], [900, 340], [1000, 440], [1100, 410], [1200, 520], [1300, 600]];
    let s = "";
    bars.forEach(([x, h], i) => (s += `<rect x="${x}" y="${780 - h}" width="56" height="${h}" fill="${i % 3 === 2 ? "#3ab4e0" : "#168fc1"}" fill-opacity="${0.35 + i * 0.08}"/>`));
    const pts = [[680, 560], [828, 470], [928, 500], [1028, 380], [1128, 400], [1228, 280], [1340, 170]];
    s += `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#ffffff" stroke-width="5" stroke-linejoin="round"/>`;
    s += pts.map(([x, y], i) => node(x, y, i === pts.length - 1 ? 14 : 8, i === pts.length - 1 ? "#3ab4e0" : "#ffffff")).join("");
    s += `<line x1="660" y1="782" x2="1420" y2="782" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2"/>`;
    return frame(s);
  })(),
  "insight-iso.png": (() => {
    const cx = 1060, cy = 450;
    let s = `<circle cx="${cx}" cy="${cy}" r="300" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="2"/>
<circle cx="${cx}" cy="${cy}" r="210" fill="none" stroke="#3ab4e0" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="4 12"/>
<circle cx="${cx}" cy="${cy}" r="130" fill="#0a2a52" stroke="#3ab4e0" stroke-width="6"/>
<polyline points="${cx - 52},${cy + 4} ${cx - 12},${cy + 44} ${cx + 60},${cy - 40}" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * 300, y = cy + Math.sin(a) * 300;
      s += `<rect x="${x - 34}" y="${y - 16}" width="68" height="32" rx="16" fill="#0a2a52" stroke="#ffffff" stroke-opacity="0.45" stroke-width="2"/>${node(x, y, 5, i % 2 ? "#3ab4e0" : "#ffffff")}`;
    }
    return frame(s);
  })(),
};

for (const [name, svg] of Object.entries(covers)) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(path.join(OUT, name));
  console.log("wrote", name);
}
