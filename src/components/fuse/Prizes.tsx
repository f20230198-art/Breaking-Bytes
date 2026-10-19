"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { PinnedScene } from "@/components/scene/PinnedScene";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { sceneAssets } from "@/scenes/config";
import { PRIZES, prizeAmount } from "@/data/site";

type Dir = [-1 | 1, -1 | 1];
type CaseDef = {
  /** index into PRIZES; null = no amount, just the stamp (the "more prizes" duffel) */
  prize: number | null;
  layer: string;
  /** which way the leader line runs from the cash to its number */
  to: Dir;
  /** where it touches the cash (fraction of the bbox) */
  at: [number, number];
};
type SceneId = "prizes-office" | "prizes-student";

/** Saul's office, in reveal order: 3rd, 2nd, then the big one (1st) last. */
const OFFICE: CaseDef[] = [
  { prize: 2, layer: "case-3", to: [-1, 1], at: [0.4, 0.75] }, // Saul's, by the cork board: out to the empty carpet
  { prize: 1, layer: "case-2", to: [1, 1], at: [0.65, 0.8] }, // Gus's, by the sofa
  { prize: 0, layer: "case-1", to: [-1, -1], at: [0.35, 0.3] }, // Walter's, in front of the desk: up over the desk front
];
/** The student print: Jesse's living room | Flynn's kitchen, then the duffel teasing more. */
const STUDENT: CaseDef[] = [
  { prize: 3, layer: "case-1", to: [-1, -1], at: [0.3, 0.2] }, // Jesse's: up over the pizza table
  { prize: 4, layer: "case-2", to: [1, -1], at: [0.55, 0.15] }, // Flynn's: up toward the kitchen table
  { prize: null, layer: "more", to: [1, -1], at: [0.3, 0.05] }, // the duffel: just a stamp sitting on it, no line
];
const bbox = (scene: SceneId, id: string) => sceneAssets(scene).layers.find((l) => l.id === id)!.bbox!;
const STEP = 0.22; // scroll between one suitcase and the next, within a scene
const FIRST = 0.1;
/** where the student print's carved divider sits (canvas x %); the office splits on the same line */
const SEAM = 49.5;
/** resting points: the office empty, the office paid out, the student print revealed, the students paid out */
const BEATS = [0, 0.32, 0.6, 1];

/**
 * ④ The payout, clearing out of the boom's white flash: Saul's office. The suitcases land one at a time, 3rd first,
 * 1st last, each callout counting its cash up. Then a carved line cuts the office down the middle, the halves slide
 * apart like doors, and behind them is the student print (split on the same line), where the student cuts land.
 */
export function Prizes() {
  return (
    <PinnedScene id="prizes" label="The payout" length={6} beats={BEATS}>
      {(p) => <Stage p={p} />}
    </PinnedScene>
  );
}

function Stage({ p }: { p: MotionValue<number> }) {
  const still = !!useReducedMotion();
  const op = useTransform(p, [0, 0.45], [0, 1]);
  const sp = useTransform(p, [0.58, 0.92], [0, 1]);
  const cut = useTransform(p, [0.34, 0.42], [0, 1]);
  const left = useTransform(p, [0.42, 0.58], ["0vw", "-55vw"]);
  const right = useTransform(p, [0.42, 0.58], ["0vw", "55vw"]);
  const gone = useTransform(p, [0.5, 0.58], [1, 0]); // reduced motion: a plain fade instead
  const all = PRIZES.map((z) => `${z.name} (${z.place}) AED ${prizeAmount(z.ratio)}`).join(", ");
  return (
    <div className="absolute inset-0 bg-night text-paper">
      <Scene scene="prizes-student" cases={STUDENT} p={sp} still={still} kicker="Students only" stamp="The side hustle" />

      {/* the office, as two halves that part along the seam */}
      {(["l", "r"] as const).map((side) => (
        <motion.div
          key={side}
          className="absolute inset-0"
          style={{
            clipPath: side === "l" ? `inset(0 ${100 - SEAM}% 0 0)` : `inset(0 0 0 ${SEAM}%)`,
            x: still ? 0 : side === "l" ? left : right,
            opacity: still ? gone : 1,
          }}
        >
          <Scene scene="prizes-office" cases={OFFICE} p={op} still={still} kicker="The deal is done" stamp="Paid in full">
            <OfficeLights />
          </Scene>
        </motion.div>
      ))}
      {/* the carved cut, drawn top to bottom before the halves part */}
      {!still && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 origin-top bg-ink"
          style={{ left: `${SEAM}%`, scaleY: cut, opacity: gone }}
        />
      )}

      <h2 className="sr-only">Cash prizes: {all}</h2>
    </div>
  );
}

