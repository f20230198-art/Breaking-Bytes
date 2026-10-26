# Supabase Schema

> **Built 2026-10-20.** The source of truth is now `supabase/migrations/` (schema, RLS, hacker RPCs, admin + audit) with
> `supabase/seed.sql` for placeholder content and `supabase/tests/database/rules.test.sql` (pgTAP, 70 checks).
> Differences from the draft below: admins write tables directly (RLS `is_admin()` + an audit trigger on every table)
> instead of one RPC per admin action; teammates are read through `my_crew()` (no emails/phones); join attempts are
> rate-limited 10/min; the crew cap is enforced by a trigger on every write path. Local: `npx supabase start`,
> `npx supabase db reset`, `npx supabase test db`, `npx supabase gen types typescript --local > src/types/database.ts`.

## Original draft

## Tables
```
profiles      id (uuid = auth.users.id, PK), display_name, email (from Google), avatar_url, role ('hacker'|'admin'|'judge'),
              is_student bool, student_verified bool, university, banned bool, created_at
event_config  id (int, single row = 1), registration_open bool, starts_at, problems_release_at, submissions_open_at,
              deadline_at, roster_lock_at, problem_cap_slack int
partner_universities  id, name, domain_pattern (e.g. 'dubai.bits-pilani.ac.in' or '%.bits-pilani.ac.in'), active bool
              -- trigger on profile create / uni-email verify: if the email domain matches → is_student = student_verified = true
              -- profiles also gets: student_email (nullable, for the OTP fallback), university_id → partner_universities
sponsors      id, name, logo_url, website
problems      id text PK ('F-001'), sponsor_id → sponsors, title, track, toxicity (1–5), summary, body_md, criteria_md,
              capacity int (nullable → dynamic ⌈teams/problems⌉+slack), is_published bool
teams         id uuid PK, name (unique, 3–40 chars), invite_code (unique), leader_id → profiles, roster_locked bool,
              problem_id → problems (nullable), status ('active'|'disqualified'), created_at
              -- student_eligible = derived view: ALL members is_student AND student_verified (one non-student → ineligible)
              -- prize award logic: top 3 by score; then the top 2 student_eligible teams NOT already in the top 3
team_members  team_id → teams, user_id → profiles (UNIQUE: one team per user), joined_at, PK(team_id,user_id)
submissions   team_id PK → teams, repo_url, live_url, video_url, notes, updated_at, updated_by
prizes        id, rank, name, amount_aed, student_only bool, awarded_team_id (nullable)
admin_audit   id, admin_id, action, target_table, target_id, before jsonb, after jsonb, created_at
scores (opt)  judge_id, team_id, criterion, score
```

## RLS (every table: `enable row level security`)
- `profiles`: select own + teammates; update own (not `role`).
- `event_config`: select all authenticated; no writes from clients.
- `teams`: select own team only (plus name availability via RPC); **no direct insert/update/delete** — via RPCs.
- `team_members`: select rows of own team; writes only via RPCs.
- `problems`: select where `is_published and now() >= problems_release_at`, admins see all.
- `submissions`: select own team; writes only via RPC.

## RPCs (`security definer`, `set search_path = public`, validate `auth.uid()`)
| Function | Checks |
|---|---|
| `create_team(name)` | user not in a team; before roster_lock_at; generates collision-free code server-side; inserts team + leader member |
| `join_team(code)` | code exists; team not locked; < 4 members; user not in a team; rate-limited |
| `leave_team()` | if leader leaves: promote oldest member or delete empty team |
| `lock_roster()` | leader only |
| `lock_problem(problem_id)` | leader only; problem published; optional per-problem cap; before deadline |
| `upsert_submission(repo, live, video, notes)` | member of team; `now() between submissions_open_at and deadline_at`; URL regex + length checks |

All hacker RPCs also reject if `profiles.banned` or the team is disqualified. `lock_problem` does `select … for update` on the problem row and counts current teams against the cap.

**Admin RPCs** (check `role='admin'`, write `admin_audit`): `admin_update_event`, `admin_upsert_problem`, `admin_set_team_problem`, `admin_rename_team`, `admin_move_member`, `admin_disqualify_team`, `admin_ban_user`, `admin_verify_student`, `admin_award_prize`. Submission export = admin-only view `submissions_export`.

Auth: Google provider only, and email/password signups disabled in the Supabase dashboard.

`now()` in Postgres is the **only** clock that matters.

## Realtime
Subscribe to `team_members` filtered by `team_id` for live roster; RLS applies to Realtime.

## v2 changes (from VISION.md v2, 2026-10-15)
- **Categories:** `walter` (open) / `jesse` (student). `profiles.category` is derived from the email domain; crew category = `jesse` only if all members are `jesse`.
- **Supplier pick before the drop:** `teams.sponsor_id` (chosen 10:00–12:00, capped per sponsor), then `teams.problem_id` is set/revealed at `problems_release_at`. Problem bodies are unreadable (RLS) before release.
- **Sponsors:** add `tier` ('title'|'track'|'food'|'perk'), `logo_path` (Supabase Storage bucket `sponsor-logos`, admin-write, public-read), `sort_order`, `visible`.
- **Prizes:** `event_config.prize_pool_aed`; `prizes.ratio` (6,4,2,1,1 default), `amount_aed` override, `kind` ('cash'|'perk'), `perk_description`, `category_only` ('jesse' | null).
- **Site content tables:** `faqs`, `schedule_items`, `contacts`, `announcements`, all public-read, admin-write.
- **Admins:** `admin_emails` allowlist table; `role='admin'` granted only if the email is in it.

## Pre-registration (2026-10-26, migration `20261026120000_preregistration.sql`)
- **`event_config.portal_open`** (default false): the lab shows only Crew + Profile; Overview, Formula, Dead Drop and the
  countdowns stay hidden until an admin flips it on the Event page. **`event_config.seat_cap`**: the hall's headcount,
  shown as a tally on the admin Crews page.
- **`profiles.linkedin_url` / `github_url`**: canonical profile URLs only (`https://www.linkedin.com/in/<slug>`,
  `https://github.com/<user>`), enforced by check constraints via `_linkedin_ok()` / `_github_ok()`. The app normalises
  what people paste (`src/lib/profileLinks.ts`). `update_profile(name, phone, linkedin, github)` requires at least one
  (`need_a_link`); `create_team` / `join_team` refuse anyone without one.
- **`teams.registration_status`** (`pending` | `accepted` | `waitlisted`, default pending): set by admins only (no
  hacker write path). `join_team` refuses an accepted crew (`crew_accepted`): its seats are already counted. Leaving is
  still allowed. `my_crew()` returns the status; `admin_crews()` returns it plus every member's links.
- Walter/Jesse is no longer shown during pre-registration: student IDs are checked at the door.
