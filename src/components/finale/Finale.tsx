"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { PeriodicTitle } from "@/components/comic/PeriodicTitle";
import { TornEdge } from "@/components/fuse/FuseTimeline";
import { CLUB, EVENT } from "@/data/site";

const GDG_BAR = ["bg-gdg-blue", "bg-gdg-red", "bg-gdg-yellow", "bg-gdg-green"];
const LINKS = [
  ["Website", CLUB.links.website],
  ["Instagram", CLUB.links.instagram],
  ["LinkedIn", CLUB.links.linkedin],
  ["GDG Community", CLUB.links.community],
] as const;

/**
 * ⑧ The finale: exactly one screen, and the page ends here. The night desert (moon, mesa line) carries both logos, the
 * club credit and the Register stamp; the desert floor below the mesas is the footer. The top bar steps away while
 * this is on screen (see TopBar), since the logos are already here.
 */
export function Finale() {
  const still = !!useReducedMotion();
  const rise = (delay: number) =>
    still
      ? {}
      : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.5 }, transition: { duration: 0.6, delay } };

  return (
    <footer id="register" className="relative z-10 flex min-h-[100svh] flex-col bg-ink-soft text-paper">
      <TornEdge fill="var(--color-midnight)" />
      {/* asset finale/sky: night sky, moon top right, mesa line along the bottom edge (the green ground cropped off) */}
      <div className="relative flex-1 overflow-hidden bg-midnight">
        <Image src="/scenes/finale/sky.webp" alt="" fill sizes="100vw" className="object-cover object-[70%_100%] portrait:object-[78%_100%]" />
        <div className="relative flex h-full flex-col justify-center px-4 pb-14 pt-8 sm:px-8 sm:pb-[12vh] sm:pt-12 md:px-16">
          {/* both marks, side by side: the club's and ours */}
          <motion.div {...rise(0)} className="flex items-center gap-4 sm:gap-5">
            <a href={CLUB.links.website} target="_blank" rel="noreferrer" aria-label={CLUB.name} className="grid size-12 shrink-0 sm:size-16 place-items-center rounded-full bg-paper p-2 print-shadow">
              <Image src="/assets/logo/gdg-mark.png" alt="" width={48} height={34} className="h-auto w-9 sm:w-12" />
            </a>
            <PeriodicTitle as="p" className="text-[clamp(1.9rem,4vw,3.4rem)]" />
          </motion.div>
          <motion.p {...rise(0.1)} className="mt-5 font-type text-xs uppercase sm:mt-6 sm:text-sm tracking-[0.25em] text-paper-dim">
            Presented by <span className="text-paper">{CLUB.name}</span>
          </motion.p>
          <motion.p {...rise(0.15)} className="mt-2 max-w-md font-type text-sm text-paper-dim sm:text-base">
            {EVENT.hours} hours · {EVENT.venue} · 2–3 Nov 2026 · {EVENT.entry}
          </motion.p>
          <motion.div {...rise(0.25)} className="mt-6 sm:mt-8">
            <Link
              href="/dashboard"
              className="inline-block -rotate-2 border-[3px] border-ink bg-crystal px-6 py-3 font-display text-base sm:px-7 sm:py-3.5 sm:text-lg uppercase tracking-wider text-ink print-shadow transition-transform hover:rotate-0 hover:scale-105"
            >
              Register your crew
            </Link>
          </motion.div>
        </div>
      </div>

      {/* the desert floor: footer, and the end of the page */}
      {/* phones: two tight columns and no blurb, so the whole finale still fits on one screen */}
      <div className="relative px-4 py-5 sm:px-8 sm:py-8 md:px-16">
        <div aria-hidden className="absolute inset-x-0 top-0 flex h-1">
          {GDG_BAR.map((c) => <span key={c} className={`flex-1 ${c}`} />)}
        </div>
        <div className="grid grid-cols-[1.15fr_1fr] gap-x-4 gap-y-4 sm:grid-cols-3 sm:gap-6">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-sm sm:text-base">{CLUB.name}</p>
            <p className="mt-1 hidden max-w-xs font-type text-sm text-paper-dim sm:block">{CLUB.about}</p>
          </div>
          <div>
            <p className="font-type text-xs uppercase tracking-[0.3em] text-rust">Call your guy</p>
            <ul className="mt-2 space-y-1 font-type text-xs sm:text-sm">
              {CLUB.contacts.map((c) => (
                <li key={c.name}>
                  <span className="block sm:inline">{c.name}</span>{" "}
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="text-crystal hover:underline">{c.phone}</a>
                </li>
              ))}
              <li>
                <a href={`mailto:${CLUB.email}`} className="whitespace-nowrap text-[11px] text-crystal hover:underline sm:text-sm">{CLUB.email}</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-type text-xs uppercase tracking-[0.3em] text-rust">Find us</p>
            <ul className="mt-2 flex flex-col gap-1 font-type text-xs sm:flex-row sm:flex-wrap sm:gap-x-4 sm:text-sm">
              {LINKS.map(([label, href]) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noreferrer" className="hover:text-crystal hover:underline">{label} ↗</a>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-type text-[10px] text-paper-dim/70 sm:mt-4 sm:text-[11px]">
              {EVENT.name} is a fan parody, not affiliated with any TV show or network. © 2026 {CLUB.short}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
