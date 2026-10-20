"use client";
/* eslint-disable @next/next/no-img-element -- the shimmer strip must stack pixel-exact on the scene layers */

import { AnimatePresence, motion, useMotionValueEvent, type MotionValue } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { PeriodicTitle } from "@/components/comic/PeriodicTitle";
import { SceneCanvas, bboxStyle } from "@/components/scene/SceneCanvas";
import { EVENT, RULES } from "@/data/site";
import { DEPTHS, sceneAssets } from "@/scenes/config";
import { DesertFx, type TumbleState } from "./DesertFx";

const hero = sceneAssets("hero");
const layer = (id: string) => hero.layers.find((l) => l.id === id)!;
const rv = layer("rv").bbox!;
const [twX0, twY0, twX1, twY1] = layer("tumbleweed").bbox!;
const twCx = (twX0 + twX1) / 2, twCy = (twY0 + twY1) / 2, twR = (twX1 - twX0) / 2;

// tumbleweed run, as offsets from where it sits in the art (fractions of the canvas width)
const ROLL_FROM = 0.62, ROLL_TO = -0.3, ROLL_SPEED = 0.075, ROLL_REST = 2.5;
const LENS = 85; // gas-cloud lens radius, px
const EASE = "cubic-bezier(.16,1,.3,1)";
const SUN_DROP = 13; // % of canvas height the sky slides down at full night (sun sinks behind the mesas)

// chairs + mask are pulled toward the viewer: scaled around their feet, then nudged down/right
const [c0, c1, c2, c3] = layer("chairs").bbox!;
const CH = { scale: 1.1, dx: 0.03, dy: 0.05, ox: (c0 + c2) / 2, oy: c3 };
const placeX = (x: number) => CH.ox + (x - CH.ox) * CH.scale + CH.dx;
const placeY = (y: number) => CH.oy + (y - CH.oy) * CH.scale + CH.dy;
const split = c0 + (c2 - c0) * 0.72; // chairs on the left, gas mask on the right of the layer
const chairBox = [placeX(c0), placeY(c1), placeX(split), placeY(c3)];

// scroll phases of the hero's own 0..1 timeline
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const nightAt = (v: number) => c01((v - 0.05) / 0.8);
const liftAt = (v: number) => c01((v - 0.06) / 0.3);
const driveAt = (v: number) => c01((v - 0.38) / 0.4) ** 2;
export const FALL_FROM = 0.78;
export const fallAt = (v: number) => c01((v - FALL_FROM) / (1 - FALL_FROM));

// the gas mask's front lens ring, as fractions of the chairs layer (measured from the art). The page measures where this
// lands on screen at runtime, so the fall always pivots on the real lens whatever the window size.
export const LENS_RAW = { x: 0.2727, y: 0.7245, r: 0.0051 };
export type LensPx = { x: number; y: number; r: number };
const ZOOM = 5; // shallow on purpose: the art is soft past ~5x, the blob and vignette carry the rest of the fall
/** Camera zoom while falling into the lens (f = 0..1). */
export const fallScale = (f: number) => 1 + (ZOOM - 1) * f ** 2.2;

// a soft puff of gas around the cursor: overlapping blobs that slowly churn (t = seconds)
const PUFFS = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ a: (i / 7) * Math.PI * 2 + 0.4, k: 0.6 + (i % 3) * 0.25 }));
function gasCloud(t: number) {
  const blob = (dx: number, dy: number, r: number) =>
    `radial-gradient(circle calc(var(--lr) * ${r.toFixed(3)}) at calc(var(--lx) + var(--lr) * ${dx.toFixed(3)}) calc(var(--ly) + var(--lr) * ${dy.toFixed(3)}), #000 55%, rgba(0,0,0,.6) 75%, transparent 100%)`;
  const ring = PUFFS.map(({ a, k }, i) => {
    const d = 0.52 + 0.08 * Math.sin(t * k + i);
    return blob(Math.cos(a + t * 0.15) * d, Math.sin(a + t * 0.15) * d * 0.85, 0.5 + 0.09 * Math.sin(t * k * 1.3 + i * 2));
  });
  return [blob(0, 0, 0.78), ...ring].join(", ");
}

