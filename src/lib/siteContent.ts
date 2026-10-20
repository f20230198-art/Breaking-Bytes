import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { FALLBACK, type Site } from "@/components/site/SiteContext";
import type { Database } from "@/types/database";

const PLACE = ["1st", "2nd", "3rd"];
const fmtDay = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", ...o });

/** "16–17 Nov 2026", or "30 Nov – 1 Dec 2026" across a month boundary (Gulf time). */
function dateRange(start: string, end: string | null) {
  if (!end) return fmtDay(start, { day: "numeric", month: "short", year: "numeric" });
  const sameMonth = fmtDay(start, { month: "short" }) === fmtDay(end, { month: "short" });
  return sameMonth
    ? `${fmtDay(start, { day: "numeric" })}–${fmtDay(end, { day: "numeric", month: "short", year: "numeric" })}`
    : `${fmtDay(start, { day: "numeric", month: "short" })} – ${fmtDay(end, { day: "numeric", month: "short", year: "numeric" })}`;
}

/**
 * The landing page's editable content, from the database: public tables only, anon key, no cookies, so it is the
 * same for everyone and can be cached. Cached for a minute (admin edits show up within about that), and any failure
 * (no database configured, network down) falls back to the built-in placeholders instead of breaking the page.
 */
export async function getSite(): Promise<Site> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return FALLBACK;
  try {
    const db = createClient<Database>(url, key, {
      auth: { persistSession: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(4000) }) },
    });
    const [cfg, schedule, prizes, sponsors, faqs] = await Promise.all([
      db.from("event_config").select("starts_at, deadline_at").eq("id", 1).single(),
      db.from("schedule_items").select("*").order("sort_order"),
      db.from("prize_board").select("*").eq("kind", "cash").order("rank"),
      db.from("sponsors").select("name, symbol, tier, logo_path").eq("visible", true).order("sort_order"),
      db.from("faqs").select("q, a").eq("visible", true).order("sort_order"),
    ]);
    if (cfg.error || schedule.error || prizes.error || sponsors.error || faqs.error) return FALLBACK;
    const startsAt = cfg.data.starts_at ?? FALLBACK.startsAt;
    return {
      startsAt,
      dates: dateRange(startsAt, cfg.data.deadline_at),
      schedule: schedule.data.length
        ? schedule.data.map((s) => ({ day: s.day_offset, time: s.time_label, until: s.end_label ?? undefined, title: s.title, note: s.detail }))
        : FALLBACK.schedule,
      prizes: prizes.data.length
        ? prizes.data.map((p) => ({
            name: p.name ?? "",
            place: p.category_only === "jesse" ? "Student" : (PLACE[(p.rank ?? 1) - 1] ?? `${p.rank}th`),
            amount: Math.round((p.amount_aed ?? 0) / 50) * 50,
            jesseOnly: p.category_only === "jesse",
          }))
        : FALLBACK.prizes,
      sponsors: sponsors.data.map((s, i) => ({
        symbol: s.symbol ?? s.name.slice(0, 2),
        name: s.name,
        number: i + 1,
        track: s.tier,
        logo: s.logo_path ? `${url}/storage/v1/object/public/sponsor-logos/${s.logo_path}` : undefined,
      })),
      faqs: faqs.data.length ? faqs.data : FALLBACK.faqs,
    };
  } catch {
    return FALLBACK;
  }
}
