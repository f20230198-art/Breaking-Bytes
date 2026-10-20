"use client";

import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { FALL_FROM, HeroStage, fallAt, fallScale, type LensPx } from "@/components/hero/HeroScene";
import { LabStage } from "@/components/lab/LabScene";
import { PinnedScene } from "@/components/scene/PinnedScene";

// scroll lengths, in viewport heights of pinned travel
const HERO_PIN = 1.1; // RV leaves, night falls, title lifts
const FALL_PIN = 2; // the fall into the lens: its own long stretch, so it never feels rushed
const LAB_PIN = 1; // a hold on the lab before the fuse timeline scrolls in below
const OUTRO_PIN = 1; // the lab goes dark while the timeline slides up over it (it overlaps this stretch)
const TOTAL = HERO_PIN + FALL_PIN + LAB_PIN + OUTRO_PIN;
const A = HERO_PIN / TOTAL; // end of the desert phase
const B = (HERO_PIN + FALL_PIN) / TOTAL; // the lab fills the screen
const C = (HERO_PIN + FALL_PIN + LAB_PIN) / TOTAL; // the lights start to go
const ART_RATIO = 3344 / 1882;

const c01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

/**
 * An uneven, boiling blob (like a gas cloud leaking out of the lens) as a clip-path, in viewport pixels.
 * `wobble` 0 = a perfect circle, 1 = fully ragged; `t` makes the edge churn as it grows.
 */
function blobPath(cx: number, cy: number, R: number, wobble: number, t: number) {
  const pts: string[] = [];
  const N = 96; // plenty for a smooth edge at screen size; the path is rebuilt and re-rasterised every frame
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k =
      0.14 * Math.sin(3 * a + t * 1.1) +
      0.1 * Math.sin(5 * a - t * 1.4 + 1.7) +
      0.07 * Math.sin(8 * a + t * 0.9 + 0.6) +
      0.045 * Math.sin(13 * a - t * 1.9 + 2.3) +
      0.025 * Math.sin(21 * a + t * 2.6 + 4.1);
    const r = R * (1 + wobble * k);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `path("M${pts.join(" L")} Z")`;
}

/**
 * ① the desert and ② the superlab share one pinned stage, so the hand-off needs no scroll seam: the camera falls into
 * the gas mask's lens, and the lab boils out of the glass until it fills the screen.
 */
export function Story() {
  return (
    <PinnedScene id="desert" label="The desert and the superlab" length={TOTAL + 1}>
      {(p) => <Stage progress={p} />}
    </PinnedScene>
  );
}

function Stage({ progress }: { progress: MotionValue<number> }) {
  // the hero's own 0..1 timeline: desert phase up to FALL_FROM, then the fall, then it stays at 1
  const heroP = useTransform(progress, [0, A, B], [0, FALL_FROM, 1], { clamp: true });
  const labP = useTransform(progress, [B, C], [0, 1], { clamp: true });
  const lightsOut = useTransform(progress, [C, 1], [0, 0.9], { clamp: true });
  const [fall, setFall] = useState(() => fallAt(heroP.get()));
  const [lens, setLens] = useState<LensPx | null>(null); // measured by the hero: where the lens is on screen
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  useMotionValueEvent(heroP, "change", (v) => {
    setFall(fallAt(v));
  });
  const onLens = useCallback((l: LensPx) => setLens(l), []);

  useEffect(() => {
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const covered = fall >= 1; // the lab fills the screen: the desert underneath can stop rendering
  const peeking = fall > 0 && lens !== null && vp !== null;

  let clip = "none";
  let rim = "none";
  let grow = 0;
  let filled = false;
  if (peeking && !covered) {
    const scale = fallScale(fall);
    const open = smooth(c01(fall / 0.3)); // the lab fills the lens ring first...
    grow = smooth(c01((fall - 0.5) / 0.5)); // ...then boils out past it
    const coverW = Math.max(vp.w, vp.h * ART_RATIO);
    const R = lens.r * scale * 0.85 * open + 1.9 * coverW * grow;
    const wobble = smooth(c01((fall - 0.12) / 0.4));
    const t = fall * 7;
    // once even the blob's deepest dent (the wobble terms sum to 0.38) clears every corner of the screen, the lab
    // already fills it: drop the clip and the zoomed desert instead of redrawing both, unseen, for the rest of the fall
    const far = Math.max(Math.hypot(lens.x, lens.y), Math.hypot(vp.w - lens.x, lens.y), Math.hypot(lens.x, vp.h - lens.y), Math.hypot(vp.w - lens.x, vp.h - lens.y));
    filled = R * (1 - 0.38 * wobble) > far;
    if (!filled) {
      clip = blobPath(lens.x, lens.y, R, wobble, t);
      rim = blobPath(lens.x, lens.y, R + 6 + 26 * open, wobble, t + 0.25);
    }
  }
  const gone = covered || filled; // the desert is fully hidden behind the lab
  const reveal = smooth(c01((fall - 0.12) / 0.4)); // the lab's moving parts fade in as the lens opens
  const dark = smooth(c01(fall / 0.7)); // the desert sinks into shadow toward the lens as you fall

  return (
    <>
      {!gone && <HeroStage progress={heroP} onLens={onLens} />}
      {peeking && !gone && lens && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: dark,
            background: `radial-gradient(circle at ${lens.x}px ${lens.y}px, transparent 0, rgba(17,17,17,0.45) 18%, rgba(17,17,17,0.92) 60%, var(--color-ink) 100%)`,
          }}
        />
      )}
      {/* the lab is always mounted (hidden until the lens opens), so its art is fetched and decoded in idle time
          long before the fall, and the lens never opens on an undecoded room */}
      {(
        <>
          {/* a yellow toxic-vapour rim around the opening */}
          {peeking && !gone && grow < 0.55 && (
            <div aria-hidden className="absolute inset-0" style={{ filter: "blur(10px)", opacity: 0.9 * (1 - grow * 0.75) }}>
              <div className="absolute inset-0 bg-hazmat" style={{ clipPath: rim }} />
            </div>
          )}
          <div className="absolute inset-0 overflow-hidden" style={{ display: peeking ? "block" : "none", clipPath: clip }}>
            <LabStage progress={labP} reveal={reveal} />
          </div>
        </>
      )}
      {/* the lights cut out as the next print is laid over the lab */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: lightsOut }} />
    </>
  );
}
