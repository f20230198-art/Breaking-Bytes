"use client";

import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useState } from "react";
import { PinnedScene } from "@/components/scene/PinnedScene";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { EVENT, RULES, SCHEDULE } from "@/data/site";

// measured from the art (percent of the canvas unless noted)
const PAPER = { left: 9.6, top: 15.5, width: 36.2, height: 44 }; // blank paper below the clip
const VALVES = [0.1029, 0.3052, 0.5035, 0.7021, 0.9027]; // valve centres (fraction of width)
const VALVE_HALF = 0.047; // collar half-width, so liquid stops at each valve body
const TUBE = { top: 76.6, height: 5.6 }; // the empty glass channel
const EDGES = [0, ...VALVES.flatMap((v) => [v - VALVE_HALF, v + VALVE_HALF]), 1];
const SEGMENTS = Array.from({ length: VALVES.length + 1 }, (_, i) => [EDGES[i * 2], EDGES[i * 2 + 1]] as const);

const cookDay = new Date(EVENT.startsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai" });
const cookWeekday = new Date(EVENT.startsAt).toLocaleDateString("en-GB", { weekday: "long", timeZone: "Asia/Dubai" });
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** ② The Superlab: clipboard with the event brief, and a pipe that fills with blue liquid as you scroll the 24-hour schedule. */
export function LabScene() {
  return (
    <PinnedScene id="lab" label="The superlab" length={3.2}>
      {(p) => <Inner progress={p} />}
    </PinnedScene>
  );
}

function Inner({ progress }: { progress: MotionValue<number> }) {
  const [t, setT] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setT(clamp01((v - 0.08) / 0.8)));

  return (
    <SceneCanvas scene="lab" plate={false} overscan={1} bg="bg-ink" layerStyle={{ glow: { mixBlendMode: "screen" } }}>
      {/* everything below sizes in cqw so it scales with the art, not the window */}
      <div className="absolute inset-0 [container-type:inline-size]">
        {/* soft pulses behind the two big portholes */}
        {[[58, 35, 9], [91, 45.6, 8]].map(([x, y, r]) => (
          <div
            key={x}
            aria-hidden
            className="lab-glow pointer-events-none absolute rounded-full bg-[radial-gradient(circle,rgba(19,200,232,0.55),transparent_68%)]"
            style={{ left: `${x - r / 2}%`, top: `${y - (r * 16) / 9 / 2}%`, width: `${r}%`, height: `${(r * 16) / 9}%` }}
          />
        ))}

        {/* the brief, typed onto the clipboard */}
        <article
          className="absolute overflow-hidden text-ink"
          style={{ left: `${PAPER.left}%`, top: `${PAPER.top}%`, width: `${PAPER.width}%`, height: `${PAPER.height}%`, padding: "1.6cqw 2cqw" }}
        >
          <p className="font-type text-[0.95cqw] uppercase tracking-[0.25em] text-brick">Form BB-24 · Cook manifest</p>
          <h2 className="mt-[0.5cqw] font-display text-[3cqw] uppercase leading-[0.95]">The 24-hour cook</h2>
          <p className="mt-[0.9cqw] font-type text-[1.25cqw] leading-snug">
            One crew. One lab. Twenty-four hours to build something pure. Crews of up to four cook a product from scratch against real problems from real suppliers, and the best batch walks out with the money.
          </p>
          <dl className="mt-[1.1cqw] grid grid-cols-3 gap-[1cqw] border-y-2 border-ink py-[0.8cqw] text-center">
            {[
              [`${EVENT.hours}h`, "the cook"],
              [`~${EVENT.expectedCooks}`, "cooks"],
              [cookDay, cookWeekday],
            ].map(([big, small]) => (
              <div key={small}>
                <dt className="font-display text-[1.9cqw] leading-none">{big}</dt>
                <dd className="mt-[0.3cqw] font-type text-[0.95cqw] uppercase tracking-widest">{small}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-[0.8cqw] font-type text-[1.1cqw]">
            <span className="uppercase tracking-widest text-brick">Lab:</span> {EVENT.venue}
          </p>
          <ul className="mt-[0.7cqw] space-y-[0.2cqw] font-type text-[1.1cqw] leading-snug">
            {RULES.map((r) => (
              <li key={r} className="flex gap-[0.6cqw]">
                <span aria-hidden className="text-brick">✕</span>
                {r}
              </li>
            ))}
          </ul>
        </article>

        {/* schedule pipe: blue liquid fills segment by segment, each valve lights as it arrives */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0" style={{ top: `${TUBE.top}%`, height: `${TUBE.height}%` }}>
          {SEGMENTS.map(([a, b], i) => (
            <div key={i} className="absolute inset-y-0 overflow-hidden" style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }}>
              <div
                className="h-full origin-left bg-[linear-gradient(to_bottom,#0b5f70,#13c8e8_45%,#8ff0ff_55%,#13c8e8_70%,#0b5f70)] shadow-[0_0_1.2cqw_rgba(19,200,232,0.8)]"
                style={{ transform: `scaleX(${clamp01((t - a) / (b - a))})` }}
              />
            </div>
          ))}
        </div>

        <ol className="absolute inset-0 list-none">
          {SCHEDULE.map((s, i) => {
            const lit = t >= VALVES[i] - VALVE_HALF * 0.6;
            return (
              <li key={s.time + s.title} className="absolute" style={{ left: `${VALVES[i] * 100}%`, top: "63.5%", width: "17.5cqw", transform: "translateX(-50%)" }}>
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 rounded-full bg-[radial-gradient(circle,rgba(19,200,232,0.7),transparent_65%)] transition-opacity duration-500"
                  style={{ top: "13.2cqw", width: "9cqw", height: "9cqw", transform: "translate(-50%, -50%)", opacity: lit ? 1 : 0 }}
                />
                <div
                  className="border-2 border-ink bg-paper px-[0.9cqw] py-[0.5cqw] text-center text-ink transition-[opacity,transform] duration-500 print-shadow"
                  style={{ opacity: lit ? 1 : 0.4, transform: lit ? "rotate(-1deg)" : "rotate(-1deg) translateY(0.5cqw)" }}
                >
                  <p className="font-display text-[1.7cqw] leading-none">{s.time}</p>
                  <p className="mt-[0.2cqw] font-type text-[1cqw] uppercase tracking-wider">{s.title}</p>
                </div>
                <p
                  className="absolute left-0 right-0 bg-ink/85 px-[0.6cqw] py-[0.3cqw] text-center font-type text-[0.95cqw] leading-snug text-paper transition-opacity duration-500"
                  style={{ top: "17.2cqw", opacity: lit ? 1 : 0 }}
                >
                  {s.note}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </SceneCanvas>
  );
}
