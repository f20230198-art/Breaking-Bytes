> **Art style locked: LINOCUT PRINT** (see asset-prompts/00-style-bible.md). Wherever this doc says hand-drawn/sketch/pencil, read it as linocut: carved black lines, cream paper, orange + crystal-blue inks. "Draws itself" animations become "ink rolls on / print reveals".

# Breaking Bytes — Full Website Vision (v2, scene-based)

> Start here. This supersedes the section lists in CONCEPT.md / PLAN.md wherever they differ.
> Theme: **100% Breaking Bad.** Design: our own twist (hand-drawn, cinematic, "Heisenberg's Notebook" style), so it's not a copy of the show's visuals.

## Priorities
| Surface | Effort | Bar |
|---|---|---|
| **Landing page `/`** | ★★★★★ | The best thing we've built. It's what people share |
| **Hacker portal `/dashboard`** | ★★★☆☆ | Good-looking, fast, clear. People work in it for 24h |
| **Admin `/admin`** | ★☆☆☆☆ | Plain black, simple text, functional. Only for the organisers and Karan |

## The two categories
| Category | Who | Prizes |
|---|---|---|
| **Walter White** ("the teachers") | Everyone (professionals, PhDs, non-partner emails) and also students | Competes for the top 3 |
| **Jesse Pinkman** ("the students") | Crews where **every** member signed in with a partner-university email | Competes for the top 3 **and** the 2 student-only prizes |

Assigned automatically from the email domain at login. If one Walter joins a Jesse crew, the crew becomes Walter.

---

## Landing page: the scenes

The page is a **single continuous journey through 8 scenes**. Each scene fills the screen and is *pinned* while you scroll: the scroll plays its animation (camera moves, things draw in), then a **transition** carries you into the next scene. Think of it as a short film you drive with the scroll wheel.

```
 ① THE DESERT ─dig down─► ② THE SUPERLAB ─flashback─► ③ THE CLASSROOM ─► ④ THE MONEY PILE
      (hero)               (about + schedule)          (rules, categories,       (prizes)
                                                         problems)
 ─► ⑤ A1A CAR WASH ─► ⑥ LOS POLLOS HERMANOS ─► ⑦ SAUL'S OFFICE ─► ⑧ BACK TO THE DESERT, NIGHT
     (sponsors)          (perks + food partners)    (FAQ + contact)     (final CTA + footer)
```

### ① The Desert: hero
- **You see:** a wide, detailed hand-drawn New Mexico desert at golden hour. Mesas, scrub, heat haze, drifting dust. **The RV** sits centre stage, beautifully detailed. The logo is up top, the **countdown** ("Time until the cook") is a rugged digital timer, and the **Enter the Lab** button sits below.
- **Hover the RV:** the RV turns into a **cutaway**: its side wall fades and slides away like an architect's cross-section, revealing the interior with the cook going on (glassware, blue glow, two figures in gas masks, smoke). Move off and the wall comes back. *Mobile:* tap the RV.
- **Hint:** a small handwritten "scroll to descend ↓" with a bouncing arrow.
- **Scroll → transition:** the camera tilts down *into the ground*. Sand, rock layers and pipes slide past (a cross-section of the earth) and we land in…

### ② The Superlab: what this is + the 24h schedule
- **You see:** the underground industrial lab: steel, yellow hazmat suits on hooks, tanks, pipework, cold light.
- **Content:**
  - A short intro on a clipboard: what Breaking Bytes is, 24 hours, ~200 cooks, date and venue.
  - **The Cook Schedule:** a horizontal pipe runs across the lab. As you scroll, **blue liquid flows through it** and lights up each milestone valve:
    10:00 Crews assemble and pick a supplier → 12:00 Problem statements drop, cooking starts → night shift + mentor inspections → next morning the Dead Drop opens → 12:00 Purity test (deadline + judging). *Times are tentative and editable in admin.*
- **Scroll → transition:** the camera pushes into a reflection on a steel tank, which dissolves into a flashback…