/** One prize print: the layered art, its suitcases dropping in with their callouts, and a small stamped header. */
function Scene({ scene, cases, p, still, kicker, stamp, children }: { scene: SceneId; cases: CaseDef[]; p: MotionValue<number>; still: boolean; kicker: string; stamp: string; children?: ReactNode }) {
  const headOn = useTransform(p, [0.02, 0.05], [0, 1]);
  const headScale = useTransform(p, [0.02, 0.05, 0.06], [1.8, 0.95, 1]);
  return (
    <div className="absolute inset-0">
      <SceneCanvas scene={scene} bg="bg-night" anchorY={0.6} hide={still ? [] : cases.map((c) => c.layer)}>
        {children}
        {cases.map((c, i) => (
          <Case key={c.layer} scene={scene} p={p} at={FIRST + i * STEP} c={c} still={still} />
        ))}
      </SceneCanvas>
      {/* small header, top middle: a stamp slammed onto the scene as it opens */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-12 flex flex-col items-center"
        style={still ? undefined : { opacity: headOn, scale: headScale }}
      >
        <p className="font-type text-[11px] uppercase tracking-[0.4em] text-paper [text-shadow:1px_1px_0_var(--color-ink)]">{kicker}</p>
        <p className="mt-1 -rotate-2 border-[3px] border-ink bg-brick px-3 py-0.5 font-stencil text-xl font-bold uppercase tracking-[0.3em] text-paper shadow-[3px_3px_0_var(--color-ink)]">
          {stamp}
        </p>
      </motion.div>
    </div>
  );
}

/** Light that lives in the room: the desk lamp buzzing, and the pink neon outside, kept inside the window. Canvas %. */
function OfficeLights() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="office-neon absolute" style={{ left: 0, top: 0, width: "18%", height: "42%" }} />
      <div className="office-lamp absolute" style={{ left: "37.7%", top: "33%", width: "30%", aspectRatio: "1" }} />
    </div>
  );
}

/** A suitcase dropping onto the floor, then its callout drawing out and counting the cash up. */
function Case({ scene, p, at, c, still }: { scene: SceneId; p: MotionValue<number>; at: number; c: CaseDef; still: boolean }) {
  const layer = sceneAssets(scene).layers.find((l) => l.id === c.layer)!;
  const [x0, y0, x1, y1] = bbox(scene, c.layer);
  const drop = useTransform(p, [at, at + 0.05], [-40, 0]);
  const fade = useTransform(p, [at, at + 0.03], [0, 1]);
  return (
    <>
      {!still && (
        <motion.img src={layer.src} srcSet={layer.srcset} alt="" draggable={false} className="absolute inset-0 size-full select-none" style={{ opacity: fade, y: drop }} />
      )}
      <Callout p={p} at={at + 0.04} prize={c.prize} x={(x0 + (x1 - x0) * c.at[0]) * 100} y={(y0 + (y1 - y0) * c.at[1]) * 100} to={c.to} still={still} />
    </>
  );
}

const DIAG = 46; // px of the 45° leg
const RUN = 150; // px of the flat leg the number sits on

/**
 * Presentation-style leader line: from the cash, 45° out to an elbow, then flat, with the amount sitting on the flat leg.
 * Draws itself in once the case lands, then the stamp slams down and the amount rises in. No prize = just the stamp.
 */
