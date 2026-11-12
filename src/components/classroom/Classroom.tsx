"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { TornEdge } from "@/components/fuse/FuseTimeline";
import { PinnedScene } from "@/components/scene/PinnedScene";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { RULES } from "@/data/site";
import { useSite } from "@/components/site/SiteContext";

// the two chalkboards in the art, as canvas % boxes [left, top, width, height] (writing kept clear of the flasks below)
const MAIN = [31.5, 28, 42.5, 24];
const SIDE = [78.2, 29, 11.6, 23.5];
const box = ([l, t, w, h]: number[]) => ({ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`, containerType: "inline-size" as const });

/**
 * ⑤ The classroom: slides up over the finished student print (torn top edge, like the fuse over the lab), then the
 * teacher's lesson chalks itself onto the boards as you scroll: the domains (Admin → Problems → Domains) as element tiles on the main board, the
 * rules as a numbered list on the side board.
 */
export function Classroom() {
  return (
    // -mt-[100vh]: slides up over the prize office's last (held) screen
    <div className="relative z-10 -mt-[100vh]">
      <TornEdge fill="var(--color-ink)" />
      <PinnedScene id="classroom" label="Tracks and rules" length={3}>
        {(p) => <Stage p={p} />}
      </PinnedScene>
    </div>
  );
}

function Stage({ p }: { p: MotionValue<number> }) {
  const still = !!useReducedMotion();
  const TRACKS = useSite().domains;
  const big = TRACKS.length <= 3;
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
          {/* up to 3 domains fill the board in one row of big tiles; 4–6 need two rows, so they shrink to fit */}
          <div className={`mx-auto my-auto grid grid-cols-3 ${big ? "gap-x-[4cqw]" : "gap-x-[4cqw] gap-y-[2cqw]"}`}>
            {TRACKS.map((t, i) => (
              <Chalk key={t.number} p={p} at={tileAt(i)} still={still}>
                <div className={`relative flex flex-col items-center justify-center border-paper/85 ${big ? "h-[17cqw] w-[26cqw] border-[0.45cqw] px-[1.5cqw]" : "h-[11cqw] w-[17cqw] border-[0.35cqw]"}`}>
                  <span className={`absolute left-[7%] top-[4%] font-type ${big ? "text-[2cqw]" : "text-[1.4cqw]"}`}>{t.number}</span>
                  <span className={`font-display leading-none ${big ? "text-[7cqw]" : "text-[4.8cqw]"}`}>{t.symbol}</span>
                  <span className={`text-center font-type uppercase leading-tight tracking-wider ${big ? "mt-[1cqw] text-[2.6cqw]" : "mt-[0.6cqw] text-[1.6cqw]"}`}>{t.name}</span>
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
