# Build Plan — [Br]eaking [B]ytes

## 0. Decisions so far
| Topic | Decision | Why |
|---|---|---|
| Framework | **Next.js App Router** (not Vite) | Server components + route handlers + middleware make Supabase auth and server-side deadline checks clean |
| Hosting | Railway (`output: "standalone"`) | User's choice |
| Backend | Supabase (Auth + Postgres + RLS + Realtime) | User's choice |
| Visual tone | **Hand-drawn realism ("Heisenberg's Notebook")**: pencil/ink/wash on cream paper, crystal blue the only saturated colour. Comic pop rejected 2026-10-15 (too close to Bit N Build) | Distinct + closer to the show
| Assets | AI raster (GPT image) for illustrations; SVG/CSS for UI chrome | See `ASSETS.md` |
| Animation | Framer Motion (`useScroll`, `useTransform`) + CSS keyframes for loops | Parallax via layered PNGs |

| Auth | **Google OAuth only** (Supabase Auth) | User decision 2026-10-15 |
| Admin | **Full in-app admin panel** at `/admin` (see §2b) | User decision |
| Problems | One problem statement per sponsor (2 sponsors so far), teams spread evenly across them | See §2c |
| Design benchmark | A reference site the user will provide as a screen-recording video; frames get extracted with ffmpeg and studied | Pending video |

## Prizes (placeholder until sponsors confirm), total AED 7,000
| # | Prize | Amount | Eligibility |
|---|---|---|---|
| 1 | The Heisenberg Cut | AED 3,000 | Open to all |
| 2 | The Fring Distribution | AED 2,000 | Open to all |
| 3 | Saul's Retainer | AED 1,000 | Open to all |
| 4 | Student prize A (name TBD, e.g. "The Pinkman Grant") | AED 500 | Student teams only |
| 5 | Student prize B (name TBD, e.g. "Jesse's Side Hustle") | AED 500 | Student teams only |

Student teams can also win the top 3; prizes 4 and 5 make sure students get something if professionals or PhDs take the top 3. Amounts live in config/DB, not hardcoded.

## Open questions
- [ ] Event date + exact start/end timestamps (timer source of truth).
- [ ] Final prize amounts and sponsor names/logos.
- [x] **Student team** = *every* member is a verified student (if one non-student joins, the whole team is not eligible). Show this live in the Crew tab: "Student-eligible ✓/✗".
- [x] If a student team wins a top-3 prize, the student prizes go to the next-best student teams (no double prizes).
- [x] **Student verification = university email domain.** Admins keep a `partner_universities` allowlist of domain patterns (e.g. `*.bits-pilani.ac.in` for BITS Dubai; the user will provide the rest). A matching email means verified student automatically; any other email (Gmail etc.) means **Open category**. The registration page and FAQ must explain clearly: "Sign in with your university Google account to qualify for the Student Stash prizes."
- [x] **Student email fallback (decided 2026-10-19):** add the one-time-code fallback below for universities not on Google.
- [ ] ⚠ Google-login caveat: this only works if the university email is a **Google account** (Google Workspace for Education). For partner unis on Microsoft 365, the fallback is: log in with any Google account, then **verify the uni email with a one-time code** sent to it (Supabase email OTP or Resend). Ask each partner uni which they use.
- [x] Problem allocation: **first-come with a dynamic cap** (§2c default). Decided 2026-10-19.
- [x] Registration: **anyone can join, no cap**; admin closes it via `registration_open`. Decided 2026-10-19.
- [ ] Should problem statements stay hidden until the 10:00 AM drop? (Default: yes, gated on the server.)
- [ ] Reference-site video for the design benchmark.

---

## 1. Hero page `/` — scene by scene

> **Superseded by `docs/CONCEPT.md` ("Issue #1")**: Bit N Build is the effort bar only; we don't copy its layout. Section order and mechanics come from CONCEPT.md. The A–D details below still apply where they don't conflict (pipe timeline, barrels, vault).

The page reads like flipping through a lab notebook. Each section is one notebook spread (taped sketches, annotations, arrows).

### A. "The Desert RV" (100vh, pinned briefly)
**Layers (back → front, parallax speeds):**
1. Sky gradient + halftone sun (CSS) — 0.1
2. Distant mesas (AI PNG, transparent) — 0.25
3. The RV (AI PNG, transparent) with faint smoke from the roof vent — 0.5
4. Foreground scrub/rocks + a hazmat suit lying on a chair (AI PNG) — 0.8
5. Dust particles (canvas or CSS) + green smoke rising from bottom (CSS blurred blobs / looping WebP)
6. UI: `PeriodicTitle`, subtitle, LED timer box (top-right), hazard CTA

**Motion:** on load, panel "inks in" (border draws, then color floods). On scroll, layers separate and the camera pushes toward the RV door → door becomes the transition into Section B.

**Notebook touches:** handwritten margin notes and arrows, a coffee ring, taped photos; a sticky-note tooltip on CTA hover ("Say my name… then log in.").

### B. "The Proposition" (rules + prizes)
- Left: 3 yellow caption boxes that slide in staggered (rules: crew size 1–4, 99.1% original, no pre-cooked repos, + code of conduct line).
- Right/below: a sketchbook drawing of two archetype characters shaking hands in the RV (placeholder).
- **Prize barrels:** 3 blue plastic barrels half-buried in sand (AI PNG each, transparent). Hover: tilt + lid pops + cash/crystals peek out. Mobile: tap.

