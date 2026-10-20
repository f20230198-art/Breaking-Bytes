"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { Tile } from "@/components/comic/PeriodicTitle";
import { useNearView } from "@/components/scene/useNearView";
import { EVENT, FOOD_NOTE, SCHEDULE } from "@/data/site";

const FUSE_GAP = 0.1; // the fuse runs this far (fraction of the column) beside a card, on its free side
const MOBILE_X = 20; // px: on phones the fuse is one straight run down the left edge
const EMBER = 70; // px of glowing fuse just behind the spark

// rough-cut paper card edge
const CUT_EDGE = "polygon(0 2%, 4% 0, 38% 1.5%, 70% 0, 100% 2.5%, 99% 55%, 100% 97%, 62% 100%, 30% 98.5%, 1% 100%, 0 60%)";

const clock = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const h12 = h % 12 || 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
};
const dayLabel = (offset: number) =>
  new Date(new Date(EVENT.startsAt).getTime() + offset * 86400000).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Dubai" }).toUpperCase();

// a small hand-drawn waver along each straight run, so the fuse never looks ruled
function wobbly(pts: [number, number][]) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const n = Math.max(1, Math.round(len / 40));
    const nx = -(y1 - y0) / len, ny = (x1 - x0) / len; // perpendicular to the run
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const w = k === n ? 0 : Math.sin(i * 7.1 + k * 2.3) * 2.2;
      d += ` L${(x0 + (x1 - x0) * t + nx * w).toFixed(1)} ${(y0 + (y1 - y0) * t + ny * w).toFixed(1)}`;
    }
  }
  return d;
}

type Geo = { w: number; h: number; d: string; ticks: { x1: number; x2: number; y: number }[]; tickAt: number[] };

/**
 * ③ The run-of-show as a lit fuse. It is lit at the top (registration) and burns down toward the bomb (the results):
 * everything above the spark is time spent, everything below it is time left. The spark sits wherever the middle of
 * the screen is, each card catches as the spark reaches it, and at the bottom the fuse runs into the bomb and it goes off.
 */
