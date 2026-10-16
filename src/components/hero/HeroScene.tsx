"use client";
/* eslint-disable @next/next/no-img-element -- the shimmer strip must stack pixel-exact on the scene layers */

import { AnimatePresence, motion, useMotionValueEvent, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { PeriodicTitle } from "@/components/comic/PeriodicTitle";
import { PinnedScene } from "@/components/scene/PinnedScene";
import { SceneCanvas, bboxStyle } from "@/components/scene/SceneCanvas";
import { StampButton } from "@/components/ui/StampButton";
import { EVENT, RULES, SCHEDULE } from "@/data/site";
import { DEPTHS, sceneAssets } from "@/scenes/config";
import { DesertFx, type TumbleState } from "./DesertFx";

const hero = sceneAssets("hero");
const layer = (id: string) => hero.layers.find((l) => l.id === id)!;
const rv = layer("rv").bbox!;
const [twX0, twY0, twX1, twY1] = layer("tumbleweed").bbox!;
const twCx = (twX0 + twX1) / 2, twCy = (twY0 + twY1) / 2, twR = (twX1 - twX0) / 2;

// tumbleweed run, as offsets from where it sits in the art (fractions of the canvas width)
const ROLL_FROM = 0.62, ROLL_TO = -0.3, ROLL_SPEED = 0.075, ROLL_REST = 2.5;
const LENS = 92; // x-ray hexagon radius, px
const EASE = "cubic-bezier(.16,1,.3,1)";
const SUN_DROP = 13; // % of canvas height the sky slides down at full night (sun sinks behind the mesas)

// chairs + mask are pulled toward the viewer: scaled around their feet, then nudged down/right
const [c0, c1, c2, c3] = layer("chairs").bbox!;
const CH = { scale: 1.26, dx: 0.045, dy: 0.13, ox: (c0 + c2) / 2, oy: c3 };
const placeX = (x: number) => CH.ox + (x - CH.ox) * CH.scale + CH.dx;
const placeY = (y: number) => CH.oy + (y - CH.oy) * CH.scale + CH.dy;
const split = c0 + (c2 - c0) * 0.72; // chairs on the left, gas mask on the right of the layer
const chairBox = [placeX(c0), placeY(c1), placeX(split), placeY(c3)];
const maskBox = [placeX(split), placeY(c1 + (c3 - c1) * 0.5), placeX(c2), placeY(c3)];

// regular hexagon (flat top) around the cursor; radius animates through the registered --lr property
const HEX = [0, 60, 120, 180, 240, 300].map((a) => {
  const r = (a * Math.PI) / 180;
  return `calc(var(--lx) + var(--lr) * ${Math.cos(r).toFixed(4)}) calc(var(--ly) + var(--lr) * ${Math.sin(r).toFixed(4)})`;
});

/** ① The desert at dusk: hero. Scroll sets the sun; over the RV the cursor becomes a benzene-ring x-ray lens. */
export function HeroScene() {
  return (
    <PinnedScene id="desert" label="The desert" length={2.4}>
      {(p) => <Inner progress={p} />}
    </PinnedScene>
  );
}

function Inner({ progress }: { progress: MotionValue<number> }) {
  const tumble = useRef<TumbleState | null>(null);
  const nightRef = useRef(0);
  const [night, setNight] = useState(0);
  const [roll, setRoll] = useState({ x: 0, y: 0, rot: 0 });
  const [lens, setLens] = useState({ x: 50, y: 50, on: false, full: false });
  const [chairTip, setChairTip] = useState(false);
  const [maskOpen, setMaskOpen] = useState(false);

  useMotionValueEvent(progress, "change", (v) => {
    const n = Math.min(1, Math.max(0, (v - 0.05) / 0.8));
    nightRef.current = n;
    setNight(n);
  });

  useEffect(() => {
    if (!maskOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMaskOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maskOpen]);

  // roll the tumbleweed across the desert: spin matches distance travelled, small hops, wind gusts
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, last = performance.now(), dx = ROLL_FROM, rest = 0, t = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now; t += dt;
      if (rest > 0) rest -= dt;
      else {
        dx -= ROLL_SPEED * (1 + 0.45 * Math.sin(t * 0.7)) * dt;
        if (dx < ROLL_TO) { dx = ROLL_FROM; rest = ROLL_REST; }
      }
      const hop = Math.abs(Math.sin((ROLL_FROM - dx) / (twR * 2.6))); // 0 = touching the ground
      tumble.current = rest > 0 ? null : { x: twCx + dx, y: twY1, r: twR, landed: hop < 0.12 };
      setRoll({ x: dx * 100, y: -hop * 1.4, rot: (dx / twR) * (180 / Math.PI) });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const moveLens = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const b = e.currentTarget.parentElement!.getBoundingClientRect();
    setLens({ x: ((e.clientX - b.left) / b.width) * 100, y: ((e.clientY - b.top) / b.height) * 100, on: true, full: false });
  };

  const showRing = lens.on && !lens.full;
  const par = (id: string, axis: "x" | "y") => `var(--m${axis}, 0) * ${-(DEPTHS.hero[id] ?? 0.3) * (axis === "x" ? 18 : 10)}px`;

  return (
    <>
      <SceneCanvas
        scene="hero"
        priority
        overscan={1.02}
        bg="bg-dusk"
        layerStyle={{
          sky: { transform: `translate3d(calc(${par("sky", "x")}), calc(${par("sky", "y")} + ${night * SUN_DROP}%), 0)` },
          "rv-cutaway": {
            ["--lx" as string]: `${lens.x}%`,
            ["--ly" as string]: `${lens.y}%`,
            ["--lr" as string]: lens.full ? "2400px" : lens.on ? `${LENS}px` : "0px",
            transition: `--lr 420ms ${EASE}`,
            clipPath: `polygon(${HEX.join(", ")})`,
          },
          tumbleweed: {
            transformOrigin: `${twCx * 100}% ${twCy * 100}%`,
            transform: `translate3d(${roll.x}%, ${roll.y}%, 0) rotate(${roll.rot}deg)`,
          },
          chairs: {
            transformOrigin: `${CH.ox * 100}% ${CH.oy * 100}%`,
            transform: `translate3d(calc(${par("chairs", "x")} + ${CH.dx * 100}%), calc(${par("chairs", "y")} + ${CH.dy * 100}%), 0) scale(${CH.scale})`,
          },
        }}
      >
        {/* heat shimmer: a wobbling copy of the horizon band, right of the RV; it cools off at night */}
        {(
          <img
            src={layer("mesas").src}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full select-none motion-reduce:hidden"
            style={{
              clipPath: `inset(47% 0 ${100 - 61}% ${rv[2] * 100 + 1}%)`,
              filter: "url(#heat)",
              opacity: 1 - night,
              transform: `translate3d(calc(${par("mesas", "x")}), calc(${par("mesas", "y")}), 0)`,
            }}
          />
        )}
        {/* night falls: cool the whole scene, the RV's doorway keeps its glow through the lens */}
        <div className="pointer-events-none absolute inset-0 bg-night mix-blend-multiply" style={{ opacity: night * 0.75 }} />
        <DesertFx tumble={tumble} night={nightRef} />

        {/* lens outline: a benzene ring that follows the cursor over the RV */}
        <svg
          aria-hidden
          viewBox="-100 -100 200 200"
          className="pointer-events-none absolute overflow-visible"
          style={{
            left: `${lens.x}%`,
            top: `${lens.y}%`,
            width: LENS * 2,
            height: LENS * 2,
            translate: "-50% -50%",
            scale: showRing ? 1 : 0,
            opacity: showRing ? 1 : 0,
            transition: `scale 420ms ${EASE}, opacity 200ms`,
          }}
        >
          <polygon points="100,0 50,86.6 -50,86.6 -100,0 -50,-86.6 50,-86.6" fill="none" className="stroke-ink" strokeWidth="9" strokeLinejoin="round" />
          <polygon points="100,0 50,86.6 -50,86.6 -100,0 -50,-86.6 50,-86.6" fill="none" className="stroke-paper" strokeWidth="4" strokeLinejoin="round" />
          <g className="stroke-crystal" strokeWidth="3.5" strokeLinecap="round">
            <line x1="82" y1="0" x2="41" y2="71" />
            <line x1="-41" y1="71" x2="-82" y2="0" />
            <line x1="-41" y1="-71" x2="41" y2="-71" />
          </g>
        </svg>

        <button
          type="button"
          aria-label={lens.full ? "Close the RV" : "Look inside the RV"}
          aria-pressed={lens.full}
          onPointerMove={moveLens}
          onPointerLeave={() => setLens((l) => ({ ...l, on: false }))}
          onClick={(e) => {
            if ((e.nativeEvent as PointerEvent).pointerType === "mouse") return;
            setLens((l) => ({ x: ((rv[0] + rv[2]) / 2) * 100, y: ((rv[1] + rv[3]) / 2) * 100, on: false, full: !l.full }));
          }}
          className="absolute cursor-none focus-visible:outline-2 focus-visible:outline-crystal"
          style={bboxStyle(rv)}
        />

        {/* chairs: hover for the crew rule */}
        <div
          className="absolute"
          style={bboxStyle(chairBox)}
          onPointerEnter={() => setChairTip(true)}
          onPointerLeave={() => setChairTip(false)}
          onClick={() => setChairTip((v) => !v)}
        >
          <AnimatePresence>
            {chairTip && (
              <motion.div
                initial={{ opacity: 0, y: 10, rotate: -4 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-max -translate-x-1/2 border-2 border-ink bg-paper px-3 py-2 font-type text-sm text-ink print-shadow"
              >
                <span className="block font-display text-base uppercase">Pull up a chair</span>
                {RULES[0]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* gas mask: click for the classified file */}
        <button
          type="button"
          aria-label="Open the classified file"
          aria-expanded={maskOpen}
          onClick={() => setMaskOpen((v) => !v)}
          className="group absolute cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-crystal"
          style={bboxStyle(maskBox)}
        >
          <span className="absolute inset-0 rounded-full bg-crystal/0 shadow-[0_0_0_0_transparent] transition-[background-color,box-shadow] duration-300 group-hover:bg-crystal/15 group-hover:shadow-[0_0_28px_6px_rgba(19,200,232,0.45)]" />
        </button>
        <AnimatePresence>
          {maskOpen && (
            <motion.div
              role="dialog"
              aria-label="Classified"
              initial={{ opacity: 0, scale: 0.92, rotate: 3 }}
              animate={{ opacity: 1, scale: 1, rotate: 1.5 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-[min(22rem,80vw)] border-2 border-ink bg-paper p-4 font-type text-sm text-ink print-shadow"
              style={{ left: `${chairBox[0] * 100}%`, bottom: `${(1 - maskBox[1]) * 100 + 1}%` }}
            >
              <p className="mb-2 inline-block -rotate-3 border-2 border-siren px-2 font-display text-lg uppercase tracking-widest text-siren">Classified</p>
              <p className="font-display text-base uppercase">Problem statements</p>
              <p className="mt-1">Sealed until {SCHEDULE[1].time} on day one. {SCHEDULE[1].note}</p>
              <button type="button" onClick={() => setMaskOpen(false)} className="mt-3 text-xs uppercase tracking-widest underline underline-offset-4">
                Close file
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </SceneCanvas>

      <svg aria-hidden className="absolute size-0">
        <filter id="heat" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.06" numOctaves="1" seed="3" result="n">
            <animate attributeName="baseFrequency" dur="7s" values="0.004 0.06;0.004 0.075;0.004 0.06" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="pointer-events-none absolute left-[50vw] right-[5vw] top-[15vh] flex flex-col items-start"
      >
        <p className="mb-5 font-type text-[clamp(0.7rem,0.9vw,0.95rem)] uppercase tracking-[0.3em] text-paper [text-shadow:1px_1px_0_#111]">
          A 24-hour hackathon · {EVENT.venue}
        </p>
        <PeriodicTitle className="text-[clamp(3rem,7.6vw,9.5rem)]" />
        <p className="mt-6 bg-ink px-3 py-1.5 font-display text-[clamp(0.75rem,1vw,1.1rem)] uppercase tracking-[0.35em] text-hazmat">
          {EVENT.tagline}
        </p>
        <div className="pointer-events-auto mt-8">
          <StampButton href="/dashboard">Enter the lab</StampButton>
        </div>
      </motion.div>

      <p className="pointer-events-none absolute bottom-3 right-4 font-type text-[10px] text-paper/60">
        Fan-made parody · not affiliated with AMC or Sony Pictures Television
      </p>
    </>
  );
}
