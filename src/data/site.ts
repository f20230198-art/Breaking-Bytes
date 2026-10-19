/**
 * Placeholder site content. In Phase 5 all of this moves to Supabase and is edited from /admin
 * (event_config, prizes, sponsors, faqs, schedule_items, contacts). Keep the shapes in sync with docs/DATABASE.md.
 */

export const EVENT = {
  name: "Breaking Bytes",
  tagline: "The Underground Hackathon",
  // TODO(admin): confirm the start time. 2–3 Nov, 12:00 → 12:00 Gulf time (UTC+4).
  startsAt: "2026-11-02T08:00:00Z",
  venue: "BITS Pilani, Dubai Campus",
  hours: 24,
  expectedCooks: 200,
  // TODO(admin): confirm eligibility with the club
  eligibility: "Students, grads, pros. Anyone who can cook code.",
  crew: "1 to 4 cooks per crew.",
  entry: "Free to enter.",
};

/**
 * The run-of-show, read top to bottom along the fuse. `day` = days after the event date (0 = day one).
 * `until` marks a stretch rather than a moment. Times are local to the venue.
 * TODO(admin): tentative; confirm with the club.
 */
export const SCHEDULE: { day: number; time: string; until?: string; title: string; note: string }[] = [
  { day: 0, time: "10:00", title: "Registration opens", note: "Check in, grab your badge, find your crew." },
  { day: 0, time: "12:00", title: "Problem statements drop", note: "Pick your problem. The 24-hour cook starts now." },
  { day: 0, time: "12:00", until: "18:00", title: "Mentors on the floor", note: "Stuck? Flag one down. They're around all afternoon." },
  { day: 0, time: "18:00", title: "Head home", note: "The venue closes. The cook doesn't." },
  { day: 1, time: "12:00", title: "Cook stops", note: "Timer hits zero. Submissions lock." },
  { day: 1, time: "14:00", title: "Top 10% shortlisted", note: "The purest batches make the cut." },
  { day: 1, time: "15:00", title: "Judging", note: "Shortlisted crews demo to the judges." },
  { day: 1, time: "17:00", title: "Winners announced", note: "Somebody walks out with the cash." },
];

/** Always on, so it rides beside the fuse instead of taking a slot. */
export const FOOD_NOTE = "Food stalls open all day";

export const RULES = [
  "Crews of 1–4 cooks.",
  "99.1% original code. No pre-cooked repos.",
  "Everything built inside the 24 hours.",
  "Respect the lab. Respect the crew.",
];

export const PRIZE_POOL_AED = 7000;
export const PRIZES = [
  { name: "The Cook's Cut", place: "1st", ratio: 6 },
  { name: "The Distributor's Cut", place: "2nd", ratio: 4 },
  { name: "The Lawyer's Cut", place: "3rd", ratio: 2 },
  { name: "The Partner's Cut", place: "Student", ratio: 1, jesseOnly: true },
  { name: "The Rookie's Cut", place: "Student", ratio: 1, jesseOnly: true },
];
const RATIO_SUM = PRIZES.reduce((s, p) => s + p.ratio, 0);
export const prizeAmount = (ratio: number) => Math.round((PRIZE_POOL_AED * ratio) / RATIO_SUM / 50) * 50;

/** Sponsors double as the periodic table of problems: symbol + atomic number. */
export const SUPPLIERS = [
  { symbol: "Dv", name: "Deriv", number: 1, track: "FinTech" },
  { symbol: "Zo", name: ".zero", number: 2, track: "Open" },
  { symbol: "Rp", name: "Replit", number: 3, track: "AI / Tools" },
];

export const SPECIAL_AWARDS = [
  { item: "The Replit Combo", detail: "Best idea — Replit subscriptions", price: "PERK" },
  { item: "Night Shift Special", detail: "Best hack built after midnight", price: "TBA" },
];

export const FAQS = [
  { q: "Who can join?", a: "Anyone who can cook code. Students, grads, professionals. Crews of 1–4." },
  { q: "Walter or Jesse?", a: "Sign in with a partner-university Google account and you're a Jesse: eligible for the student stash. Everyone else is a Walter." },
  { q: "Does it cost anything?", a: "No. Free to enter. Food stalls are run by our sponsors." },
  { q: "Can I bring pre-built code?", a: "No pre-cooked repos. Libraries and boilerplate are fine; the product must be built during the 24 hours." },
  { q: "When do problems drop?", a: "Pick a supplier from 10:00. Problem statements unseal at 12:00 sharp for everyone at once." },
  { q: "What do I submit?", a: "GitHub repo, a live link, and a short demo video — before the timer hits zero." },
];

export const CONTACTS = [
  { name: "Organiser", role: "Lead", phone: "+971 00 000 0000" },
  { name: "Karan", role: "Co-lead", phone: "+971 00 000 0000" },
];
