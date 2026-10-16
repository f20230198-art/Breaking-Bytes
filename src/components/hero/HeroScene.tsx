"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { PeriodicTitle } from "@/components/comic/PeriodicTitle";
import { SceneCanvas, bboxStyle } from "@/components/scene/SceneCanvas";
import { StampButton } from "@/components/ui/StampButton";
import { EVENT } from "@/data/site";
import { DEPTHS, sceneAssets } from "@/scenes/config";
import { DesertFx, type TumbleState } from "./DesertFx";

const hero = sceneAssets("hero");
const box = (id: string) => hero.layers.find((l) => l.id === id)!.bbox!;
const rv = box("rv");
const [twX0, twY0, twX1, twY1] = box("tumbleweed");
const twCx = (twX0 + twX1) / 2, twCy = (twY0 + twY1) / 2, twR = (twX1 - twX0) / 2;
const chairs = box("chairs");

// tumbleweed run, as offsets from where it sits in the art (fractions of the canvas width)
const ROLL_FROM = 0.62, ROLL_TO = -0.3, ROLL_SPEED = 0.075, ROLL_REST = 2.5;
const LENS = 92; // x-ray hexagon radius, px
const EASE = "cubic-bezier(.16,1,.3,1)";

// regular hexagon (flat top) around the cursor; radius animates through the registered --lr property
const HEX = [0, 60, 120, 180, 240, 300].map((a) => {
  const r = (a * Math.PI) / 180;
  return `calc(var(--lx) + var(--lr) * ${Math.cos(r).toFixed(4)}) calc(var(--ly) + var(--lr) * ${Math.sin(r).toFixed(4)})`;
});

/** ① The desert at dusk: hero. Over the RV the cursor becomes a benzene-ring x-ray lens. */
export function HeroScene() {
  const tumble = useRef<TumbleState | null>(null);
  const [roll, setRoll] = useState({ x: 0, y: 0, rot: 0 });
  const [lens, setLens] = useState({ x: 50, y: 50, on: false, full: false });

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
  const d = DEPTHS.hero.chairs;

  return (
    <section id="desert" aria-label="The desert" className="relative h-svh overflow-hidden">
      <SceneCanvas
        scene="hero"
        priority
        overscan={1.02}
        layerStyle={{
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
          // chairs + mask brought forward: lower, a little right, a touch bigger (keeps their parallax)
          chairs: {
            transformOrigin: `${((chairs[0] + chairs[2]) / 2) * 100}% ${chairs[3] * 100}%`,
            transform: `translate3d(calc(var(--mx, 0) * ${-d * 18}px + 2.5%), calc(var(--my, 0) * ${-d * 10}px + 6%), 0) scale(1.12)`,
          },
        }}
      >
        <DesertFx tumble={tumble} />
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
          {/* alternating double bonds */}
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
      </SceneCanvas>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="pointer-events-none absolute right-[6vw] top-[19vh] flex flex-col items-start"
      >
        <p className="mb-4 font-type text-[clamp(0.65rem,0.8vw,0.85rem)] uppercase tracking-[0.3em] text-paper [text-shadow:1px_1px_0_#111]">
          A 24-hour hackathon · {EVENT.venue}
        </p>
        <PeriodicTitle className="text-[clamp(2.5rem,5.6vw,6rem)]" />
        <p className="mt-5 bg-ink px-3 py-1 font-display text-[clamp(0.7rem,0.85vw,0.95rem)] uppercase tracking-[0.35em] text-hazmat">
          {EVENT.tagline}
        </p>
        <div className="pointer-events-auto mt-7">
          <StampButton href="/dashboard">Enter the lab</StampButton>
        </div>
      </motion.div>

      <p className="pointer-events-none absolute bottom-3 right-4 font-type text-[10px] text-paper/60">
        Fan-made parody · not affiliated with AMC or Sony Pictures Television
      </p>
    </section>
  );
}
