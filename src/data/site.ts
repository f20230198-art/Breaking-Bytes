/**
 * Placeholder site content. In Phase 5 all of this moves to Supabase and is edited from /admin
 * (event_config, prizes, sponsors, faqs, schedule_items, contacts). Keep the shapes in sync with docs/DATABASE.md.
 */

/** The organising club (from gdghacathon26.vercel.app). */
export const CLUB = {
  name: "GDG on Campus BITS Pilani Dubai",
  short: "GDG BPDC",
  about: "A student-run community for builders, learners and future engineers.",
  email: "gdsc@dubai.bits-pilani.ac.in",
  contacts: [
    { name: "Nishvan Anbumani", phone: "+971 50 488 5778" },
    { name: "Anannya Pareek", phone: "+971 50 352 1407" },
  ],
  links: {
    website: "https://www.gdgocbpdc.tech/",
    instagram: "https://www.instagram.com/gdg_bpdc/",
    linkedin: "https://www.linkedin.com/company/google-developer-group-bits-dubai/",
    community: "https://gdg.community.dev/gdg-on-campus-bits-pilani-dubai-united-arab-emirates/",
  },
};

export const EVENT = {
  name: "Breaking Bytes",
  tagline: "The Underground Hackathon",
  /** No big sponsors this year: the first batch, pitched as the start of a series. */
  chapter: "Chapter 1",
  chapterLine: "The First Batch",
  // 16 Nov 10:00 → 17 Nov 10:00 Gulf time (UTC+4); the live clock is Admin → Event.
  startsAt: "2026-11-16T06:00:00Z",
  dates: "16–17 Nov 2026",
  /** Chapter 1 is fully online; "Place, detail" (the Where card splits on the comma) */
  venue: "Online, from anywhere",
  hours: 24,
  expectedCooks: 200,
  // TODO(admin): confirm eligibility with the club
  eligibility: "Students, grads, pros. Anyone who can cook code.",
  crew: "1 to 4 cooks per crew.",
  entry: "Free to enter.",
};

/**
 * The run-of-show, read top to bottom along the fuse. `day` = days after the event date (0 = day one).
 * `until` marks a stretch rather than a moment. Times are Gulf time (UTC+4).
 * TODO(admin): tentative; confirm with the club.
 */
export const SCHEDULE: { day: number; time: string; until?: string; title: string; note: string }[] = [
  { day: 0, time: "10:00", title: "Problem statements drop", note: "Problem statements unseal in the lab. The 24-hour cook starts now, from wherever you are." },
  { day: 0, time: "23:59", title: "Crews freeze", note: "Last chance to join or change crews. Rosters lock at midnight." },
  { day: 1, time: "10:00", title: "Cook stops", note: "Timer hits zero. Submissions lock." },
  { day: 1, time: "14:00", title: "Top 10% shortlisted", note: "The purest batches make the cut." },
  { day: 1, time: "15:00", title: "Judging", note: "Shortlisted crews demo to the judges." },
  { day: 1, time: "17:00", title: "Winners announced", note: "Somebody walks out with the cash." },
];

/** An always-on note pinned beside the fuse once per day; none for the online Chapter 1. */
export const FOOD_NOTE: string | null = null;

export const RULES = [
  "Crews of 1–4 cooks.",
  "99.1% original code. No pre-cooked repos.",
  "Everything built inside the 24 hours.",
  "Respect the lab. Respect the crew.",
];

/** AED 1,000 in all, open to everyone (no student-only prizes any more). */
export const PRIZE_POOL_AED = 1000;
export const PRIZES = [
  { name: "The Cook's Cut", place: "1st", amount: 500 },
  { name: "The Distributor's Cut", place: "2nd", amount: 300 },
  { name: "The Lawyer's Cut", place: "3rd", amount: 200 },
];

/** Domains, chalked on the classroom board as element tiles (live list: Admin → Problems → Domains; the board fits 6). */
export const TRACKS = [
  { symbol: "Ag", number: 1, name: "Desert AgriTech" },
  { symbol: "Aq", number: 2, name: "Water & Climate AI" },
  { symbol: "Te", number: 3, name: "Off-Grid Connectivity" },
];

/** Chapter 1's food sponsors (the live list is in /admin → Sponsors; this is only the offline fallback). */
export const SUPPLIERS: { symbol: string; name: string; number: number; track: string; logo?: string }[] = [
  { symbol: "Sb", name: "Sam's Burger", number: 1, track: "food" },
  { symbol: "Bu", name: "Bubee Drinks Cafe", number: 2, track: "food" },
];

export const FAQS = [
  {
    q: 'Why "Chapter 1"?',
    a: "Because every empire starts in an RV. This is the first Breaking Bytes: no big backers, a small cash pot, 24 hours and whoever shows up to cook. Chapter 2 is already being written.",
  },
  { q: "Who can join?", a: "Anyone who can cook code. Students, grads, professionals. Crews of 1–4." },
  { q: "Does it cost anything?", a: "No. Free to enter, and you cook from wherever you are." },
  { q: "Can I bring pre-built code?", a: "No pre-cooked repos. Libraries and boilerplate are fine; the product must be built during the 24 hours." },
  { q: "When do problems drop?", a: "Problem statements unseal at 10:00 sharp on day one, for everyone at once. Your leader locks one in for the crew." },
  { q: "What do I submit?", a: "GitHub repo, a live link, and a short demo video — before the timer hits zero." },
];

export const CONTACTS = [
  { name: "Organiser", role: "Lead", phone: "+971 00 000 0000" },
  { name: "Karan", role: "Co-lead", phone: "+971 00 000 0000" },
];
