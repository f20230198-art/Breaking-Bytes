"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { TornEdge } from "@/components/fuse/FuseTimeline";
import { SceneCanvas, bboxStyle } from "@/components/scene/SceneCanvas";
import { FAQS } from "@/data/site";
import { sceneAssets } from "@/scenes/config";

// the floating evidence, one layer per object (numbered left to right by split_items.py); one question each
const ITEMS = sceneAssets("pool").layers.filter((l) => l.id.startsWith("item-"));
const EVIDENCE = FAQS.slice(0, ITEMS.length).map((f, i) => ({ ...f, n: i + 1, layer: ITEMS[i] }));
// each piece bobs on its own beat, so the pool never moves in lockstep
const BOB = ["4.2s", "5.1s", "3.7s", "5.8s", "4.6s", "3.9s"];

/**
 * ⑦ FAQ: the evidence in the pool. Every floating thing carries a yellow numbered evidence marker and a slow ripple;
 * hover (or tap) one to pull up its evidence tag with the question, click for the answer.
 */
export function Faq() {
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const shown = hover ?? open;
  const active = shown === null ? null : EVIDENCE[shown];

  return (
    <div className="relative z-10">
    <TornEdge fill="var(--color-haze)" />
    <section id="faq" aria-labelledby="faq-title" className="relative flex flex-col overflow-hidden bg-haze landscape:block landscape:h-[100svh] landscape:min-h-[560px]">
      {/* portrait screens: the heading sits in its own strip of sky and the pool below is cropped to the evidence (left 60%) */}
      <div className="relative h-[95vw] landscape:absolute landscape:inset-0 landscape:h-auto">
      <SceneCanvas
        scene="pool"
        bg="bg-haze"
        overscan={1.02}
        focusX={0}
        anchorY={0.7}
        layerStyle={Object.fromEntries(
          EVIDENCE.map((e, i) => [e.layer.id, { animation: `pool-bob ${BOB[i]} ease-in-out ${-i * 0.7}s infinite` }]),
        )}
      >
        {EVIDENCE.map((e, i) => {
          const [x0, y0, x1] = e.layer.bbox!;
          const on = shown === i;
          return (
            <button
              key={e.n}
              type="button"
              aria-label={`Exhibit ${e.n}: ${e.q}`}
              aria-expanded={open === i}
              onPointerEnter={(ev) => ev.pointerType === "mouse" && setHover(i)}
              onPointerLeave={(ev) => ev.pointerType === "mouse" && setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => setOpen((o) => (o === i ? null : i))}
              className="group absolute cursor-zoom-in rounded-[40%] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crystal"
              // the open piece rises above its neighbours, so their markers never show through its tag
              style={{ ...bboxStyle(e.layer.bbox!), zIndex: on ? 20 : 1 }}
            >
              {/* a slow ripple on the water around the piece */}
              <span aria-hidden className={`pool-ripple ${on ? "opacity-0" : ""}`} style={{ animationDelay: `${-i * 0.9}s` }} />
              {/* the numbered evidence tent, floating at the piece's top corner */}
              <span
                aria-hidden
                className={`evidence-tent absolute font-display text-ink transition-transform duration-200 ${on ? "scale-125" : "group-hover:scale-110"}`}
                style={{ animation: `pool-bob ${BOB[i]} ease-in-out ${-i * 0.7}s infinite` }}
              >
                {e.n}
              </span>
              {/* landscape: the tag rises out of the water above the piece */}
              <AnimatePresence>
                {on && (
                  <motion.span
                    initial={{ opacity: 0, y: 16, rotate: -3 }}
                    animate={{ opacity: 1, y: 0, rotate: i % 2 ? 1.5 : -1.5 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`pointer-events-none absolute bottom-[calc(100%+2.2rem)] hidden w-[min(22rem,80vw)] text-left landscape:block ${x0 < 0.15 ? "left-0" : x1 > 0.85 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                    style={{ top: y0 < 0.2 ? "100%" : undefined }}
                  >
                    <Tag n={e.n} q={e.q} a={open === i ? e.a : null} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </SceneCanvas>
      </div>

      {/* the case file, high in the empty sky; it steps aside while a tag is open so the two never overlap */}
      <div
        className={`pointer-events-none relative order-first px-4 pb-4 pt-20 text-center transition-opacity duration-300 landscape:absolute landscape:inset-x-4 landscape:top-14 landscape:p-0 ${shown !== null ? "landscape:opacity-0" : ""}`}
      >
        <h2 id="faq-title" className="font-display text-4xl leading-none text-ink sm:text-5xl">
          Questions?
        </h2>
        <p className="mt-2 font-type text-sm text-ink/80">
          <span className="hidden pointer-fine:inline">Hover the numbered evidence.</span>
          <span className="pointer-fine:hidden">Tap the numbered evidence.</span>
        </p>
      </div>

      {/* portrait screens: the tag drops over the heading strip, so the pool and its markers stay in view */}
      <AnimatePresence>
        {active && open !== null && (
          <motion.div
            key={active.n}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-4 top-16 z-10 landscape:hidden"
          >
            <Tag n={active.n} q={active.q} a={active.a} onClose={() => setOpen(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* every question and answer for screen readers, in order */}
      <dl className="sr-only">
        {FAQS.map((f) => (
          <div key={f.q}>
            <dt>{f.q}</dt>
            <dd>{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
    </div>
  );
}

/** An evidence-bag tag: stamped exhibit number, the question typed on, the answer below once opened. */
function Tag({ n, q, a, onClose }: { n: number; q: string; a: string | null; onClose?: () => void }) {
  return (
    <span className="block border-[3px] border-ink bg-paper p-4 text-ink print-shadow">
      <span className="flex items-center justify-between gap-3">
        <span className="border-2 border-brick px-2 py-0.5 font-display text-xs uppercase tracking-widest text-brick">Exhibit {n}</span>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label="Close" className="px-2 font-display text-lg leading-none">
            ×
          </button>
        ) : (
          !a && <span className="font-type text-[11px] uppercase tracking-wider text-ink/60">click to open</span>
        )}
      </span>
      <span className="mt-3 block font-display text-lg leading-tight">{q}</span>
      {a && <span className="mt-2 block border-t-2 border-dashed border-ink/30 pt-2 font-type text-sm leading-snug">{a}</span>}
    </span>
  );
}
