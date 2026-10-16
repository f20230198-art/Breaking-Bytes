"use client";

import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useState } from "react";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { EVENT, RULES, SCHEDULE } from "@/data/site";

// measured from the art (percent of the canvas unless noted)
const PAPER = { left: 8.6, top: 22.5, width: 35, height: 36.5 }; // blank paper below the clip
const VALVES = [0.1008, 0.2952, 0.4973, 0.6996, 0.9043]; // valve centres (fraction of width)
const VALVE_Y = 78.8; // valve centre height
const VALVE_TOP = 69.5; // top of a valve's knob: steam leaves from here
const VALVE_HALF = 0.058; // collar half-width, so liquid stops at each valve body
const TUBE = { top: 75.9, height: 5.3 }; // the empty dark channel inside the pipe
const EDGES = [0, ...VALVES.flatMap((v) => [v - VALVE_HALF, v + VALVE_HALF]), 1];
const SEGMENTS = Array.from({ length: VALVES.length + 1 }, (_, i) => [EDGES[i * 2], EDGES[i * 2 + 1]] as const);
// the three glowing portholes: centre x %, centre y %, radius in cqw (1cqw = 1% of the canvas width)
const PORTHOLES = [[60.25, 43.1, 3.4], [76.6, 49.9, 2.95], [91.75, 56, 2.65]];
const LAMP = { x: 5.6, y: 7.2 }; // the hanging lamp, top left

const cookDay = new Date(EVENT.startsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai" });
const cookWeekday = new Date(EVENT.startsAt).toLocaleDateString("en-GB", { weekday: "long", timeZone: "Asia/Dubai" });
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Bubbles rising inside a porthole (clipped to the glass). Deterministic, so server and client agree. */
function Bubbles({ r }: { r: number }) {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const size = 0.4 + ((i * 7) % 5) * 0.2;
        return (
          <span
            key={i}
            className="lab-fx absolute rounded-full border-2 border-white/90 bg-white/35"
            style={{
              left: `${8 + ((i * 53) % 78)}%`,
              bottom: `${-size * 2}cqw`,
              width: `${size}cqw`,
              height: `${size}cqw`,
              animationName: "lab-bubble",
              animationDuration: `${3.4 + ((i * 13) % 7) * 0.45}s`,
              animationDelay: `-${((i * 29) % 11) * 0.35}s`,
              ["--rise" as string]: `${r * 2.3}cqw`,
              ["--dx" as string]: `${((i % 3) - 1) * 0.35}cqw`,
            }}
          />
        );
      })}
    </>
  );
}

