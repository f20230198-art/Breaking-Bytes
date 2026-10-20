"use client";

import { createContext, useContext, type ReactNode } from "react";
import { EVENT, FAQS, PRIZES, SCHEDULE, SUPPLIERS, prizeAmount } from "@/data/site";

/** What the landing page shows that organisers can change in /admin. */
export type Site = {
  startsAt: string;
  dates: string;
  schedule: { day: number; time: string; until?: string; title: string; note: string }[];
  prizes: { name: string; place: string; amount: number; jesseOnly?: boolean }[];
  sponsors: { symbol: string; name: string; number: number; track: string; logo?: string }[];
  faqs: { q: string; a: string }[];
};

/** The built-in placeholders (src/data/site.ts): used until the database answers, and whenever it can't. */
export const FALLBACK: Site = {
  startsAt: EVENT.startsAt,
  dates: EVENT.dates,
  schedule: SCHEDULE,
  prizes: PRIZES.map((p) => ({ name: p.name, place: p.place, amount: prizeAmount(p.ratio), jesseOnly: p.jesseOnly })),
  sponsors: SUPPLIERS,
  faqs: FAQS,
};

const SiteContext = createContext<Site>(FALLBACK);
export const useSite = () => useContext(SiteContext);

export function SiteProvider({ value, children }: { value: Site; children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
