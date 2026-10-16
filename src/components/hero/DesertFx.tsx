"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/** Tumbleweed ground-contact point (canvas fractions) and radius (fraction of width), written by the hero each frame. */
export type TumbleState = { x: number; y: number; r: number; landed: boolean };

type Bird = { x: number; y: number; s: number; v: number; ph: number; glide: number };
type Grain = { x: number; y: number; v: number; len: number; a: number };
type Star = { x: number; y: number; r: number; ph: number };
type Puff = { x: number; y: number; r: number; life: number; vx: number };

const BIRD = "#1d1020";

/**
 * Canvas painted in canvas coordinates (it scales with the art): flapping birds,
 * wind-blown sand, dust kicked up where the tumbleweed lands, and stars as night falls.
 */
export function DesertFx({ tumble, night }: { tumble: MutableRefObject<TumbleState | null>; night: MutableRefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = cv.getContext("2d")!;
    let W = 0, H = 0, raf = 0, last = performance.now();

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const birds: Bird[] = [
      { x: 0.16, y: 0.13, s: 1, v: 0.012, ph: 0, glide: 0 },
      { x: 0.2, y: 0.11, s: 0.85, v: 0.012, ph: 1.7, glide: 0 },
      { x: 0.23, y: 0.15, s: 0.75, v: 0.012, ph: 3.1, glide: 0 },
      { x: 0.27, y: 0.12, s: 0.65, v: 0.012, ph: 4.4, glide: 0 },
      { x: 0.62, y: 0.2, s: 0.55, v: 0.008, ph: 2.2, glide: 0 },
    ];
    const grain = (): Grain => ({ x: rnd(0, 1.1), y: rnd(0.6, 1), v: rnd(0.05, 0.16), len: rnd(6, 26), a: rnd(0.12, 0.4) });
    const grains: Grain[] = Array.from({ length: 90 }, grain);
    const puffs: Puff[] = [];
    const stars: Star[] = Array.from({ length: 110 }, () => ({ x: rnd(0, 1), y: rnd(0, 0.5) ** 1.4 * 1.2, r: rnd(0.5, 1.7), ph: rnd(0, 6.3) }));
    let wasLanded = false;

    const drawBird = (b: Bird) => {
      const s = (W / 1672) * 9 * b.s;
      const flap = b.glide > 0 ? 0.15 : Math.sin(b.ph);
      const tipY = -flap * s * 0.9;
      const px = b.x * W, py = b.y * H + Math.sin(b.ph * 0.25) * s * 0.4;
      ctx.beginPath();
      ctx.moveTo(px - s * 1.6, py + tipY);
      ctx.quadraticCurveTo(px - s * 0.7, py - s * 0.35 + tipY * 0.3, px, py + s * 0.15);
      ctx.quadraticCurveTo(px + s * 0.7, py - s * 0.35 + tipY * 0.3, px + s * 1.6, py + tipY);
      ctx.quadraticCurveTo(px + s * 0.7, py + tipY * 0.1, px, py + s * 0.45);
      ctx.quadraticCurveTo(px - s * 0.7, py + tipY * 0.1, px - s * 1.6, py + tipY);
      ctx.fill();
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, W, H);
      const n = night.current;

      // stars come out as the sun goes down
      if (n > 0.05) {
        for (const st of stars) {
          const tw = 0.6 + 0.4 * Math.sin(now / 700 + st.ph);
          ctx.fillStyle = `rgba(255, 244, 220, ${Math.min(1, (n - 0.05) * 1.6) * tw * 0.9})`;
          ctx.beginPath();
          ctx.arc(st.x * W, st.y * H, st.r * (W / 1672), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // birds: flap, sometimes glide, drift right and wrap; they leave as it gets dark
      ctx.globalAlpha = Math.max(0, 1 - n * 1.5);
      ctx.fillStyle = BIRD;
      for (const b of birds) {
        b.x += b.v * dt;
        if (b.x > 1.05) b.x = -0.05;
        if (b.glide > 0) b.glide -= dt;
        else if (Math.random() < dt * 0.15) b.glide = rnd(0.8, 2);
        else b.ph += dt * 9;
        drawBird(b);
      }
      ctx.globalAlpha = 1;

      // wind-blown sand streaks along the ground, right → left (same wind as the tumbleweed)
      ctx.lineCap = "round";
      for (const g of grains) {
        g.x -= g.v * dt;
        if (g.x < -0.05) Object.assign(g, grain(), { x: 1.05 });
        const depth = (g.y - 0.6) / 0.4; // nearer = bigger, faster-looking
        ctx.strokeStyle = `rgba(250, 205, 140, ${g.a * (0.5 + depth)})`;
        ctx.lineWidth = 0.8 + depth * 1.4;
        ctx.beginPath();
        ctx.moveTo(g.x * W, g.y * H);
        ctx.lineTo(g.x * W + g.len * (0.5 + depth), g.y * H - 1);
        ctx.stroke();
      }

      // dust where the tumbleweed touches down
      const t = tumble.current;
      if (t) {
        if (t.landed && !wasLanded)
          for (let i = 0; i < 7; i++) puffs.push({ x: t.x + rnd(-t.r, t.r) * 0.6, y: t.y, r: t.r * rnd(0.15, 0.35), life: 1, vx: rnd(0.005, 0.03) });
        wasLanded = t.landed;
      }
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.life -= dt * 0.9;
        if (p.life <= 0) { puffs.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y -= 0.006 * dt; p.r *= 1 + dt * 0.8;
        ctx.fillStyle = `rgba(222, 150, 90, ${p.life * 0.35})`;
        ctx.beginPath();
        ctx.ellipse(p.x * W, p.y * H, p.r * W, p.r * W * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [tumble, night]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
