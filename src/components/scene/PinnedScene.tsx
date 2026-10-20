"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";

type Props = {
  id: string;
  /** Scroll length in viewport heights while the scene stays pinned. */
  length?: number;
  /** Children receive scroll progress 0→1 across the pinned stretch. */
  children: (progress: MotionValue<number>) => ReactNode;
  label: string;
};

/** A full-screen scene that stays pinned while the scroll plays its animation. */
export function PinnedScene({ id, length = 2, children, label }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <section ref={ref} id={id} aria-label={label} data-scene className="relative" style={{ height: `${length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">{children(scrollYProgress)}</div>
    </section>
  );
}

/** Slow camera push-in for a scene canvas. */
export function PushIn({ progress, children, to = 1.12, origin = "50% 55%" }: { progress: MotionValue<number>; children: ReactNode; to?: number; origin?: string }) {
  const scale = useTransform(progress, [0, 1], [1, to]);
  return (
    <motion.div className="absolute inset-0" style={{ scale, transformOrigin: origin }}>
      {children}
    </motion.div>
  );
}
