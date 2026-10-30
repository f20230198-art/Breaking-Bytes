"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { TornEdge } from "@/components/fuse/FuseTimeline";
import { PinnedScene } from "@/components/scene/PinnedScene";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { RULES, TRACKS } from "@/data/site";

// the two chalkboards in the art, as canvas % boxes [left, top, width, height] (writing kept clear of the flasks below)
const MAIN = [31.5, 28, 42.5, 24];
const SIDE = [78.2, 29, 11.6, 23.5];
const box = ([l, t, w, h]: number[]) => ({ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`, containerType: "inline-size" as const });

/**
 * ⑤ The classroom: slides up over the finished student print (torn top edge, like the fuse over the lab), then the
 * teacher's lesson chalks itself onto the boards as you scroll: the tracks as element tiles on the main board, the
 * rules as a numbered list on the side board.
 */
export function Classroom() {
  return (
    // no -mt-[100vh] overlap while the prizes are hidden: it follows the fuse directly, arriving as the blast's flash clears
    <div className="relative z-10">
      <TornEdge fill="var(--color-ink)" />
      <PinnedScene id="classroom" label="Tracks and rules" length={3}>
        {(p) => <Stage p={p} />}
      </PinnedScene>
    </div>
  );
}

function Stage({ p }: { p: MotionValue<number> }) {
  const still = !!useReducedMotion();
  const tileAt = (i: number) => 0.12 + i * 0.055;
  const ruleAt = (i: number) => 0.5 + i * 0.08;
  // phones: the main board is wider than the screen, so the camera follows the chalk across it, then on to the rules
  const pan = useTransform(p, [0, 0.12, 0.42, 0.5], [0.4, 0.4, 0.66, 0.84]);
  return (
    <motion.div className="absolute inset-0 bg-ink" style={{ ["--pan" as string]: pan }}>
      {/* asset classroom: back (empty room, blank boards), teacher, desks (foreground) */}
      <SceneCanvas scene="classroom" anchorY={0.45} className="portrait:[--focus:var(--pan)]">
        {/* the bunsen burner's little blue flame */}
        <span aria-hidden className="class-flame pointer-events-none absolute" style={{ left: "60.4%", top: "57.4%", width: "0.9%", aspectRatio: "1 / 2" }} />

        <div className="absolute flex flex-col text-paper" style={box(MAIN)}>
          <Chalk p={p} at={0.04} still={still} className="font-type text-[3.4cqw] leading-none tracking-wide">
            Today&apos;s lesson: pick your poison
          </Chalk>
          {/* one row of element tiles, centred in the board under the title */}
          <div className="mx-auto my-auto grid grid-cols-3 gap-x-[4cqw] gap-y-[2cqw]">
            {TRACKS.map((t, i) => (
              <Chalk key={t.number} p={p} at={tileAt(i)} still={still}>
                <div className="relative flex h-[11cqw] w-[17cqw] flex-col items-center justify-center border-[0.35cqw] border-paper/85">
                  <span className="absolute left-[7%] top-[4%] font-type text-[1.4cqw]">{t.number}</span>
                  <span className="font-display text-[4.8cqw] leading-none">{t.symbol}</span>
                  <span className="mt-[0.6cqw] text-center font-type text-[1.6cqw] uppercase leading-tight tracking-wider">{t.name}</span>
                </div>
              </Chalk>
            ))}
          </div>
        </div>

        <div className="absolute text-paper" style={box(SIDE)}>
          <Chalk p={p} at={0.44} still={still} className="font-type text-[9cqw] leading-none tracking-wide underline decoration-[0.8cqw] underline-offset-[3cqw]">
            Lab rules
          </Chalk>
          <ol className="mt-[9cqw] space-y-[5cqw]">
            {RULES.map((r, i) => (
              <li key={r}>
                <Chalk p={p} at={ruleAt(i)} still={still} className="font-type text-[6.4cqw] leading-snug">
                  {i + 1}. {r}
                </Chalk>
              </li>
            ))}
          </ol>
        </div>
      </SceneCanvas>
      <h2 className="sr-only">Tracks and rules</h2>
    </motion.div>
  );
}

/** Writing chalked on left to right as the scroll reaches `at`. */
function Chalk({ p, at, still, className = "", children }: { p: MotionValue<number>; at: number; still: boolean; className?: string; children: ReactNode }) {
  const wipe = useTransform(p, [at, at + 0.08], [100, 0]);
  const clip = useTransform(wipe, (w) => `inset(-20% ${w}% -20% 0)`);
  return (
    <motion.div className={`[text-shadow:0_0_0.3cqw_color-mix(in_srgb,var(--color-paper)_35%,transparent)] ${className}`} style={still ? undefined : { clipPath: clip }}>
      {children}
    </motion.div>
  );
}
