/**
 * Placeholder site content. In Phase 5 all of this moves to Supabase and is edited from /admin
 * (event_config, prizes, sponsors, faqs, schedule_items, contacts). Keep the shapes in sync with docs/DATABASE.md.
 */

export const EVENT = {
  name: "Breaking Bytes",
  tagline: "The Underground Hackathon",
  // TODO(admin): real date/time (UTC). Placeholder: a Saturday ~3 weeks out, 10:00 Gulf time.
  startsAt: "2026-11-07T06:00:00Z",
  venue: "BITS Pilani, Dubai Campus",
  hours: 24,
  expectedCooks: 200,
};

/** `day` = days after the event date (0 = cook day, 1 = the morning after). Times are local to the venue. */
export const SCHEDULE = [
  { day: 0, time: "10:00", title: "Crews assemble", note: "Form your crew of up to 4 and pick a supplier." },
  { day: 0, time: "12:00", title: "Precursors drop", note: "Problem statements unseal. The cook begins." },
  { day: 0, time: "20:00", title: "Night shift", note: "Mentor inspections. Quality control, Fring-style." },
  { day: 1, time: "08:00", title: "The dead drop", note: "Submission portal opens: repo, live link, demo tape." },
  { day: 1, time: "12:00", title: "Purity test", note: "Timers hit zero. Judges test every batch." },
];

export const RULES = [
  "Crews of 1–4 cooks.",
  "99.1% original code. No pre-cooked repos.",
  "Everything built inside the 24 hours.",
  "Respect the lab. Respect the crew.",
];

export const PRIZE_POOL_AED = 7000;
export const PRIZES = [
  { name: "The Heisenberg Cut", place: "1st", ratio: 6 },
  { name: "The Fring Distribution", place: "2nd", ratio: 4 },
  { name: "Saul's Retainer", place: "3rd", ratio: 2 },
  { name: "Pinkman's Stash", place: "Student", ratio: 1, jesseOnly: true },
  { name: "Pinkman's Stash", place: "Student", ratio: 1, jesseOnly: true },
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
  { item: "Family Meal", detail: "Food partners keep the cooks fed", price: "FREE" },
];

export const FAQS = [
  { q: "Who can join?", a: "Anyone who can cook code. Students, grads, professionals. Crews of 1–4." },
  { q: "Walter or Jesse?", a: "Sign in with a partner-university Google account and you're a Jesse: eligible for the student stash. Everyone else is a Walter." },
  { q: "Does it cost anything?", a: "No. Free to enter. Food's on the house." },
  { q: "Can I bring pre-built code?", a: "No pre-cooked repos. Libraries and boilerplate are fine; the product must be built during the 24 hours." },
  { q: "When do problems drop?", a: "Pick a supplier from 10:00. Problem statements unseal at 12:00 sharp for everyone at once." },
  { q: "What do I submit?", a: "GitHub repo, a live link, and a short demo video — before the timer hits zero." },
];

export const CONTACTS = [
  { name: "Organiser", role: "Lead", phone: "+971 00 000 0000" },
  { name: "Karan", role: "Co-lead", phone: "+971 00 000 0000" },
];
