# Original Brief (verbatim, Gemini-generated)

> Kept for reference. `PLAN.md` supersedes this where they differ.

## 1. Overview & Architecture
Two-part web app for a 24-hour hackathon **"[Co]de [Br]eak: The Underground Hackathon"**. Gritty retro comic-book adaptation of Breaking Bad — thick black ink borders, halftone dots, desert golden-yellows, hazmat yellows, glowing "Meth Blue" accents.

1. `/` — scroll-driven comic journey with event timeline.
2. `/dashboard` — dark portal: form teams, lock problem statements, live countdown, submit project links.

## 2. Tech & Visual System
- Next.js App Router or React+Vite, Tailwind, Framer Motion, Lucide.
- Colors: Asphalt Black `#0B0C10`, Lab Steel `#161920`, Golden Sand `#E5A93C`, Hazmat Yellow `#F5C518`, Crystal Blue `#00E5FF`, Toxic Green `#1F6E3D`, DEA Siren Red `#E63946`.
- `border-4 border-black`, `shadow-[6px_6px_0px_#000000]`, halftone radial-gradient overlay.
- `<PeriodicTitle />`: wraps first two letters ([Co], [Br]) in periodic-table squares with atomic numbers.

## 3. `/` Hero Page
- **A. Desert RV (above fold):** full-viewport panel, dust particles, rising green smoke, PeriodicTitle + "The Underground Hackathon", "TIME UNTIL THE RAID" LED countdown box, hazard-stripe CTA "ENTER THE SUPERLAB (LOGIN / DASHBOARD)".
- **B. The Proposition:** yellow caption boxes (team 1–4 Cooks, 99.1% original code, no pre-cooked repos). 3 prize barrels that tilt on hover: Heisenberg Cut / Fring Distribution / Saul's Retainer.
- **C. Cook Schedule:** central glass pipe fills with Crystal Blue via `useScroll`; 5 panels go grayscale→color:
  1. Better Call Saul (09:00) — Team formation
  2. Securing Precursors (10:00) — Problem statements drop
  3. The 24-Hour Cook (11:30) — Hacking + mentor checks
  4. The Dead Drop (08:00 next day) — Submissions open
  5. Purity Testing (10:00 next day) — Deadline & judging
- **D. Vault Door footer:** "START COOKING → GO TO PORTAL".

## 4. `/dashboard`
- Sticky header: logo, team name + copyable burner invite code, live countdown (pulses red < 1h).
- **Tab 1 The Crew:** no team → "Start a Syndicate" (name → code like `ABQ-991`) / "Join via Burner Code" keypad. In team → DEA corkboard roster, 4 slots, Leave Crew / Lock Roster.
- **Tab 2 The Formulas:** track filter (All, AI/ML, Cybersecurity, Web3, Open Innovation), dossier cards (ID, title, track, Toxicity Level, preview), slide-over modal, leader-only "Lock In This Formula", locked one pinned on top.
- **Tab 3 The Dead Drop:** Evidence Locker; Batch Purity bar 0→33→66→99.1% as 3 URLs validate (GitHub / https deployment / demo video); notes textarea; red "SHIP THE BATCH" → blue crystal confetti + "Submission Verified — 99.1% Pure"; editable until timer hits 0, then disabled.

## 5. Mock data
5 problem statements, mock user, mock team, LocalStorage, admin toggle "Timer Running" vs "Timer Expired". Image placeholders `<div className="comic-panel-img">` with comments.
