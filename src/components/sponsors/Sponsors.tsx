"use client";
/* eslint-disable @next/next/no-img-element -- sponsor logos live in Supabase Storage, sizes unknown */

import { motion, useReducedMotion } from "motion/react";
import { TornEdge } from "@/components/fuse/FuseTimeline";
import { useSite } from "@/components/site/SiteContext";
import { CLUB, EVENT } from "@/data/site";

// card shadows rotate through the GDG colours: the one nod to the club's palette in this section
const SHADOWS = ["shadow-[5px_5px_0_var(--color-gdg-blue)]", "shadow-[5px_5px_0_var(--color-gdg-red)]", "shadow-[5px_5px_0_var(--color-gdg-yellow)]", "shadow-[5px_5px_0_var(--color-gdg-green)]"];

/**
 * ⑥ Sponsors: two local food businesses, who fund the prize pool (the only sponsors this year). No art, just a dusk-to-ink gradient and a row of paper
 * element cards with the sponsor's atomic number; the uploaded logo, else the element symbol. Cards lift in one after
 * another as the section scrolls in. Renders nothing until there is a visible sponsor in /admin.
 */
export function Sponsors() {
  const still = !!useReducedMotion();
  const SUPPLIERS = useSite().sponsors;
  if (!SUPPLIERS.length) return null;
  return (
    <section
      id="sponsors"
      className="relative z-10 bg-gradient-to-b from-ink via-night to-ink px-4 py-28 text-paper sm:px-8 md:py-36"
    >
      <TornEdge fill="var(--color-ink)" />
      {/* the backdrop is clipped on its own so the torn edge can poke out above the section */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* backdrop: a faint periodic-table grid, two lamp glows and a stencilled crate word, all behind the cards */}
      <div aria-hidden className="sponsor-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-10 size-[36rem] rounded-full bg-rust/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-40 bottom-0 size-[32rem] rounded-full bg-crystal/10 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -right-6 top-16 select-none font-stencil text-[22vw] leading-none text-paper/[0.04] md:text-[16vw]">
        CASH
      </span>
      </div>
      <div className="relative mx-auto max-w-5xl">
        <p className="font-type text-sm uppercase tracking-[0.3em] text-rust">Funding the cook</p>
        <h2 className="mt-3 font-display text-4xl leading-none sm:text-6xl">Our sponsors</h2>
        <div aria-hidden className="mt-5 flex h-1.5 w-28">
          <span className="flex-1 bg-gdg-blue" /><span className="flex-1 bg-gdg-red" /><span className="flex-1 bg-gdg-yellow" /><span className="flex-1 bg-gdg-green" />
        </div>
        <p className="mt-4 max-w-xl font-type text-paper-dim">
          No big backers for {EVENT.chapter}. These two local kitchens put up the prize money.
        </p>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPLIERS.map((s, i) => (
            <motion.li
              key={`${s.number}-${s.name}`}
              initial={still ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
              className={`group relative h-36 border-[3px] border-ink bg-paper text-ink ${SHADOWS[i % SHADOWS.length]} transition-transform duration-200 hover:-translate-y-1`}
            >
              <span className="absolute left-4 top-3 font-type text-lg">{s.number}</span>
              <span className="absolute right-4 top-3 font-type text-xs uppercase tracking-widest text-brick">{s.track}</span>
              <div className="flex h-full flex-col items-center justify-center">
                {/* the uploaded logo (admin → Sponsors), else the element symbol stands in */}
                {s.logo ? (
                  <img src={s.logo} alt={s.name} loading="lazy" className="h-14 max-w-[70%] object-contain" />
                ) : (
                  <span className="font-display text-5xl leading-none">{s.symbol}</span>
                )}
                <span className="mt-2 font-type text-base uppercase tracking-wider">{s.name}</span>
              </div>
            </motion.li>
          ))}
          {/* the pitch for next time: an empty, dashed card waiting for a name */}
          <motion.li
            initial={still ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: SUPPLIERS.length * 0.12, ease: "easeOut" }}
            className="h-36 border-[3px] border-dashed border-paper/50 transition-colors hover:border-crystal hover:bg-paper/5"
          >
            <a href={`mailto:${CLUB.email}?subject=${encodeURIComponent("Backing Breaking Bytes: Chapter 2")}`} className="flex h-full flex-col items-center justify-center px-4 text-center">
              <span className="font-display text-3xl leading-none text-paper/80">?</span>
              <span className="mt-2 font-type text-base uppercase tracking-wider">Back Chapter 2</span>
              <span className="mt-1 font-type text-xs text-paper-dim">Your name here next time. Talk to us →</span>
            </a>
          </motion.li>
        </ul>

      </div>
    </section>
  );
}
