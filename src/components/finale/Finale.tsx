"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { TornEdge } from "@/components/fuse/FuseTimeline";
import { CLUB, EVENT } from "@/data/site";

const GDG_BAR = ["bg-gdg-blue", "bg-gdg-red", "bg-gdg-yellow", "bg-gdg-green"];

/**
 * ⑧ The finale: the empty night desert (moon, mesa line) with the club and the Register stamp in the sky, and the
 * desert floor below the mesas turned into the footer (contacts, email, socials).
 */
export function Finale() {
  const still = !!useReducedMotion();
  const rise = (delay: number) =>
    still
      ? {}
      : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.5 }, transition: { duration: 0.6, delay } };

  return (
    <footer id="register" className="relative z-10 bg-ink-soft text-paper">
      <TornEdge fill="var(--color-midnight)" />
      {/* asset finale/sky: night sky, moon top right, mesa line along the bottom edge (the green ground cropped off) */}
      <div className="relative min-h-[100svh] overflow-hidden bg-midnight">
        <Image src="/scenes/finale/sky.webp" alt="" fill sizes="100vw" className="object-cover object-[70%_100%]" />
        <div className="relative flex min-h-[100svh] flex-col justify-center px-4 pb-[18vh] pt-28 sm:px-8 md:px-16">
          <motion.div {...rise(0)} className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-paper p-1.5 print-shadow">
              <Image src="/assets/logo/gdg-mark.png" alt="" width={40} height={28} className="h-auto w-9" />
            </span>
            <span className="font-type text-sm uppercase leading-tight tracking-[0.2em] text-paper-dim">
              Presented by
              <br />
              <span className="text-paper">{CLUB.name}</span>
            </span>
          </motion.div>

          <motion.h2 {...rise(0.1)} className="mt-8 max-w-xl font-display text-5xl leading-[0.95] sm:text-7xl">
            Say my name.
          </motion.h2>
          <motion.p {...rise(0.2)} className="mt-5 max-w-md font-type text-lg text-paper-dim">
            {EVENT.hours} hours. {EVENT.venue}. 2–3 Nov 2026. {EVENT.entry} {EVENT.crew}
          </motion.p>

          <motion.div {...rise(0.3)} className="mt-10">
            <Link
              href="/dashboard"
              className="inline-block -rotate-2 border-[3px] border-ink bg-crystal px-8 py-4 font-display text-xl uppercase tracking-wider text-ink print-shadow transition-transform hover:rotate-0 hover:scale-105"
            >
              Register your crew
            </Link>
          </motion.div>
        </div>
      </div>

      {/* the desert floor: footer */}
      <div className="relative -mt-px px-4 py-14 sm:px-8 md:px-16">
        <div aria-hidden className="absolute inset-x-0 top-0 flex h-1">
          {GDG_BAR.map((c) => <span key={c} className={`flex-1 ${c}`} />)}
        </div>
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-lg">{CLUB.name}</p>
            <p className="mt-2 max-w-xs font-type text-sm text-paper-dim">{CLUB.about}</p>
          </div>
          <div>
            <p className="font-type text-xs uppercase tracking-[0.3em] text-rust">Call your guy</p>
            <ul className="mt-3 space-y-2 font-type text-sm">
              {CLUB.contacts.map((c) => (
                <li key={c.name}>
                  {c.name}{" "}
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="text-crystal hover:underline">{c.phone}</a>
                </li>
              ))}
              <li>
                <a href={`mailto:${CLUB.email}`} className="text-crystal hover:underline">{CLUB.email}</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-type text-xs uppercase tracking-[0.3em] text-rust">Find us</p>
            <ul className="mt-3 space-y-2 font-type text-sm">
              {([["Website", CLUB.links.website], ["Instagram", CLUB.links.instagram], ["LinkedIn", CLUB.links.linkedin], ["GDG Community", CLUB.links.community]] as const).map(([label, href]) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noreferrer" className="hover:text-crystal hover:underline">{label} ↗</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-12 font-type text-xs text-paper-dim/70">
          {EVENT.name} is a fan parody. Not affiliated with any TV show or network. © 2026 {CLUB.short}
        </p>
      </div>
    </footer>
  );
}
