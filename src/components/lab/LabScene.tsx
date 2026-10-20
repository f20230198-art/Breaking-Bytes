"use client";

import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { useSite } from "@/components/site/SiteContext";
import { EVENT } from "@/data/site";

// measured from the art (percent of the canvas unless noted)
const PAPER = { left: 7.6, top: 19.6, width: 36.6, height: 39.9 }; // the clipboard's blank paper
// the three glowing portholes: centre x %, centre y %, radius in cqw (1cqw = 1% of the canvas width)
const PORTHOLES = [[60.25, 43.1, 3.4], [76.6, 49.9, 2.95], [91.75, 56, 2.65]];
const LAMP = { x: 5.6, y: 7.2 }; // the hanging lamp, top left
// the blank paper insets of the two plates below the clipboard: When (left) and Where (right)
const CARDS = [{ left: 7.15, top: 66.1, width: 16.85, height: 12.3 }, { left: 27.15, top: 66.1, width: 17.1, height: 12.3 }];

const fmt = (startsAt: string, o: Intl.DateTimeFormatOptions, offsetHours = 0) =>
  new Date(new Date(startsAt).getTime() + offsetHours * 3600000).toLocaleString("en-GB", { timeZone: "Asia/Dubai", ...o });
const [venuePlace, venueCampus = ""] = EVENT.venue.split(/,\s*/);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Bubbles rising inside a porthole (clipped to the glass). Deterministic, so server and client agree. */
export function Bubbles({ r }: { r: number }) {
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

type Burst = { id: number; left: number; size: number; dur: number; dx: number };
let burstId = 0;

/** A porthole you can play with: hover to stir up bubbles, click for a big burst and a glass pulse. */
function PortholeFx({ x, y, r }: { x: number; y: number; r: number }) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [pulse, setPulse] = useState(0);
  const lastRef = useRef(0);

  const spawn = (n: number) => {
    const fresh = Array.from({ length: n }, () => ({
      id: ++burstId,
      left: 6 + Math.random() * 80,
      size: 0.35 + Math.random() * 0.7,
      dur: 1.6 + Math.random() * 1.4,
      dx: (Math.random() - 0.5) * 1.2,
    }));
    setBursts((b) => [...b, ...fresh].slice(-40));
    const ids = new Set(fresh.map((f) => f.id));
    setTimeout(() => setBursts((b) => b.filter((f) => !ids.has(f.id))), 3200);
  };

  return (
    <div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%`, width: `${r * 1.9}cqw`, height: `${r * 1.9}cqw`, transform: "translate(-50%, -50%)" }}
    >
      <div
        key={pulse}
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
        style={pulse ? { animation: "lab-pulse 600ms ease-out" } : undefined}
      >
        {bursts.map((b) => (
          <span
            key={b.id}
            className="absolute rounded-full border-2 border-white/90 bg-white/40"
            style={{
              left: `${b.left}%`,
              bottom: `${-b.size}cqw`,
              width: `${b.size}cqw`,
              height: `${b.size}cqw`,
              animation: `lab-bubble ${b.dur}s linear forwards`,
              ["--rise" as string]: `${r * 2.2}cqw`,
              ["--dx" as string]: `${b.dx}cqw`,
            }}
          />
        ))}
      </div>
      <button
        type="button"
        aria-label="Stir the flask"
        className="absolute inset-0 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-crystal"
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const now = performance.now();
          if (now - lastRef.current < 110) return;
          lastRef.current = now;
          spawn(2);
        }}
        onClick={() => {
          spawn(16);
          setPulse((n) => n + 1);
        }}
      />
    </div>
  );
}

/** Writing on one of the plates' paper insets. */
function Plate({ at, label, side, children }: { at: (typeof CARDS)[number]; label: string; side: "l" | "r"; children: ReactNode }) {
  return (
    <div
      // phones: the outer edge of each plate is off screen, so its writing moves in from that side
      className={`absolute flex flex-col justify-center px-[1.4cqw] text-ink ${side === "l" ? "portrait:pl-[4.6cqw]" : "portrait:pr-[4.6cqw]"}`}
      style={{ left: `${at.left}%`, top: `${at.top}%`, width: `${at.width}%`, height: `${at.height}%` }}
    >
      <p className="font-type text-[0.85cqw] uppercase tracking-[0.25em] text-brick">{label}</p>
      {children}
    </div>
  );
}

/** ② The Superlab: the brief on the clipboard, When / Where on the plates below it, and the floor hatch down to the stash. */
export function LabStage({ progress, reveal = 1 }: { progress: MotionValue<number>; reveal?: number }) {
  const q = (v: number) => Math.round(clamp01((v - 0.08) / 0.8) * 300) / 300;
  const [t, setT] = useState(() => q(progress.get()));
  useMotionValueEvent(progress, "change", (v) => setT(q(v)));
  // the When plate follows the event clock in the database
  const { startsAt } = useSite();
  const cookDay = fmt(startsAt, { day: "numeric", month: "short" });
  const cookWeekday = fmt(startsAt, { weekday: "short" });
  const startTime = fmt(startsAt, { hour: "2-digit", minute: "2-digit", hour12: false });
  const endDay = fmt(startsAt, { weekday: "short" }, EVENT.hours);

  // each plane drifts with the mouse and, a little, with scroll; nearer planes move more. Overlays are grouped onto a plane
  // so text and effects stay glued to the art they belong to.
  const plane = (d: number): CSSProperties => ({
    transform: `translate3d(calc(var(--mx, 0) * ${-d * 18}px), calc(var(--my, 0) * ${-d * 10}px + ${((0.5 - t) * d * 16).toFixed(2)}px), 0)`,
  });

  return (
    <SceneCanvas
      scene="lab"
      className="portrait:[--focus:0.247]" // phones: the clipboard and its plates (paper centre, after the 1.05 overscan)
      plate={false}
      hide={["pipe"]}
      overscan={1.05}
      bg="bg-ink"
      anchorY={0.8}
      layerStyle={{
        back: plane(0.2),
        clipboard: plane(0.7),
        glow: { ...plane(0.2), animation: "lab-glow 3.6s ease-in-out infinite" },
      }}
    >
      {/* everything below sizes in cqw so it scales with the art, not the window */}
      <div className="absolute inset-0 [container-type:inline-size]" style={{ opacity: reveal }}>
        {/* back plane: porthole glow + bubbles, and the bulb's light */}
        <div className="absolute inset-0" style={plane(0.2)}>
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
            <PortholeFx x={x} y={y} r={r} />
          </div>
        ))}

        {/* the hanging bulb: a cone of warm light on the wall, a hot glow, and a dark dim-out that swaps in when it cuts */}
        <div
          aria-hidden
          className="lab-fx pointer-events-none absolute"
          style={{
            left: `${LAMP.x}%`, top: `${LAMP.y}%`, width: "26cqw", height: "36cqw", transform: "translateX(-50%)",
            clipPath: "polygon(46% 0, 54% 0, 100% 100%, 0 100%)",
            background: "linear-gradient(to bottom, rgba(255,205,120,0.5), rgba(255,170,80,0.12) 70%, transparent)",
            animationName: "lab-bulb", animationDuration: "6s",
          }}
        />
        <div
          aria-hidden
          className="lab-fx pointer-events-none absolute rounded-full bg-[radial-gradient(circle,rgba(255,214,140,0.85),rgba(255,170,80,0.3)_35%,transparent_68%)]"
          style={{ left: `${LAMP.x}%`, top: `${LAMP.y + 0.5}%`, width: "11cqw", height: "11cqw", transform: "translate(-50%, -50%)", animationName: "lab-bulb", animationDuration: "6s" }}
        />
        <div
          aria-hidden
          className="lab-fx pointer-events-none absolute rounded-full bg-[radial-gradient(ellipse,rgba(17,17,17,0.9)_0_45%,transparent_72%)]"
          style={{ left: `${LAMP.x}%`, top: `${LAMP.y}%`, width: "8cqw", height: "6cqw", transform: "translate(-50%, -50%)", opacity: 0, animationName: "lab-bulb-dim", animationDuration: "6s" }}
        />

        </div>

        {/* clipboard plane: what the hackathon is, and the When / Where plates bolted below */}
        <div className="pointer-events-none absolute inset-0" style={plane(0.7)}>
        <article
          // phones: the paper is a little wider than the screen, so the text keeps clear of both edges
          className="absolute flex flex-col justify-center overflow-hidden px-[2.4cqw] py-[1.2cqw] text-ink portrait:px-[4.6cqw]"
          style={{ left: `${PAPER.left}%`, top: `${PAPER.top}%`, width: `${PAPER.width}%`, height: `${PAPER.height}%` }}
        >
          <p className="font-type text-[0.85cqw] uppercase tracking-[0.25em] text-brick">Form BB-24 · The brief</p>
          <h2 className="mt-[0.4cqw] font-display text-[2.3cqw] uppercase leading-[0.95]">What is {EVENT.name}?</h2>
          <p className="mt-[0.9cqw] font-type text-[1.12cqw] leading-snug">
            A {EVENT.hours}{"‑"}hour hackathon, run underground. You and your crew walk into the lab with an idea and walk out with a working product.
          </p>
          <p className="mt-[0.6cqw] font-type text-[1.12cqw] leading-snug">
            Real problems from real companies drop at the start. Cook from scratch, ship before the timer hits zero, and put your batch in front of the judges. The purest build takes the money.
          </p>
        </article>
        <Plate at={CARDS[0]} label="When" side="l">
          <p className="mt-[0.3cqw] font-display text-[2.3cqw] uppercase leading-none">{cookDay}</p>
          <p className="mt-[0.4cqw] font-type text-[0.95cqw] leading-snug">
            {cookWeekday} {startTime} → {endDay} {startTime}
            <br />
            {EVENT.hours} hours, non-stop
          </p>
        </Plate>
        <Plate at={CARDS[1]} label="Where" side="r">
          <p className="mt-[0.3cqw] font-display text-[1.9cqw] uppercase leading-none">{venuePlace}</p>
          <p className="mt-[0.4cqw] font-type text-[0.95cqw] leading-snug">{venueCampus}</p>
        </Plate>
        </div>
      </div>
    </SceneCanvas>
  );
}