### ③ The Classroom: rules, categories, problems
- **You see:** Walt's high-school chemistry classroom. Chalkboard, lab benches, a big periodic table poster.
- **Content:**
  - **Chalkboard:** "Chemistry is the study of change" is chalk-crossed-out to "Hacking is the study of change." The rules write themselves in chalk: crews of 1–4, 99.1% original code, no pre-built repos.
  - **Walter vs Jesse:** two student-desk name cards ("Mr. White" / "Pinkman") explain the categories, with a "Which one am I?" hint about university email.
  - **The periodic table poster = the problem statements.** Each sponsor is an element tile (Deriv, .zero, Replit, …). **Before 12:00 the tiles are sealed** ("CLASSIFIED"); at drop time they unseal and you can click one to read the brief. New sponsor means a new tile, all from admin.
- **Scroll → transition:** chalk dust blows across the screen and clears into…

### ④ The Money Pile: prizes
- **You see:** the storage unit with the famous **mountain of cash** under a bare bulb, plus a few blue barrels.
- **Content:** prize amounts **count up like a money-counting machine** as they come into view:
  - The Heisenberg Cut (1st) · The Fring Distribution (2nd) · Saul's Retainer (3rd)
  - **Pinkman's Stash** ×2: student-only prizes, with a note on who qualifies
- Amounts come from admin. The total pool is split by the **6 : 4 : 2 : 1 : 1** ratio (the 3k/2k/1k/500/500 ratio), auto-calculated from whatever the pool ends up being, with manual override.
- **Scroll → transition:** a stack of bills gets swept into a duffel bag. Cut to the money being laundered…

### ⑤ A1A Car Wash: sponsors ("the money behind the operation")
- **You see:** the car wash in bright desert daylight, with the big roadside sign.
- **Content:** the **sponsors run through the wash**: each sponsor logo is on a car rolling through brushes and foam, coming out sparkling. Title sponsors also get the big roadside sign. Hover a car to pause it and show the sponsor name and link.
- **Scroll → transition:** the camera pans along the road to a fast-food sign…

### ⑥ Los Pollos Hermanos: special awards + food partners
- **You see:** the restaurant counter, menu board overhead, and **Gus** behind the counter (face kept in shadow or from behind, glasses glinting), calm and watching.
- **Content:** the **menu board** lists the *special awards* as menu items, e.g. "The Replit Combo: Best Idea → Replit subscriptions", plus food partners (meals served during the cook). All of it is editable in admin.
- **Scroll → transition:** a TV in the corner of the restaurant flips channel to a cheesy lawyer ad…

### ⑦ Saul's Office: FAQ + contact
- **You see:** the tacky strip-mall office: inflatable Statue of Liberty, fake columns, a CRT TV playing the ad.
- **Content:**
  - **FAQ as "Better Call Saul" ads:** each question is a channel on the CRT. Click to flip channels; static noise, then the answer appears on screen.
  - **Contacts as Saul-style business cards** on the desk (name, role, copy-phone/email buttons).
- **Scroll → transition:** walk out the office door into…

### ⑧ Back to the Desert, Night: final CTA + footer
- **You see:** the same desert as scene ①, now at **night**. The RV's door is open and blue light spills out. Full circle.
- **Content:** a big **"Let's cook → Enter the Lab"** button, the countdown again, and the footer (links, socials, contact, parody disclaimer: "Not affiliated with AMC. No chemistry teachers were harmed.").

### Global UI/UX for the landing page
- **Purity meter:** a small flask fixed in the corner fills from 0% to 99.1% across the 8 scenes. It has 8 tick marks; hover shows scene names and click jumps there. It's our navigation.
- **Top bar:** small logo (left), live countdown, and **Login / Enter the Lab** (right). Always visible, very minimal.
- **Skip intro / jump to info:** for people who just want dates and rules.
- **Sound (optional, off by default):** a toggle for ambient desert wind, lab hum and a cash-counter click. Never autoplay.
- **Mobile:** same scenes, simplified. Shorter pins, tap instead of hover, lighter images.
- **Reduced motion:** scenes become static images with fade-ins and no pinning.
- **Loader:** the logo draws itself (pencil, ink, green, blue crystal) while the first scene loads.
- **Easter eggs:** typing `say my name`; Konami code for blacklight mode; an ASCII RV in the devtools console; a "Jesse, we have to 404" page; a `/.well-known/security.txt` that winks at hackers.
- **All text content** (dates, prizes, sponsors, FAQ, contacts, schedule) is loaded from the database, so admin edits show up without touching code.

---