export function FuseTimeline() {
  const ref = useRef<HTMLElement>(null);
  const near = useNearView(ref, "20%"); // spark, smoke and explosion loops pause once the timeline is off screen
  const col = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const path = useRef<SVGPathElement>(null);
  const ember = useRef<SVGPathElement>(null);
  const spark = useRef<SVGGElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [lit, setLit] = useState(0);
  const still = useReducedMotion();

  // measured on the fuse itself (not the section, which slides in over the lab): it catches as its top reaches mid-screen
  const { scrollYProgress } = useScroll({ target: col, offset: ["start center", "end center"] });
  const burnt = useTransform(scrollYProgress, (v) => (still ? 0 : v));
  // after the spark reaches the bomb (fuse end at mid-screen): the next 1.5 screens of scroll are the blast. The section
  // runs on a screen past the fuse (pb), so the flash holds white over that and clears just as the payout reaches the top
  const { scrollYProgress: blast } = useScroll({ target: col, offset: ["end center", "end -100%"] });
  const boomScale = useTransform(blast, [0, 0.2], [0, 2.2]);
  const boomFade = useTransform(blast, [0.12, 0.28], [1, 0]);
  const flash = useTransform(blast, [0.18, 0.32, 0.8, 1], [0, 1, 1, 0]);
  const boomShown = useTransform(blast, (v) => (v > 0 && v < 1 && !still ? "visible" : "hidden"));

  // lay the fuse out from where the cards actually landed: down beside each card, across under it, down beside the next
  useLayoutEffect(() => {
    const el = col.current;
    if (!el) return;
    const build = () => {
      const w = el.clientWidth, h = el.clientHeight;
      const pts: [number, number][] = [];
      const ticks: Geo["ticks"] = [];
      const tickPt: number[] = []; // index into pts of each tick's corner
      const box = cards.current.map((c) => c && { top: c.offsetTop, bottom: c.offsetTop + c.offsetHeight, left: c.offsetLeft, right: c.offsetLeft + c.offsetWidth });
      if (w < 640) {
        pts.push([MOBILE_X, 0]);
        box.forEach((b) => {
          if (!b) return;
          const y = b.top + 30;
          pts.push([MOBILE_X, y]);
          tickPt.push(pts.length - 1);
          ticks.push({ x1: MOBILE_X, x2: b.left, y });
        });
        pts.push([MOBILE_X, h - 40], [w / 2, h - 40], [w / 2, h]);
      } else {
        box.forEach((b, i) => {
          if (!b) return;
          const left = i % 2 === 0; // card on the left, fuse on its right
          const x = left ? b.right + w * FUSE_GAP : b.left - w * FUSE_GAP;
          const next = box[i + 1];
          const y = b.top + 30;
          if (i === 0) pts.push([x, 0]);
          pts.push([x, y]);
          tickPt.push(pts.length - 1);
          ticks.push({ x1: x, x2: left ? b.right : b.left, y });
          // run past the card, then cross over to the far side of the next one
          const turn = next ? (b.bottom + next.top) / 2 : h - 40;
          pts.push([x, turn]);
          pts.push([next ? (left ? next.left - w * FUSE_GAP : next.right + w * FUSE_GAP) : w / 2, turn]);
        });
        pts.push([w / 2, h]);
      }
      // how far along the fuse each tick is, so cards light as the spark reaches them
      let acc = 0;
      const lens = [0];
      for (let i = 1; i < pts.length; i++) lens.push((acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])));
      setGeo({ w, h, d: wobbly(pts), ticks, tickAt: tickPt.map((k) => lens[k] / acc) });
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // everything that follows the spark is written straight to the DOM; only the lit-card count goes through state
  const place = (v: number) => {
    if (!geo) return;
    const at = Math.min(1, Math.max(0, v));
    const n = still ? geo.tickAt.length : geo.tickAt.filter((t) => t <= at + 0.002).length;
    setLit((l) => (l === n ? l : n));


    const p = path.current;
    if (!p) return;
    const L = p.getTotalLength();
    if (ember.current) {
      ember.current.setAttribute("stroke-dasharray", `${EMBER} ${L + EMBER}`);
      ember.current.setAttribute("stroke-dashoffset", `${EMBER - at * L}`);
    }
    if (spark.current) {
      const pt = p.getPointAtLength(at * L);
      spark.current.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
    }
  };
  useMotionValueEvent(burnt, "change", place);
  // place the spark once the fuse is laid out (and again after a resize), before any scroll has happened
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => place(burnt.get()));
    return () => cancelAnimationFrame(id);
  }, [geo, still]); // eslint-disable-line react-hooks/exhaustive-deps -- place reads the latest geo

  // clicking a card burns the fuse to it: scroll so its tick sits where the spark lives (mid-screen)
  const burnTo = (i: number) => {
    const c = col.current, tick = geo?.ticks[i];
    if (!c || !tick) return;
    const top = c.getBoundingClientRect().top + window.scrollY + tick.y - window.innerHeight / 2;
    window.scrollTo({ top, behavior: still ? "auto" : "smooth" });
  };

  const now = lit - 1; // the card the spark has most recently reached
  return (
    <section
      ref={ref}
      data-idle={near ? undefined : ""}
      id="schedule"
      aria-labelledby="schedule-title"
      className="relative z-10 -mt-[100vh] overflow-x-clip bg-paper pb-[100vh] pt-28 text-ink"
      // asset fuse/desert: cream noon desert seen from above, tiles vertically
      style={{ backgroundImage: "url(/scenes/fuse/desert.webp)", backgroundSize: "100% auto", backgroundRepeat: "repeat-y", backgroundPosition: "center top" }}
    >
      <TornEdge />

      <header className="relative mx-auto mb-20 max-w-5xl px-4 text-center">
        <p className="inline-block -rotate-2 border-[3px] border-ink bg-brick px-3 py-1 font-stencil text-sm font-bold uppercase tracking-[0.3em] text-paper shadow-[3px_3px_0_var(--color-ink)] sm:text-base">
          Batch 01 · {EVENT.hours} hrs · Handle with care
        </p>
        <h2 id="schedule-title" className="mt-6 font-display text-6xl leading-[1.05] text-paper [text-shadow:0.05em_0.05em_0_var(--color-ink)] sm:text-8xl">
          <span className="sr-only">Time to cook: the schedule</span>
          <span aria-hidden>
            <Tile symbol="Ti" number={22} mass="47.867" name="Titanium" />
            <span className="text-ink [text-shadow:none]">me to </span>
            <Tile symbol="Co" number={27} mass="58.933" name="Cobalt" />
            <span className="text-ink [text-shadow:none]">ok</span>
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-md font-type text-base text-ink-soft">
          The fuse is lit at registration and burns all the way down to the payout. Scroll to burn it, or tap a card to jump the spark there.
        </p>
      </header>

      <div ref={col} className="relative mx-auto max-w-5xl px-4">
        {geo && (
          <svg aria-hidden className="pointer-events-none absolute left-0 top-0 overflow-visible" width={geo.w} height={geo.h}>
            <defs>
              <radialGradient id="spark-glow">
                <stop offset="0" stopColor="var(--color-paper)" />
                <stop offset="0.3" stopColor="var(--color-hazmat)" />
                <stop offset="1" stopColor="var(--color-hazmat)" stopOpacity="0" />
              </radialGradient>
            </defs>
            {geo.ticks.map((t, i) => (
              <line key={i} x1={t.x1} x2={t.x2} y1={t.y} y2={t.y} stroke="var(--color-ink)" strokeWidth={2} strokeDasharray={i < lit ? undefined : "4 5"} strokeLinecap="round" opacity={i < lit ? 0.9 : 0.4} />
            ))}
            {/* the cord: a soft shadow on the sand, the rust body, a dark twist, a light catch along one side */}
            <path d={geo.d} fill="none" stroke="var(--color-ink)" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={0.15} transform="translate(3 5)" />
            <path ref={path} d={geo.d} fill="none" stroke="var(--color-rust)" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            <path d={geo.d} fill="none" stroke="var(--color-brick)" strokeWidth={7} strokeDasharray="2.5 5.5" strokeLinejoin="round" />
            <path d={geo.d} fill="none" stroke="var(--color-paper)" strokeWidth={1.2} strokeDasharray="2.5 5.5" strokeDashoffset={-3} strokeLinejoin="round" opacity={0.55} transform="translate(-1.5 -1.5)" />
            {/* burnt: a charred, thinner black trail with ash flecks */}
            <motion.path d={geo.d} fill="none" stroke="var(--color-paper)" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: burnt }} />
            <motion.path d={geo.d} fill="none" stroke="var(--color-ink)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: burnt }} />
            <motion.path d={geo.d} fill="none" stroke="var(--color-paper-dim)" strokeWidth={4} strokeDasharray="1 11" strokeLinejoin="round" style={{ pathLength: burnt }} />
            {!still && (
              <>
                {/* the last stretch behind the spark still glows */}
                <path ref={ember} d={geo.d} fill="none" stroke="var(--color-hazmat)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" className="[animation:fuse-ember_0.35s_steps(2)_infinite]" />
                <g ref={spark}>
                  <circle r={30} fill="url(#spark-glow)" className="[animation:fuse-flicker_0.18s_steps(2)_infinite]" />
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
                    <line
                      key={k}
                      x1={0} y1={0} x2={0} y2={-16}
                      stroke={k % 2 ? "var(--color-hazmat)" : "var(--color-rust)"}
                      strokeWidth={2}
                      strokeLinecap="round"
                      transform={`rotate(${k * 45 + (k % 3) * 11})`}
                      style={{ animation: `fuse-ray 0.5s ${k * 0.06}s ease-out infinite` }}
                    />
                  ))}
                  {[0, 1, 2].map((k) => (
                    <circle key={k} r={5} fill="var(--color-ink)" opacity={0} style={{ animation: `fuse-smoke 1.6s ${k * 0.5}s ease-out infinite` }} />
                  ))}
                  <circle r={4.5} fill="var(--color-paper)" />
                </g>
              </>
            )}
            {/* the pipe bomb the fuse runs into: taped steel pipe, end caps, a cheap timer wired across */}
            <g transform={`translate(${geo.w / 2} ${geo.h + 40})`} stroke="var(--color-ink)" strokeWidth={2}>
              <rect x={-44} y={-11} width={88} height={22} fill="var(--color-ink-soft)" />
              <rect x={-54} y={-15} width={12} height={30} fill="var(--color-ink)" />
              <rect x={42} y={-15} width={12} height={30} fill="var(--color-ink)" />
              <rect x={-30} y={-11} width={10} height={22} fill="var(--color-paper-dim)" opacity={0.7} />
              <rect x={20} y={-11} width={10} height={22} fill="var(--color-paper-dim)" opacity={0.7} />
              <rect x={-15} y={-27} width={30} height={14} fill="var(--color-ink)" />
              <text x={0} y={-17} textAnchor="middle" stroke="none" fill="var(--color-siren)" className="font-type" fontSize={8}>00:00</text>
              <path d="M-15 -22 C-34 -26 -46 -22 -48 -15" fill="none" stroke="var(--color-siren)" strokeWidth={1.5} />
              <path d="M15 -22 C34 -26 46 -22 48 -15" fill="none" stroke="var(--color-crystal)" strokeWidth={1.5} />
            </g>
          </svg>
        )}

        {/* not positioned: card offsets then measure from the column, the same box the fuse is drawn in */}
        <ol aria-label="Schedule" className="flex flex-col gap-14 pl-12 sm:gap-10 sm:pl-0">
          {SCHEDULE.map((s, i) => {
            const newDay = i === 0 || SCHEDULE[i - 1].day !== s.day;
            const on = i < lit;
            const isNow = i === now;
            const left = i % 2 === 0;
            return (
              <li
                key={s.title}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                className={`relative w-full sm:w-[38%] ${left ? "sm:self-start" : "sm:self-end"}`}
              >
                <button
                  type="button"
                  onClick={() => burnTo(i)}
                  aria-current={isNow ? "step" : undefined}
                  className={`group relative block w-full cursor-pointer text-left transition-[opacity,transform] duration-500 ease-out hover:-translate-y-1 hover:rotate-0 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-crystal ${on ? "" : left ? "-rotate-2 opacity-40 hover:opacity-80" : "rotate-2 opacity-40 hover:opacity-80"}`}
                >
                  <div
                    className={`relative overflow-hidden border-[3px] border-ink px-4 pb-3 pt-2.5 shadow-[4px_4px_0_var(--color-ink)] transition-[background-color,box-shadow] duration-700 group-hover:shadow-[6px_7px_0_var(--color-ink)] bg-paper`}
                    style={{ clipPath: CUT_EDGE }}
                  >
                    {newDay && (
                      <span className="absolute right-3 top-2.5 -rotate-6 border-2 border-brick px-1.5 py-0.5 font-stencil text-[11px] font-bold uppercase tracking-widest text-brick">
                        Day {s.day + 1} · {dayLabel(s.day)}
                      </span>
                    )}
                    <p className="font-display text-2xl leading-none tabular-nums sm:text-3xl">
                      {clock(s.time)}
                      {s.until && <span className="text-lg sm:text-xl"> – {clock(s.until)}</span>}
                    </p>
                    <h3 className="mt-1.5 font-stencil text-lg font-bold uppercase leading-tight tracking-wide">{s.title}</h3>
                    <p className="mt-1 font-type text-xs leading-snug text-ink-soft">{s.note}</p>
                  </div>
                </button>
                {/* food runs all day: a tag pinned in the free space beside the fuse, once per day */}
                {newDay && (
                  <p
                    className={`mt-4 inline-block rotate-2 border-2 border-ink bg-hazmat px-3 py-1 font-stencil text-xs font-bold uppercase tracking-wider text-ink shadow-[3px_3px_0_var(--color-ink)] sm:absolute sm:top-10 sm:mt-0 sm:whitespace-nowrap ${left ? "sm:left-[150%]" : "sm:right-[150%]"}`}
                  >
                    {FOOD_NOTE}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        {/* the fuse runs on past the last card, down toward the bomb */}
        <div className="h-[45vh]" />
      </div>
      {/* the boom: a jagged burst from the bomb fills the screen, then a white flash clears onto the payout */}
      <motion.div aria-hidden className="pointer-events-none fixed inset-0 z-30" style={{ visibility: boomShown }}>
        <motion.svg viewBox="-100 -100 200 200" className="absolute left-1/2 top-1/2 w-[30vmax] -translate-x-1/2 -translate-y-1/2 overflow-visible" style={{ scale: boomScale, opacity: boomFade }}>
          <defs>
            {/* a ragged fireball, not a comic star: soft hot core, burnt smoky rim, edge broken up by noise */}
            <radialGradient id="boom-fill">
              <stop offset="0" stopColor="white" />
              <stop offset="0.25" stopColor="var(--color-hazmat)" />
              <stop offset="0.55" stopColor="var(--color-rust)" />
              <stop offset="0.8" stopColor="var(--color-brick)" />
              <stop offset="1" stopColor="var(--color-ink)" stopOpacity={0.9} />
            </radialGradient>
            <filter id="boom-rough" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={3} seed={7} />
              <feDisplacementMap in="SourceGraphic" scale={34} />
            </filter>
          </defs>
          <circle r={90} fill="url(#boom-fill)" filter="url(#boom-rough)" />
        </motion.svg>
        <motion.div className="absolute inset-0 bg-white" style={{ opacity: flash }} />
      </motion.div>
    </section>
  );
}

/** The ragged top of a fresh print being laid over the scene before it (the section slides up over a pinned scene). */
export function TornEdge({ fill = "var(--color-paper)" }: { fill?: string }) {
  const pts = Array.from({ length: 61 }, (_, i) => `${(i / 60) * 1000},${(14 + Math.sin(i * 2.7) * 7 + Math.sin(i * 7.3) * 4).toFixed(1)}`);
  return (
    <svg aria-hidden viewBox="0 0 1000 30" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-full h-6 w-full translate-y-px">
      <polygon points={`0,30 ${pts.join(" ")} 1000,30`} fill={fill} />
    </svg>
  );
}