### C. "The Cook Schedule" (scroll timeline)
- Center: SVG glass pipe (coded, not AI) with a `pathLength`-driven Crystal Blue fill tied to `useScroll` of the section.
- 5 milestone panels alternate left/right. Each has a small illustration (AI) shown `grayscale(1)` → `grayscale(0)` + scale pop when the liquid reaches its node. Node = a round-bottom flask that "bubbles" once lit.
- Mobile: pipe moves to left edge, panels stack on right.

### D. "The Lab Vault Door" (footer)
- Big circular steel vault door (AI PNG or SVG). On scroll into view the wheel rotates and the door swings open (CSS 3D rotateY) revealing blue glow + CTA "START COOKING → GO TO PORTAL".
- Footer strip: sponsors, socials, contact, "No chemistry teachers were harmed."

### Global hero polish
- Fonts: display = **Archivo Black** (grotesk, show-like); handwriting = **Permanent Marker** (labels) + **Caveat** (notes); LED = **DSEG7** (self-hosted) for timers.
- Halftone overlay utility class, paper-grain texture, panel gutters.
- Reduced-motion: disable parallax/pins, keep fades.
- Performance: WebP/AVIF, `next/image`, lazy-load below fold, LCP image ≤ 200 KB.

---

## 2. Dashboard `/dashboard`
Protected route (middleware redirects to `/login` if no session).

- **Header (sticky):** logo · team name + burner code (copy button, toast "Burner copied") · countdown (red pulse < 1h, "THE RAID IS HERE" at 0).
- **Tabs:** The Crew · The Formulas · The Dead Drop (Framer `AnimatePresence` slide/fade, URL synced `?tab=`).
- **The Crew:** create (server generates code `ABQ-XXX`) / join (keypad input). Roster as polaroids pinned on a corkboard with red string. Leader can lock roster / kick; members can leave. Realtime updates when someone joins.
- **The Formulas:** filter chips, dossier cards (manila folder look, "CLASSIFIED" stamp), slide-over modal; leader-only lock via RPC; locked dossier pinned with "LOCKED IN" stamp. Optional: problems hidden until drop time.
- **The Dead Drop:** evidence locker, 3 URL fields with live validation, purity bar (0/33/66/99.1), notes, "SHIP THE BATCH" → crystal confetti (canvas-confetti with custom blue shard shapes). Re-saving allowed until server deadline; after that the RPC rejects and UI disables.
- **Dev/admin toggle:** in dev only (`NODE_ENV !== 'production'` or admin role), floating switch "Timer Running / Expired".

---

## 2b. Admin panel `/admin` ("Gus's Office")
Gated by `profiles.role = 'admin'`, checked in middleware **and** in SQL. Plainer styling than the hacker portal, built for speed.
- **Overview:** counts (users, teams, solo users with no team, problem fill levels, submissions in vs missing), live countdown.
- **Event settings:** edit all `event_config` timestamps, pause/extend the deadline, toggle registration open/closed, set the problem drop time.
- **Problem statements:** CRUD with a markdown editor, sponsor, track, toxicity, capacity, publish/unpublish.
- **Teams:** search/filter, view members, rename (for offensive names), force-unlock/lock roster, move a member, reassign problem, disqualify, delete.
- **Users:** search, view profile and team, verify student status, **ban/unban** (a banned user can't log in or act; enforced in RLS via `profiles.banned`), promote to admin.
- **Submissions:** table of team / problem / repo / live / video / notes / last updated / late flag, each link clickable. **Export CSV**. Filters by problem and student-eligible. Optional quick link checks (repo exists / URL responds).
- **Judging (optional, phase 2):** judges score per criterion, then a leaderboard and prize assignment (top 3 + top 2 student-eligible, excluding top-3 winners).
- **Audit log:** every admin action is written to `admin_audit` (who, what, when, before/after).

## 2c. Problem allocation (even split across sponsors)
Inputs: N teams, P problems (1 per sponsor). Target: each problem gets ⌈N / P⌉ teams at most.
- **Default, "first-come with a dynamic cap":** when problems drop, cap = ⌈teams_registered / P⌉ (+ optional slack, e.g. +1). The leader locks a problem; the `lock_problem` RPC row-locks the problem (`FOR UPDATE`) and rejects it if full, so there are no race conditions. The UI shows "x / cap slots left" and greys out full ones. Admin can change the cap or slack live.
- **Alternative, "ranked preference + auto-assign":** leaders rank problems before the drop, then the admin presses "Assign", which runs a balanced assignment (round-robin by random order honoring preferences). It's fairer but takes away the "lock it in" moment.
- Admin can always override any team's problem.

---

## 3. Build phases
1. **Phase 1 — Foundation:** scaffold Next.js + Tailwind + Framer; design tokens; fonts; notebook primitives (`Spread`, `PeriodicTile`, `MarginNote`, `TapedPhoto`, `StampButton`, `LedTimer`, `PaperTexture`, `SketchReveal`). Placeholder assets.
2. **Phase 2 — Hero page** with placeholders, all scroll mechanics working. Responsive + reduced motion.
3. **Phase 3 — Dashboard on mock data** (`src/data/*`, localStorage) — full flow testable.
4. **Phase 4 — Assets:** generate per `ASSETS.md`, cut backgrounds, optimize, drop in.
5. **Phase 5 — Supabase:** migrations, RLS, RPCs, auth, swap mock hooks for real ones, Realtime roster.
6. **Phase 6 — Security hardening** per `SECURITY.md`; load test submission endpoint.
7. **Phase 7 — Deploy** to Railway, custom domain, smoke test, admin runbook for event day.