## Login and onboarding `/login`, `/onboarding`
- **Google sign-in only.** One button: "Sign in with Google".
- On first login, a one-screen onboarding: display name, phone (optional), and a T-shirt size if needed. The category is shown with its explanation: "You're a **Jesse** 🎓 (partner-university email detected)" or "You're a **Walter** 🧪". There's also a tip: "Student at a partner uni? Sign out and use your uni Google account."
- Fallback for universities that don't use Google: verify the uni email with a one-time code (only if needed).

---

## Hacker portal `/dashboard` — "The Lab"
Separate pages, not one long page. The visual style is the **night lab**: charcoal background, the same hand-drawn touches (tape, stamps, chalk notes), crystal-blue accents, clean readable UI on top. Subtle animations only.

**Shell (every page):** sidebar or top tabs (Overview · Crew · Formula · Dead Drop · Profile), the crew name and invite code, and the **live countdown** (pulses red in the last hour).

| Page | What happens |
|---|---|
| **Overview** `/dashboard` | A "Today's cook" checklist: ☐ crew formed ☐ supplier picked ☐ problem revealed ☐ links submitted. Next milestone and announcements from admin |
| **The Crew** `/dashboard/crew` | **Start a crew** (name → server makes an invite code like `ABQ-7K2Q9`) or **join with a code**. Roster of 4 as taped polaroids, with a **Walter/Jesse badge** live. Leader: lock roster / remove member. Member: leave crew |
| **The Formula** `/dashboard/formula` | **10:00–12:00:** the leader **picks a supplier (company)**, each with "x / cap slots left" so crews spread evenly; the problem itself is still sealed. **At 12:00 sharp** the dossier unseals and shows the full problem, requirements and judging criteria |
| **The Dead Drop** `/dashboard/submit` | Three links (GitHub repo / live URL / demo video) plus notes. The purity bar climbs 0 → 33 → 66 → 99.1% as each validates. **Ship the batch** gives blue-crystal confetti and a "Verified — 99.1% Pure" stamp. Editable until the deadline, then locked by the server |
| **Profile** `/dashboard/profile` | Name, email, category, uni |

---

## Admin `/admin` — plain and simple
Black background, plain text, tables and forms. Access only for **allowlisted admin emails** (you and Karan), checked by the server and the database.

| Page | Can do |
|---|---|
| **Overview** | Counts: users, crews, solo hackers, Walter vs Jesse crews, supplier fill levels, submissions in vs missing |
| **Event** | All timestamps (registration, supplier pick, problem drop, deadline), open/close registration, **"Release problems now"** button, extend deadline |
| **Sponsors** | Add/edit/remove, **upload logo**, tier (title / track / food / perk), website link, show/hide, order |
| **Problems** | One or more per sponsor: title, brief, requirements, criteria, capacity, published |
| **Prizes** | Total pool → auto split 6:4:2:1:1 (editable), prize names, plus **special awards** that can be non-cash (e.g. Replit subscriptions) |
| **Site content** | FAQ, schedule items, contacts, announcements |
| **Crews and users** | Search, rename, move member, change supplier, disqualify, ban/unban, set category manually |
| **Universities** | Partner domain list (`dubai.bits-pilani.ac.in`, …) |
| **Submissions** | Table of all links, filter, **export CSV** |
| **Judging** | Enter scores, then auto-rank: top 3 overall, then the top 2 Jesse crews not already in the top 3. Assign special awards |
| **Audit log** | Every admin action |

---

## Security and "proper website" checklist
- Every rule is enforced in the **database** (Supabase RLS + server functions): deadlines on the server clock, the problem drop time, leader-only actions, one crew per person, supplier caps without race conditions, admin allowlist, bans.
- **Logo uploads:** admin-only storage bucket, images only (PNG/SVG/WebP), size limit; SVGs are sanitised or converted to PNG.
- Input validation everywhere; links rendered safely; no raw HTML from users.
- **Security headers** (CSP, HSTS, no framing), rate limits on join/submit, Google-only auth.
- **Web hygiene:** `robots.txt` (index the landing page, block `/dashboard`, `/admin`, `/api`), `sitemap.xml`, OG/Twitter share image, favicon set, `/.well-known/security.txt`, a proper 404/500, analytics (privacy-friendly).
- A security review pass before launch, plus a test run of the event day with fake crews.

## Sponsors and money (tentative)
- Likely partners: **Deriv**, **.zero**, **Replit**, plus food sponsors. Prize pool hoped to reach about AED 15,000.
- Everything (names, logos, amounts, perks) is entered in admin, never hardcoded.
