"use client";
/* eslint-disable @next/next/no-img-element -- scene layers are pre-optimised WebP that must stack pixel-exact */

import { animate, motion, useInView, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PinnedScene, PushIn } from "@/components/scene/PinnedScene";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { Countdown } from "@/components/ui/Countdown";
import { StampButton } from "@/components/ui/StampButton";
import { CONTACTS, EVENT, FAQS, PRIZES, RULES, SCHEDULE, SPECIAL_AWARDS, SUPPLIERS, prizeAmount } from "@/data/site";
import { singles } from "@/scenes/config";

type P = { progress: MotionValue<number> };

/** Box positioned in canvas percentages, so it stays glued to the art at any viewport size. */
function At({ x, y, w, h, children, className = "" }: { x: number; y: number; w: number; h: number; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute ${className}`} style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, containerType: "size" }}>
      {children}
    </div>
  );
}

function SceneTitle({ kicker, title, progress, range = [0, 0.15], bottom = false }: { kicker: string; title: string; progress: MotionValue<number>; range?: [number, number]; bottom?: boolean }) {
  const o = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [30, 0]);
  return (
    <motion.div style={{ opacity: o, y }} className={`pointer-events-none absolute left-5 z-10 md:left-14 ${bottom ? "bottom-8" : "top-20 md:top-24"}`}>
      <p className="font-type text-xs uppercase tracking-[0.3em] text-hazmat">{kicker}</p>
      <h2 className="font-display text-4xl leading-none text-paper [text-shadow:3px_3px_0_#111] md:text-6xl">{title}</h2>
    </motion.div>
  );
}

/* ── Transition ①→②: dig straight down through the earth ───────────────────────────── */
export function DigDown() {
  const strata = singles["s2-superlab/strata"];
  return (
    <PinnedScene id="dig" label="Descending underground" length={1.6}>
      {(p) => <DigInner progress={p} src={strata.src} ratio={strata.height / strata.width} />}
    </PinnedScene>
  );
}
function DigInner({ progress, src, ratio }: P & { src: string; ratio: number }) {
  // image is taller than the screen; slide it up so we travel from surface to lab ceiling
  const y = useTransform(progress, [0, 1], ["0%", `-${(1 - 1 / ratio) * 100}%`]);
  const flash = useTransform(progress, [0.85, 1], [0, 1]);
  return (
    <div className="absolute inset-0 flex justify-center bg-ink">
      <motion.img src={src} alt="" style={{ y }} className="h-auto w-full max-w-none" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#111_95%)]" />
      <motion.div style={{ opacity: flash }} className="absolute inset-0 bg-crystal mix-blend-screen" />
      <p className="absolute bottom-10 left-1/2 -translate-x-1/2 font-type text-sm uppercase tracking-[0.3em] text-paper">Going under…</p>
    </div>
  );
}

/* ── ② The Superlab: what this is + the schedule pipe ──────────────────────────────── */
export function SuperlabScene() {
  return <PinnedScene id="superlab" label="The superlab" length={2.6}>{(p) => <Superlab progress={p} />}</PinnedScene>;
}
function Superlab({ progress }: P) {
  const fill = useTransform(progress, [0.2, 0.85], ["0%", "100%"]);
  const [lit, setLit] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setLit(Math.floor(Math.max(0, (v - 0.2) / 0.65) * SCHEDULE.length + 0.0001)));
  return (
    <>
      <PushIn progress={progress} to={1.08}>
        <SceneCanvas scene="s2-superlab" />
      </PushIn>
      <div className="absolute inset-0 bg-ink/55" />
      <SceneTitle kicker="Scene 02 · The Superlab" title="The Cook" progress={progress} />
      <div className="absolute inset-x-5 top-[38%] md:inset-x-14">
        <p className="mb-6 max-w-xl font-type text-sm text-paper md:text-base">
          {EVENT.hours} hours. ~{EVENT.expectedCooks} cooks. One underground lab. Build something so pure the judges can&apos;t look away.
        </p>
        {/* the pipe */}
        <div className="relative h-3 w-full rounded-full border-2 border-paper/70 bg-ink/80">
          <motion.div style={{ width: fill }} className="h-full rounded-full bg-crystal shadow-[0_0_18px_rgba(19,200,232,0.9)]" />
        </div>
        <ol className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
          {SCHEDULE.map((s, i) => (
            <li key={i} className={`carved border-2 border-ink p-3 transition-colors duration-500 ${i < lit ? "bg-paper text-ink print-shadow" : "bg-ink/70 text-paper/50"}`}>
              <div className={`font-display text-xl ${i < lit ? "text-ink" : ""}`}>{s.time}</div>
              <div className="font-display text-sm uppercase">{s.title}</div>
              <div className="mt-1 font-type text-xs">{s.note}</div>
            </li>
          ))}
        </ol>
        <p className="mt-3 font-type text-[11px] text-paper/60">Times are tentative.</p>
      </div>
    </>
  );
}

/* ── ③ The Classroom: rules, Walter vs Jesse, periodic table of suppliers ─────────── */
export function ClassroomScene() {
  return <PinnedScene id="classroom" label="The classroom" length={2.6}>{(p) => <Classroom progress={p} />}</PinnedScene>;
}
function Classroom({ progress }: P) {
  const strike = useTransform(progress, [0.08, 0.22], ["0%", "100%"]);
  const rulesO = useTransform(progress, [0.22, 0.35], [0, 1]);
  const cardsO = useTransform(progress, [0.45, 0.6], [0, 1]);
  return (
    <>
      <PushIn progress={progress} to={1.06} origin="40% 35%">
        <SceneCanvas scene="s3-classroom">
          {/* chalkboard */}
          <At x={13.5} y={12} w={51} h={35} className="flex flex-col justify-center px-[3cqw] font-type text-paper">
            <p className="text-[4.6cqw] leading-tight">
              Chemistry is the study of{" "}
              <span className="relative inline-block">
                matter
                <motion.span style={{ width: strike }} className="absolute left-0 top-1/2 h-[0.12em] -rotate-3 bg-paper" />
              </span>{" "}
              <span className="text-hazmat">change.</span>
            </p>
            <p className="mt-[1.5cqh] text-[4.6cqw] leading-tight">Hacking is the study of change.</p>
            <motion.ul style={{ opacity: rulesO }} className="mt-[5cqh] space-y-[1cqh] text-[3cqw]">
              {RULES.map((r) => <li key={r}>— {r}</li>)}
            </motion.ul>
          </At>
          {/* periodic poster = the suppliers (problems unseal at drop time) */}
          <At x={71.5} y={9.5} w={21} h={20} className="grid grid-cols-3 content-start gap-[4cqw] px-[4cqw]">
            {SUPPLIERS.map((s) => (
              <div key={s.symbol} className="flex aspect-square flex-col items-center justify-center border-[0.6cqw] border-ink bg-olive text-paper">
                <span className="font-type text-[5cqw]">{s.number}</span>
                <span className="font-display text-[15cqw] leading-none">{s.symbol}</span>
                <span className="font-type text-[5cqw]">SEALED</span>
              </div>
            ))}
          </At>
        </SceneCanvas>
      </PushIn>
      <SceneTitle kicker="Scene 03 · The Classroom" title="The Lesson" progress={progress} bottom />
      <motion.div style={{ opacity: cardsO }} className="absolute inset-x-5 bottom-28 grid gap-4 md:inset-x-auto md:bottom-8 md:right-20 md:w-[34rem] md:grid-cols-2">
        <div className="carved border-[3px] border-ink bg-paper p-4 text-ink print-shadow">
          <p className="font-type text-xs uppercase tracking-widest">Category</p>
          <p className="font-display text-2xl">Mr. White</p>
          <p className="mt-1 text-sm">Everyone. Pros, grads, PhDs. Competes for the top 3.</p>
        </div>
        <div className="carved border-[3px] border-ink bg-hazmat p-4 text-ink print-shadow">
          <p className="font-type text-xs uppercase tracking-widest">Category</p>
          <p className="font-display text-2xl">Pinkman</p>
          <p className="mt-1 text-sm">All-student crews from partner unis. Top 3 <b>and</b> the student stash.</p>
        </div>
      </motion.div>
    </>
  );
}

/* ── ④ The Money Pile: prizes counting up ──────────────────────────────────────────── */
export function MoneyScene() {
  return <PinnedScene id="money" label="The prizes" length={2.2}>{(p) => <Money progress={p} />}</PinnedScene>;
}
function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const c = animate(0, value, { duration: 1.6, ease: "easeOut", onUpdate: (v) => ref.current && (ref.current.textContent = Math.round(v).toLocaleString("en-US")) });
    return () => c.stop();
  }, [inView, value]);
  return <span ref={ref}>0</span>;
}
function Money({ progress }: P) {
  const o = useTransform(progress, [0.12, 0.3], [0, 1]);
  return (
    <>
      <PushIn progress={progress} to={1.1} origin="50% 60%">
        <SceneCanvas scene="s4-money" />
      </PushIn>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-transparent to-ink/80" />
      <SceneTitle kicker="Scene 04 · The Storage Unit" title="The Money Pile" progress={progress} />
      <motion.div style={{ opacity: o }} className="absolute inset-x-5 bottom-8 md:inset-x-14">
        <div className="grid grid-cols-3 gap-3 md:gap-5">
          {PRIZES.slice(0, 3).map((p) => (
            <div key={p.name} className="carved border-[3px] border-ink bg-paper p-3 text-ink print-shadow md:p-5">
              <p className="font-type text-xs uppercase">{p.place}</p>
              <p className="font-display text-2xl tabular-nums md:text-5xl">AED <Counter value={prizeAmount(p.ratio)} /></p>
              <p className="font-display text-xs uppercase md:text-sm">{p.name}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {PRIZES.slice(3).map((p, i) => (
            <div key={i} className="carved border-[3px] border-ink bg-hazmat px-4 py-2 text-ink print-shadow">
              <span className="font-display tabular-nums">AED <Counter value={prizeAmount(p.ratio)} /></span>{" "}
              <span className="font-type text-xs uppercase">{p.name}</span>
            </div>
          ))}
          <p className="font-type text-xs text-paper/80">Student stash: Pinkman crews only, and not already in the top 3.</p>
        </div>
      </motion.div>
    </>
  );
}

/* ── ⑤ The Car Wash: sponsors roll through ─────────────────────────────────────────── */
export function CarWashScene() {
  return <PinnedScene id="carwash" label="Sponsors" length={2.4}>{(p) => <CarWash progress={p} />}</PinnedScene>;
}
function CarWash({ progress }: P) {
  const car = singles["s5-carwash/car"];
  return (
    <>
      <SceneCanvas scene="s5-carwash" hide={["brushes"]}>
        {/* font size lives on the inner span: an element can't container-query itself */}
        <At x={3.2} y={6} w={20} h={23} className="flex items-center justify-center">
          <span className="font-display text-[11cqw] uppercase leading-none text-ink">Suppliers</span>
        </At>
        {SUPPLIERS.map((s, i) => (
          <Car key={s.symbol} progress={progress} index={i} total={SUPPLIERS.length} src={car.src} name={s.name} />
        ))}
        {/* brushes on top so cars pass "through" the wash */}
        <BrushesLayer />
      </SceneCanvas>
      <SceneTitle kicker="Scene 05 · The Car Wash" title="Clean Money" progress={progress} bottom />
    </>
  );
}
function BrushesLayer() {
  return <img src="/scenes/s5-carwash/brushes.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full" />;
}
function Car({ progress, index, total, src, name }: P & { index: number; total: number; src: string; name: string }) {
  // each car crosses the whole canvas; spacing in canvas % (not car widths) so they never bunch up
  const start = 0.05 + (index / total) * 0.75;
  const left = useTransform(progress, [start, start + 0.3], ["-26%", "104%"]);
  return (
    <motion.div style={{ left }} className="absolute top-[57%] w-[24%]">
      <img src={src} alt="" className="w-full" />
      <span className="absolute left-[30%] top-[38%] w-[34%] -rotate-1 bg-paper px-1 text-center font-display text-[1.1vw] uppercase text-ink">{name}</span>
    </motion.div>
  );
}

/* ── ⑥ Los Pollos: special awards on the menu board ────────────────────────────────── */
export function PollosScene() {
  return <PinnedScene id="pollos" label="Special awards" length={2}>{(p) => <Pollos progress={p} />}</PinnedScene>;
}
function Pollos({ progress }: P) {
  return (
    <>
      <PushIn progress={progress} to={1.06} origin="50% 20%">
        <SceneCanvas scene="s6-pollos">
          {/* the printed board has 4 panels: a header panel + one per award */}
          <At x={8.5} y={7} w={83} h={22} className="grid grid-cols-4">
            {[{ item: "Today's Specials", detail: "Side orders on top of the cash prizes.", price: "MENU" }, ...SPECIAL_AWARDS].map((a, i) => (
              <div key={a.item} className={`flex flex-col justify-center px-[3.2cqw] text-ink ${i === 0 ? "items-center text-center" : ""}`}>
                <span className={`font-display uppercase leading-none ${i === 0 ? "text-[2.2cqw] text-brick" : "text-[1.6cqw]"}`}>{a.item}</span>
                <span className="mt-[3cqh] font-type text-[1.05cqw] leading-tight">{a.detail}</span>
                <span className="mt-[3cqh] font-display text-[1.5cqw] text-brick">{a.price}</span>
              </div>
            ))}
          </At>
        </SceneCanvas>
      </PushIn>
      <SceneTitle kicker="Scene 06 · Los Pollos Hermanos" title="The Menu" progress={progress} range={[0, 0.1]} bottom />
    </>
  );
}

/* ── ⑦ Saul's Office: FAQ on the TV, contacts as business cards ────────────────────── */
export function SaulScene() {
  return <PinnedScene id="saul" label="FAQ and contact" length={1.4}>{(p) => <Saul progress={p} />}</PinnedScene>;
}
function Saul({ progress }: P) {
  const [ch, setCh] = useState(0);
  const [flip, setFlip] = useState(false);
  const go = (d: number) => {
    setFlip(true);
    setTimeout(() => { setCh((c) => (c + d + FAQS.length) % FAQS.length); setFlip(false); }, 260);
  };
  const f = FAQS[ch];
  return (
    <>
      <SceneCanvas scene="s7-saul">
        <At x={75.4} y={36.4} w={14.2} h={22.3} className="overflow-hidden rounded-[6%] bg-night">
          <div className={`absolute inset-0 flex flex-col justify-center p-[6cqw] text-paper transition-opacity duration-200 ${flip ? "opacity-0" : "opacity-100"}`}>
            <p className="font-type text-[6cqw] uppercase text-crystal">Ch. {ch + 1} · Better call us</p>
            <p className="mt-[2cqh] font-display text-[9cqw] leading-tight">{f.q}</p>
            <p className="mt-[2cqh] font-type text-[6.4cqw] leading-snug">{f.a}</p>
          </div>
          {flip && <div className="absolute inset-0 animate-pulse bg-[repeating-linear-gradient(0deg,#ddd_0_2px,#222_2px_4px)] opacity-70" />}
        </At>
      </SceneCanvas>
      <SceneTitle kicker="Scene 07 · Saul's Office" title="Better Call Us" progress={progress} range={[0, 0.1]} />
      <div className="absolute bottom-8 left-5 right-5 flex flex-wrap items-end justify-between gap-4 md:left-14 md:right-14">
        <div className="flex gap-3">
          {CONTACTS.map((c) => (
            <div key={c.name} className="carved -rotate-2 border-2 border-ink bg-paper px-4 py-3 text-ink print-shadow odd:rotate-1">
              <p className="font-display uppercase">{c.name}</p>
              <p className="font-type text-xs">{c.role}</p>
              <p className="font-type text-sm">{c.phone}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => go(-1)} className="border-2 border-ink bg-paper px-4 py-2 font-display text-ink print-shadow active:translate-y-0.5">◀ CH</button>
          <button onClick={() => go(1)} className="border-2 border-ink bg-crystal px-4 py-2 font-display text-ink print-shadow active:translate-y-0.5">CH ▶</button>
        </div>
      </div>
    </>
  );
}

/* ── ⑧ Back to the desert, night: final CTA ────────────────────────────────────────── */
export function NightScene() {
  return <PinnedScene id="night" label="Let's cook" length={1.6}>{(p) => <Night progress={p} />}</PinnedScene>;
}
function Night({ progress }: P) {
  const o = useTransform(progress, [0.1, 0.4], [0, 1]);
  return (
    <>
      <PushIn progress={progress} to={1.15} origin="70% 60%">
        <SceneCanvas scene="s8-night" />
      </PushIn>
      <motion.div style={{ opacity: o }} className="absolute inset-x-5 top-[22%] flex flex-col items-start gap-5 md:left-14">
        <h2 className="font-display text-5xl leading-none text-paper [text-shadow:3px_3px_0_#111] md:text-7xl">
          Let&apos;s <span className="text-crystal drop-shadow-[0_0_18px_rgba(19,200,232,0.7)]">cook.</span>
        </h2>
        <Countdown to={EVENT.startsAt} />
        <StampButton href="/dashboard">Enter the lab</StampButton>
      </motion.div>
    </>
  );
}
