"use client";

import Lenis from "lenis";
import { useEffect } from "react";

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Scroll positions (px) of every pinned scene's beats: [start of section's travel + beat × travel], grouped per scene. */
function beatGroups() {
  return [...document.querySelectorAll<HTMLElement>("[data-beats]")].map((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    return el.dataset.beats!.split(",").map((b) => Math.round(top + Number(b) * travel));
  });
}

/**
 * Lenis smooth scrolling (skipped for reduced motion), plus scene-by-scene stepping: inside a pinned scene's beats,
 * one scroll gesture plays the scene to its next beat on its own and rests there, so each beat lands whole instead of
 * scrubbing by however hard the wheel was flicked. Outside the beats (the fuse timeline), scrolling is free.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let busy = false;
    let quietUntil = 0;
    const lenis: Lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.9,
      virtualScroll: ({ deltaY }) => {
        if (busy) return false;
        const dir = Math.sign(deltaY);
        if (!dir) return true;
        // trackpad / wheel momentum after a step: swallow it, so one flick = one beat
        if (performance.now() < quietUntil) return false;
        const y = lenis.scroll;
        for (const beats of beatGroups()) {
          const first = beats[0], last = beats[beats.length - 1];
          const inside = dir > 0 ? y >= first - 2 && y < last - 2 : y > first + 2 && y <= last + 2;
          if (!inside) continue;
          const to = dir > 0 ? beats.find((b) => b > y + 2)! : [...beats].reverse().find((b) => b < y - 2)!;
          const dist = Math.abs(to - y) / window.innerHeight;
          busy = true;
          lenis.scrollTo(to, {
            duration: Math.min(2.6, Math.max(1.1, dist * 1.1)),
            easing: easeInOut,
            lock: true,
            onComplete: () => {
              busy = false;
              quietUntil = performance.now() + 450;
            },
          });
          return false;
        }
        return true;
      },
    });
    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
  return null;
}
