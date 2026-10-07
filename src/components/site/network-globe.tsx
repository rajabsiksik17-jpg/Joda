"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; z: number };

const SKY = [58, 180, 224];
const TECH = [22, 143, 193];

/** Points evenly distributed on a sphere (Fibonacci lattice). */
function spherePoints(n: number): Node[] {
  const pts: Node[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    pts.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r });
  }
  return pts;
}

/**
 * The identity's "network globe": a slowly rotating sphere of connected nodes with digital squares
 * emerging from it — a nod to the logo's journey from organic network to digital pixels.
 */
export function NetworkGlobe({ className, mirrored = false }: { className?: string; mirrored?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = spherePoints(170);
    // Pre-compute neighbour pairs once (in sphere space, so they stay stable while rotating).
    const pairs: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
        if (d < 0.075) pairs.push([i, j]);
      }
    }
    const squares = Array.from({ length: 16 }, (_, i) => ({
      ox: 0.75 + Math.random() * 0.75,
      oy: -0.95 + Math.random() * 0.9,
      size: 0.035 + Math.random() * 0.06,
      speed: 0.12 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
      tone: i % 3 === 0 ? SKY : TECH,
    }));

    let width = 0, height = 0, dpr = 1, raf = 0, running = false, angle = 0.6, last = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width, height) * 0.38;
      const cx = width * (mirrored ? 0.58 : 0.42);
      const cy = height * 0.5;
      const tilt = 0.32;
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const cosT = Math.cos(tilt), sinT = Math.sin(tilt);

      const projected = nodes.map((n) => {
        const x = n.x * cosA - n.z * sinA;
        const z1 = n.x * sinA + n.z * cosA;
        const y = n.y * cosT - z1 * sinT;
        const z = n.y * sinT + z1 * cosT;
        return { sx: cx + x * radius, sy: cy + y * radius, z };
      });

      // Orbit ring, echoing the logo's swoosh
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.38);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.32, radius * 0.36, 0, Math.PI * 0.05, Math.PI * 0.95);
      ctx.strokeStyle = `rgba(${SKY.join(",")},0.55)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.lineWidth = 1;
      for (const [i, j] of pairs) {
        const a = projected[i], b = projected[j];
        const depth = (a.z + b.z) / 2;
        const alpha = 0.06 + Math.max(0, depth + 0.2) * 0.32;
        ctx.strokeStyle = `rgba(${SKY.join(",")},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
      for (const p of projected) {
        const front = p.z > 0;
        const r = front ? 1.6 + p.z * 1.8 : 1.1;
        ctx.fillStyle = front ? `rgba(255,255,255,${(0.45 + p.z * 0.5).toFixed(3)})` : `rgba(${SKY.join(",")},0.25)`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Digital squares drifting outward from the globe
      const dir = mirrored ? -1 : 1;
      for (const s of squares) {
        const drift = reduced ? 0 : Math.sin(time * 0.0004 * s.speed * 4 + s.phase) * 0.04;
        const x = cx + dir * (s.ox * radius) + dir * drift * radius;
        const y = cy + (s.oy + drift * 0.6) * radius;
        const size = s.size * radius;
        const alpha = 0.35 + 0.45 * (1 - (s.ox - 0.75) / 0.75);
        ctx.fillStyle = `rgba(${s.tone.join(",")},${alpha.toFixed(3)})`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    };

    const loop = (time: number) => {
      if (!running) return;
      const dt = last ? Math.min(64, time - last) : 16;
      last = time;
      angle += dt * 0.00011;
      draw(time);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    draw(0);
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mirrored]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
