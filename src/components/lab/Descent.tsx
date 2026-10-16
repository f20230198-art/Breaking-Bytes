"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const W = 1600;
const H = 900;

/** Wavy horizontal edge across the whole width, as a polyline (deterministic, so server and client agree). */
const edge = (y: number, amp: number, freq: number, phase: number) => {
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 40) pts.push(`${x} ${(y + amp * Math.sin(x * freq + phase)).toFixed(1)}`);
  return pts;
};
const edgePath = (y: number, amp: number, freq: number, phase: number) => `M${edge(y, amp, freq, phase).join(" L")}`;
const fillPath = (y: number, amp: number, freq: number, phase: number) => `${edgePath(y, amp, freq, phase)} L${W} ${H} L0 ${H} Z`;

// strata back to front: [top y, wave amp, wave freq, phase, fill]
const INK = "var(--color-ink)";
const mix = (a: string, pct: number) => `color-mix(in srgb, var(${a}) ${pct}%, var(--color-ink))`;
const STRATA: [number, number, number, number, string][] = [
  [0, 10, 0.006, 0.4, "var(--color-rust)"],
  [190, 16, 0.005, 1.7, "var(--color-brick)"],
  [380, 14, 0.007, 3.1, mix("--color-brick", 60)],
  [560, 18, 0.0045, 0.9, mix("--color-brick", 30)],
  [730, 12, 0.006, 2.4, "var(--color-ink-soft)"],
];

// a rounded rock blob, drawn at the origin and placed with a transform
const ROCK = "M0 40 C0 8 44 -6 78 4 C118 10 138 34 124 54 C100 76 26 76 0 40 Z";
const ROCKS: [number, number, number][] = [
  [180, 235, 1.2],
  [1190, 120, 0.8],
  [1310, 470, 1],
  [420, 640, 0.9],
];

/**
 * Between the desert and the lab: the camera falls through the earth. Flat strata, rocks and a buried pipe slide past
 * at different speeds, then a hatch glows blue and the screen drops into the lab's dark ceiling. All drawn in code.
 */
export function Descent() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rocksY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [110, -110]);
  const pipeY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [50, -50]);
  const hatchY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-10, -70]);
  const glow = useTransform(scrollYProgress, [0.35, 0.8], [0.15, 1]);

  return (
    <section ref={ref} aria-hidden className="relative h-[95vh] overflow-hidden bg-ink">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {STRATA.map(([y, a, f, p, fill], i) => (
          <g key={i}>
            <path d={fillPath(y, a, f, p)} style={{ fill }} />
            {i > 0 && <path d={edgePath(y, a, f, p)} fill="none" strokeWidth={7} strokeLinejoin="round" style={{ stroke: INK }} />}
          </g>
        ))}

        <motion.g style={{ y: rocksY }}>
          {ROCKS.map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
              <path d={ROCK} strokeWidth={6 / s} strokeLinejoin="round" style={{ fill: "var(--color-paper-dim)", stroke: INK }} />
              <path d="M12 40 C22 22 50 14 74 18" fill="none" strokeWidth={5 / s} strokeLinecap="round" style={{ stroke: "var(--color-paper)" }} />
            </g>
          ))}
        </motion.g>

        {/* a buried pipe with collars */}
        <motion.g style={{ y: pipeY }}>
          <rect x={-10} y={455} width={W + 20} height={74} strokeWidth={6} style={{ fill: INK, stroke: INK }} />
          <rect x={-10} y={463} width={W + 20} height={7} opacity={0.7} style={{ fill: "var(--color-paper-dim)" }} />
          {[250, 800, 1350].map((x) => (
            <rect key={x} x={x} y={443} width={36} height={98} rx={4} strokeWidth={6} style={{ fill: "var(--color-brick)", stroke: INK }} />
          ))}
        </motion.g>

        {/* the hatch, with blue light leaking from underneath */}
        <motion.g style={{ y: hatchY }}>
          <motion.ellipse cx={800} cy={770} rx={340} ry={60} style={{ fill: "var(--color-crystal)", opacity: glow, filter: "blur(28px)" }} />
          <rect x={620} y={660} width={360} height={110} rx={6} strokeWidth={7} style={{ fill: "var(--color-ink-soft)", stroke: INK }} />
          <rect x={720} y={698} width={160} height={26} rx={6} strokeWidth={5} style={{ fill: INK, stroke: "var(--color-paper-dim)" }} />
          <motion.rect x={640} y={770} width={320} height={10} rx={4} style={{ fill: "var(--color-crystal)", opacity: glow }} />
        </motion.g>
      </svg>

      {/* same night tint the hero ends on, so the desert hands off to the earth without a seam */}
      <div className="absolute inset-0 bg-night mix-blend-multiply opacity-40" />
      {/* and the earth falls away into the lab's dark ceiling */}
      <div className="absolute inset-x-0 top-0 h-[10%] bg-gradient-to-b from-ink/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-b from-transparent to-ink" />
    </section>
  );
}