/** ② The Superlab: clipboard with the event brief, and a pipe that fills with blue liquid as you scroll the 24-hour schedule. */
export function LabStage({ progress, reveal = 1 }: { progress: MotionValue<number>; reveal?: number }) {
  const [t, setT] = useState(() => clamp01((progress.get() - 0.08) / 0.8));
  useMotionValueEvent(progress, "change", (v) => setT(clamp01((v - 0.08) / 0.8)));

  return (
    <SceneCanvas
      scene="lab"
      plate={false}
      overscan={1}
      bg="bg-ink"
      anchorY={0.8}
      layerStyle={{ glow: { mixBlendMode: "screen", animation: "lab-glow 3.6s ease-in-out infinite" } }}
    >
      {/* everything below sizes in cqw so it scales with the art, not the window */}
      <div className="absolute inset-0 [container-type:inline-size]" style={{ opacity: reveal }}>
        {/* porthole glow, plus bubbles rising behind the glass */}
        {PORTHOLES.map(([x, y, r]) => (
          <div key={x}>
            <div
              aria-hidden
              className="lab-glow pointer-events-none absolute rounded-full bg-[radial-gradient(circle,rgba(19,200,232,0.5),transparent_68%)]"
              style={{ left: `${x}%`, top: `${y}%`, width: `${r * 3.4}cqw`, height: `${r * 3.4}cqw`, transform: "translate(-50%, -50%)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute overflow-hidden rounded-full"
              style={{ left: `${x}%`, top: `${y}%`, width: `${r * 1.8}cqw`, height: `${r * 1.8}cqw`, transform: "translate(-50%, -50%)" }}
            >
              <Bubbles r={r * 1.8} />
            </div>
          </div>
        ))}

        {/* the hanging bulb: a cone of warm light on the wall, a hot glow, and a dark dim-out that swaps in when it cuts */}
        <div
          aria-hidden
          className="lab-fx pointer-events-none absolute mix-blend-screen"
          style={{
            left: `${LAMP.x}%`, top: `${LAMP.y}%`, width: "26cqw", height: "36cqw", transform: "translateX(-50%)",
            clipPath: "polygon(46% 0, 54% 0, 100% 100%, 0 100%)",
            background: "linear-gradient(to bottom, rgba(255,205,120,0.5), rgba(255,170,80,0.12) 70%, transparent)",
            animationName: "lab-bulb", animationDuration: "6s",
          }}
        />
        <div
          aria-hidden
          className="lab-fx pointer-events-none absolute rounded-full bg-[radial-gradient(circle,rgba(255,214,140,0.85),rgba(255,170,80,0.3)_35%,transparent_68%)] mix-blend-screen"
          style={{ left: `${LAMP.x}%`, top: `${LAMP.y + 0.5}%`, width: "11cqw", height: "11cqw", transform: "translate(-50%, -50%)", animationName: "lab-bulb", animationDuration: "6s" }}
        />
        <div
          aria-hidden
          className="lab-fx pointer-events-none absolute rounded-full bg-[radial-gradient(ellipse,rgba(17,17,17,0.9)_0_45%,transparent_72%)]"
          style={{ left: `${LAMP.x}%`, top: `${LAMP.y}%`, width: "8cqw", height: "6cqw", transform: "translate(-50%, -50%)", opacity: 0, animationName: "lab-bulb-dim", animationDuration: "6s" }}
        />

        {/* the brief, typed onto the clipboard */}
        <article
          className="absolute grid grid-cols-[1.1fr_1fr] gap-[1.6cqw] overflow-hidden text-ink"
          style={{ left: `${PAPER.left}%`, top: `${PAPER.top}%`, width: `${PAPER.width}%`, height: `${PAPER.height}%`, padding: "1cqw 1.6cqw" }}
        >
          <div>
            <p className="font-type text-[0.85cqw] uppercase tracking-[0.22em] text-brick">Form BB-24</p>
            <h2 className="mt-[0.4cqw] font-display text-[2.2cqw] uppercase leading-[0.95]">The 24{"‑"}hour cook</h2>
            <p className="mt-[0.8cqw] font-type text-[1.1cqw] leading-snug">
              One crew. One lab. Cook something pure from scratch against real problems from real suppliers. The best batch walks out with the money.
            </p>
          </div>
          <div className="flex flex-col justify-between border-l-2 border-ink pl-[1.5cqw]">
            <dl className="space-y-[0.4cqw]">
              {[
                [`${EVENT.hours}h`, "the cook"],
                [`~${EVENT.expectedCooks}`, "cooks"],
                [cookDay, cookWeekday],
              ].map(([big, small]) => (
                <div key={small} className="flex items-baseline gap-[0.8cqw]">
                  <dt className="font-display text-[1.7cqw] leading-none">{big}</dt>
                  <dd className="font-type text-[0.85cqw] uppercase tracking-widest">{small}</dd>
                </div>
              ))}
            </dl>
            <p className="font-type text-[0.95cqw] leading-snug">
              <span className="uppercase tracking-widest text-brick">Lab:</span> {EVENT.venue}
            </p>
            <ul className="space-y-[0.15cqw] font-type text-[0.9cqw] leading-snug">
              {RULES.slice(0, 3).map((r) => (
                <li key={r} className="flex gap-[0.5cqw]">
                  <span aria-hidden className="text-brick">✕</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </article>

        {/* schedule pipe: blue liquid fills segment by segment, each valve lights as it arrives */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0" style={{ top: `${TUBE.top}%`, height: `${TUBE.height}%` }}>
          {SEGMENTS.map(([a, b], i) => (
            <div key={i} className="absolute inset-y-0 overflow-hidden" style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }}>
              <div
                className="relative h-full origin-left overflow-hidden bg-[linear-gradient(to_bottom,#0b5f70,#13c8e8_45%,#8ff0ff_55%,#13c8e8_70%,#0b5f70)] shadow-[0_0_1.2cqw_rgba(19,200,232,0.8)]"
                style={{ transform: `scaleX(${clamp01((t - a) / (b - a))})` }}
              >
                {/* current: light streaks and bubbles drifting along the pipe */}
                <div
                  className="lab-fx absolute inset-y-0 left-0 w-[calc(100%+5cqw)]"
                  style={{
                    animationName: "lab-flow",
                    animationDuration: "1.6s",
                    backgroundImage:
                      "repeating-linear-gradient(100deg, transparent 0 2cqw, rgba(255,255,255,0.3) 2cqw 2.4cqw, transparent 2.4cqw 5cqw), radial-gradient(circle at 30% 35%, rgba(255,255,255,0.95) 0 0.28cqw, transparent 0.34cqw), radial-gradient(circle at 70% 68%, rgba(255,255,255,0.85) 0 0.2cqw, transparent 0.26cqw)",
                    backgroundSize: "5cqw 100%, 5cqw 100%, 2.5cqw 100%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <ol className="absolute inset-0 list-none">
          {SCHEDULE.map((s, i) => {
            const lit = t >= VALVES[i] - VALVE_HALF * 0.6;
            const x = `${VALVES[i] * 100}%`;
            return (
              <li key={s.time + s.title}>
                <span
                  aria-hidden
                  className="pointer-events-none absolute rounded-full bg-[radial-gradient(circle,rgba(19,200,232,0.65),transparent_65%)] transition-opacity duration-500"
                  style={{ left: x, top: `${VALVE_Y}%`, width: "10cqw", height: "10cqw", transform: "translate(-50%, -50%)", opacity: lit ? 1 : 0 }}
                />
                {/* steam vents from the valve once the liquid reaches it */}
                {lit &&
                  [0, 1, 2].map((k) => (
                    <span
                      key={k}
                      aria-hidden
                      className="lab-fx pointer-events-none absolute rounded-full bg-[radial-gradient(circle,rgba(239,230,210,0.9),transparent_70%)]"
                      style={{
                        left: x,
                        top: `${VALVE_TOP}%`,
                        width: "3.6cqw",
                        height: "3.6cqw",
                        marginLeft: "-1.8cqw",
                        animationName: "lab-steam",
                        animationDuration: "3.6s",
                        animationDelay: `-${k * 1.2}s`,
                        ["--dx" as string]: `${(k - 1) * 0.8}cqw`,
                      }}
                    />
                  ))}
                {/* time tag, in the gap between clipboard and pipe */}
                <p
                  className="absolute border-2 border-ink bg-paper px-[0.9cqw] py-[0.15cqw] font-display text-[1.5cqw] leading-tight text-ink transition-[opacity,transform] duration-500 print-shadow"
                  style={{ left: x, top: "63.6%", transform: `translateX(-50%) ${lit ? "" : "translateY(0.4cqw)"}`, opacity: lit ? 1 : 0.4 }}
                >
                  {s.time}
                </p>
                {/* what happens, on the floor below the valve */}
                <div
                  className="absolute bg-ink/85 px-[0.7cqw] py-[0.3cqw] text-center transition-opacity duration-500"
                  style={{ left: x, top: "90.4%", width: "17cqw", transform: "translateX(-50%)", opacity: lit ? 1 : 0.35 }}
                >
                  <p className="font-display text-[1cqw] uppercase leading-tight text-hazmat">{s.title}</p>
                  <p className="font-type text-[0.8cqw] leading-snug text-paper">{s.note}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </SceneCanvas>
  );
}
