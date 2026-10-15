"use client";

import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import { useState } from "react";

const SCENES = [
  ["desert", "The Desert"],
  ["superlab", "The Superlab"],
  ["classroom", "The Classroom"],
  ["money", "The Money Pile"],
  ["carwash", "The Car Wash"],
  ["pollos", "Los Pollos"],
  ["saul", "Better Call Us"],
  ["night", "Let's Cook"],
] as const;

/** Global scroll progress as a flask filling to 99.1%. Doubles as scene navigation. */
export function PurityMeter() {
  const { scrollYProgress } = useScroll();
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const height = useTransform(fill, (v) => `${v * 100}%`);
  const [pct, setPct] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setPct(Math.min(99.1, v * 99.1)));

  return (
    <nav aria-label="Scenes" className="fixed bottom-5 right-4 z-50 flex items-end gap-2 md:bottom-8 md:right-6">
      <ol className="mb-1 hidden flex-col gap-1.5 md:flex">
        {SCENES.map(([id, name]) => (
          <li key={id}>
            <a href={`#${id}`} className="group flex items-center justify-end gap-2 font-type text-[11px] text-paper/60 hover:text-paper focus-visible:text-paper">
              <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{name}</span>
              <span className="h-px w-3 bg-current" />
            </a>
          </li>
        ))}
      </ol>
      <div className="flex flex-col items-center">
        <div className="relative h-36 w-7 overflow-hidden rounded-b-full border-2 border-paper bg-ink/70">
          <motion.div style={{ height }} className="absolute bottom-0 w-full bg-crystal shadow-[0_0_14px_rgba(19,200,232,0.8)]" />
        </div>
        <span className="mt-1 font-type text-[11px] tabular-nums text-crystal">{pct.toFixed(1)}%</span>
      </div>
    </nav>
  );
}