function Callout({ p, at, prize: idx, x, y, to: [dx, dy], still }: { p: MotionValue<number>; at: number; prize: number | null; x: number; y: number; to: Dir; still: boolean }) {
  const prize = idx === null ? null : PRIZES[idx];
  const amount = prize ? prizeAmount(prize.ratio) : 0;
  const draw = useTransform(p, [at, at + 0.05], [0, 1]);
  const show = useTransform(p, [at + 0.04, at + 0.07], [0, 1]);
  // the stamp slams down from big and tilted; the number punches up from under the line
  const stampScale = useTransform(p, [at + 0.03, at + 0.055, at + 0.065], [2.2, 0.92, 1]);
  const stampSpin = useTransform(p, [at + 0.03, at + 0.055], [dx * -14, 0]);
  const stampOn = useTransform(p, [at + 0.03, at + 0.045], [0, 1]);
  const rise = useTransform(p, [at + 0.04, at + 0.07], ["110%", "0%"]);
  const W = DIAG + RUN;
  // svg box sits with the cash point in one corner; the line runs away from it
  const tx = dx < 0 ? W : 0, ty = dy < 0 ? DIAG : 0;
  const ex = tx + dx * DIAG, ey = ty + dy * DIAG;
  const big = idx === 0;
  if (!prize) {
    // a bare stamp slapped onto the bag, no leader line
    return (
      <motion.p
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rotate-3 whitespace-nowrap border-2 border-ink bg-brick px-2 py-0.5 font-stencil text-xs font-bold uppercase tracking-[0.25em] text-paper shadow-[2px_2px_0_var(--color-ink)]"
        style={{ left: `${x}%`, top: `${y}%`, ...(still ? {} : { scale: stampScale, opacity: stampOn }) }}
      >
        More on the night
      </motion.p>
    );
  }
  return (
    <div className="pointer-events-none absolute" style={{ left: `${x}%`, top: `${y}%` }}>
      <svg
        aria-hidden
        width={W + 8}
        height={DIAG + 8}
        viewBox={`-4 -4 ${W + 8} ${DIAG + 8}`}
        className="absolute overflow-visible drop-shadow-[2px_2px_0_var(--color-ink)]"
        style={{ [dx < 0 ? "right" : "left"]: -4, [dy < 0 ? "bottom" : "top"]: -4 }}
      >
        <motion.path d={`M${tx} ${ty} L${ex} ${ey} H${ex + dx * RUN}`} fill="none" stroke="var(--color-paper)" strokeWidth={2.5} style={{ pathLength: still ? 1 : draw }} />
        <motion.circle cx={tx} cy={ty} r={4.5} fill="var(--color-paper)" style={{ opacity: still ? 1 : draw }} />
      </svg>
      {/* the number rides on the flat leg, flush with its far end */}
      <motion.div
        className="absolute whitespace-nowrap text-paper"
        style={{
          opacity: still ? 1 : show,
          top: dy * DIAG,
          [dx < 0 ? "right" : "left"]: DIAG + 6,
          translateY: "-100%",
          width: RUN - 6,
          textAlign: dx < 0 ? "left" : "right",
        }}
      >
        {/* stencilled stamp, like the crate markings */}
        <motion.p
          style={still ? undefined : { scale: stampScale, rotate: stampSpin, opacity: stampOn }}
          className={`mb-1.5 inline-block border-2 border-ink bg-brick px-2 py-0.5 font-stencil text-xs font-bold uppercase tracking-[0.25em] text-paper shadow-[2px_2px_0_var(--color-ink)] ${dx < 0 ? "-rotate-2" : "rotate-2"}`}
        >
          {prize.name}
        </motion.p>
        <div className="pb-[0.1em] [clip-path:inset(0_-100vw)]">
          <motion.p style={still ? undefined : { y: rise }} className={`font-display leading-none tabular-nums [text-shadow:0.06em_0.06em_0_var(--color-ink)] ${big ? "text-5xl" : "text-4xl"}`}>
            <span className="mr-1 font-stencil text-[0.4em] font-bold">AED</span>
            {amount.toLocaleString("en-US")}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