// the RV's own pixels decide where the visor shows (not its bounding box)
let rvAlpha: { data: Uint8ClampedArray; w: number; h: number } | null = null;
function loadRvAlpha(src: string) {
  const img = new Image();
  img.onload = () => {
    const w = 836, h = Math.round((w * img.height) / img.width);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    rvAlpha = { data: ctx.getImageData(0, 0, w, h).data, w, h };
  };
  img.src = src;
}
const onRv = (fx: number, fy: number) => {
  if (!rvAlpha) return true;
  const x = Math.floor(fx * rvAlpha.w), y = Math.floor(fy * rvAlpha.h);
  return rvAlpha.data[(y * rvAlpha.w + x) * 4 + 3] > 40;
};

/** ① The desert at dusk: hero. Scroll sets the sun; over the RV the cursor becomes a benzene-ring x-ray lens. Rendered inside the story's pinned stage. */
export function HeroStage({ progress, onLens }: { progress: MotionValue<number>; onLens?: (l: LensPx) => void }) {
  const tumble = useRef<TumbleState | null>(null);
  const nightRef = useRef(nightAt(progress.get()));
  const v0 = progress.get();
  const [night, setNight] = useState(() => nightAt(v0));
  const [lift, setLift] = useState(() => liftAt(v0)); // title block rises away
  const [drive, setDrive] = useState(() => driveAt(v0)); // RV pulls out to the right (eased: slow start, then it floors it)
  const [fall, setFall] = useState(() => fallAt(v0)); // camera falls into the gas mask lens
  const zoomRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<LensPx | null>(null);
  const zoomed = fall > 0 && origin !== null;

  // where the lens really is on screen: the chairs layer's own box, minus the mouse parallax it currently carries
  useLayoutEffect(() => {
    if (zoomed) return;
    const measure = () => {
      const el = zoomRef.current;
      const img = el?.querySelector<HTMLImageElement>('img[data-layer="chairs"]');
      if (!el || !img) return;
      const stage = el.parentElement!.getBoundingClientRect();
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      const mx = parseFloat(cs.getPropertyValue("--mx")) || 0, my = parseFloat(cs.getPropertyValue("--my")) || 0;
      const d = DEPTHS.hero.chairs ?? 0.3;
      const o = {
        x: r.left - stage.left + LENS_RAW.x * r.width + mx * d * 18,
        y: r.top - stage.top + LENS_RAW.y * r.height + my * d * 10,
        r: LENS_RAW.r * r.width,
      };
      setOrigin(o);
      onLens?.(o);
    };
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [zoomed, onLens]);
  // the churning gas cloud's clock; only ticks (and re-renders the hero) while the lens is actually open
  const [gasT, setGasT] = useState(0);
  const fallRef = useRef(0);
  useEffect(() => {
    fallRef.current = fall;
  }, [fall]);
  const [lens, setLens] = useState({ x: 50, y: 50, on: false, full: false });
  const lensOpen = useRef(false);
  useEffect(() => {
    lensOpen.current = lens.on || lens.full;
  }, [lens]);
  const [chairTip, setChairTip] = useState(false);

  useMotionValueEvent(progress, "change", (v) => {
    const n = nightAt(v);
    nightRef.current = n;
    setNight(n);
    setLift(liftAt(v));
    setDrive(driveAt(v));
    setFall(fallAt(v));
  });

  // roll the tumbleweed across the desert: spin matches distance travelled, small hops, wind gusts. Written straight to
  // the layer's style, not through React state, so the whole hero doesn't re-render 30 times a second just for this.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, last = performance.now(), lastPaint = 0, dx = ROLL_FROM, rest = 0, t = 0;
    let weed: HTMLElement | null = null;
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
      // ~30 fps is plenty for a tumbleweed; it stops once the fall into the mask starts
      if (fallRef.current === 0 && now - lastPaint >= 33) {
        lastPaint = now;
        weed ??= zoomRef.current?.querySelector<HTMLElement>('img[data-layer="tumbleweed"]') ?? null;
        if (weed) weed.style.transform = `translate3d(${dx * 100}%, ${-hop * 1.4}%, 0) rotate(${(dx / twR) * (180 / Math.PI)}deg)`;
        if (lensOpen.current) setGasT(t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => loadRvAlpha(layer("rv").src.replace(".webp", "-1280.webp")), []);

  const moveLens = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const b = e.currentTarget.parentElement!.getBoundingClientRect();
    const fx = (e.clientX - b.left) / b.width, fy = (e.clientY - b.top) / b.height;
    setLens({ x: fx * 100, y: fy * 100, on: onRv(fx, fy), full: false });
  };

  const par = (id: string, axis: "x" | "y") => `var(--m${axis}, 0) * ${-(DEPTHS.hero[id] ?? 0.3) * (axis === "x" ? 18 : 10)}px`;

  // the RV keeps its parallax, plus a slow pull-out to the right and a little suspension bob while it moves
  const rvDrive = `translate3d(calc(${par("rv", "x")} + ${drive * 108}%), calc(${par("rv", "y")} + ${drive > 0 && drive < 1 ? Math.sin(drive * 90) * 0.12 : 0}%), 0)`;

  const frozen = 1 - c01(fall * 30); // mouse parallax fades out as the fall starts, so the lens holds still

  return (
    <>
      <div
        ref={zoomRef}
        className="absolute inset-0"
        style={zoomed ? { transform: `scale(${fallScale(fall)})`, transformOrigin: `${origin.x}px ${origin.y}px`, willChange: "transform" } : undefined}
      >
      <SceneCanvas
        scene="hero"
        priority
        className="portrait:[--focus:0.19]" // phones: the RV and the gas mask, not the empty desert to the right
        overscan={1.02}
        bg="bg-dusk"
        plate={false}
        deferred={["rv-cutaway", "chairs", "tumbleweed"]}
        layerStyle={{
          // the sky sinks to drop the sun; it's scaled up from its bottom edge so the slide never exposes a gap at the top
          sky: {
            transformOrigin: "50% 100%",
            transform: `translate3d(calc(${par("sky", "x")}), calc(${par("sky", "y")} + ${night * SUN_DROP}%), 0) scale(${1 + night * SUN_DROP * 0.0125})`,
          },
          rv: { transform: rvDrive },
          "rv-cutaway": {
            transform: rvDrive,
            ["--lx" as string]: `${lens.x}%`,
            ["--ly" as string]: `${lens.y}%`,
            ["--lr" as string]: lens.full ? "2400px" : lens.on ? `${LENS}px` : "0px",
            transition: `--lr 420ms ${EASE}`,
            maskImage: gasCloud(lens.on || lens.full ? gasT : 0),
            WebkitMaskImage: gasCloud(lens.on || lens.full ? gasT : 0),
          },
          tumbleweed: {
            transformOrigin: `${twCx * 100}% ${twCy * 100}%`,
            // constant, so React never overwrites the roll the animation loop writes onto the element
            transform: `translate3d(${ROLL_FROM * 100}%, 0, 0)`,
          },
          chairs: {
            transformOrigin: `${CH.ox * 100}% ${CH.oy * 100}%`,
            transform: `translate3d(calc((${par("chairs", "x")}) * ${frozen} + ${CH.dx * 100}%), calc((${par("chairs", "y")}) * ${frozen} + ${CH.dy * 100}%), 0) scale(${CH.scale})`,
          },
        }}
      >
        {/* heat shimmer: a wobbling copy of the horizon band, right of the RV; it cools off at night */}
        {(
          <img
            src={layer("mesas").src}
            srcSet={layer("mesas").srcset}
            sizes={`(min-aspect-ratio: ${hero.width}/${hero.height}) 100vw, ${((100 * hero.width) / hero.height).toFixed(1)}vh`}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full select-none motion-reduce:hidden"
            style={{
              clipPath: `inset(47% 0 ${100 - 61}% ${rv[2] * 100 + 1}%)`,
              filter: night < 0.9 && drive < 0.04 ? "url(#heat)" : "none",
              opacity: (1 - night) * (1 - Math.min(1, drive * 25)), // gone once the RV starts to move
              transform: `translate3d(calc(${par("mesas", "x")}), calc(${par("mesas", "y")}), 0)`,
            }}
          />
        )}
        {/* night falls: cool the whole scene, the RV's doorway keeps its glow through the lens */}
        <div className="pointer-events-none absolute inset-0 bg-night mix-blend-multiply" style={{ opacity: night * 0.75 }} />
        <DesertFx tumble={tumble} night={nightRef} />

        <button
          type="button"
          aria-label={lens.full ? "Close the RV" : "Look inside the RV"}
          aria-pressed={lens.full}
          tabIndex={drive > 0.02 ? -1 : 0}
          onPointerMove={moveLens}
          onPointerLeave={() => setLens((l) => ({ ...l, on: false }))}
          onClick={(e) => {
            if ((e.nativeEvent as PointerEvent).pointerType === "mouse") return;
            setLens((l) => ({ x: ((rv[0] + rv[2]) / 2) * 100, y: ((rv[1] + rv[3]) / 2) * 100, on: false, full: !l.full }));
          }}
          className={`absolute focus-visible:outline-2 focus-visible:outline-crystal ${lens.on ? "cursor-none" : "cursor-default"}`}
          style={{ ...bboxStyle(rv), pointerEvents: drive > 0.02 ? "none" : "auto" }}
        />

        {/* the mask's lens always glows faintly: a hint that something is in there (and the start of the fall) */}
        <div
          aria-hidden
          className="lab-glow pointer-events-none absolute"
          style={{
            left: `${placeX(LENS_RAW.x) * 100}%`,
            top: `${placeY(LENS_RAW.y) * 100}%`,
            width: `${LENS_RAW.r * 16 * 100}%`,
            aspectRatio: "1",
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(19,200,232,0.95) 0, rgba(19,200,232,0.45) 28%, rgba(19,200,232,0.14) 52%, transparent 70%)",
            transform: `translate(-50%, -50%) translate3d(calc((${par("chairs", "x")}) * ${frozen}), calc((${par("chairs", "y")}) * ${frozen}), 0)`,
            opacity: 1 - c01(fall * 9),
          }}
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
      </SceneCanvas>

      <svg aria-hidden className="absolute size-0">
        {/* the filter region is just the visible strip (same box as the clip-path), not the whole full-screen image */}
        <filter id="heat" x={`${(rv[2] + 0.01) * 100}%`} y="47%" width={`${(0.99 - rv[2]) * 100}%`} height="14%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.06" numOctaves="1" seed="3" result="n">
            <animate attributeName="baseFrequency" dur="7s" values="0.004 0.06;0.004 0.075;0.004 0.06" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[60vw] bg-[radial-gradient(ellipse_at_60%_35%,rgba(17,17,17,0.45),transparent_65%)] portrait:inset-x-0 portrait:w-auto portrait:bg-[radial-gradient(ellipse_at_50%_25%,rgba(17,17,17,0.45),transparent_60%)]" />
      <div
        className="pointer-events-none absolute left-[52vw] right-[5vw] top-[17vh] portrait:inset-x-4 portrait:top-[13vh]"
        style={{ translate: `0 ${-lift * 55}vh`, opacity: 1 - lift }}
      >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="flex flex-col items-center"
      >
        <PeriodicTitle className="text-[clamp(2.75rem,6vw,7.25rem)]" />
        {/* inked outline + hard offset so the small lines read on the bright sunset */}
        <p className="mt-6 text-center font-display text-[clamp(0.95rem,1.35vw,1.6rem)] uppercase tracking-[0.35em] text-hazmat [paint-order:stroke_fill] [-webkit-text-stroke:0.22em_var(--color-ink)] [text-shadow:0.12em_0.12em_0_var(--color-ink)]">
          {EVENT.tagline}
        </p>
        <p className="mt-3 bg-ink/85 px-3 py-1 text-center font-type text-[clamp(0.75rem,0.95vw,1.05rem)] uppercase tracking-[0.3em] text-paper">
          {EVENT.hours} hours · {EVENT.venue}
        </p>
      </motion.div>
      </div>

      <p className="pointer-events-none absolute bottom-3 right-4 font-type text-[10px] text-paper/60">
        Fan-made parody · not affiliated with AMC or Sony Pictures Television
      </p>
    </>
  );
}
