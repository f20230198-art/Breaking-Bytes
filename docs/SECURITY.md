# Security Plan

## Threats that matter for a hackathon portal
(Your users are hackers. Assume someone *will* open devtools.)
1. Submitting/editing after the deadline by tampering with the client timer.
2. Non-leaders locking problems; joining full/locked teams; being in two teams.
3. Reading other teams' submissions or invite codes.
4. Brute-forcing invite codes (`ABQ-XXXXX`).
5. Leaked service-role key / env secrets.
6. XSS via team names, notes, or submitted URLs (`javascript:` links).
7. Spam/bot signups, API flooding on event day.

## Review 2026-10-20: status

Verified by `supabase/tests/database/rules.test.sql` (60 pgTAP checks) and a live attack run against the local API
(28 attempts as a signed-out visitor and as an ordinary hacker; all refused).

- [x] RLS on every table (15/15). Hackers have **no** write policies: every action is a `security definer` RPC with
  `search_path = ''`. Internal helpers (`_me`, `_cfg`, `_my_team`, ...) are not executable by `anon`/`authenticated`.
- [x] Deadlines, the supplier window, the problem drop and roster freeze are enforced in SQL on `now()`; the client
  countdown only offsets itself against `server_time()`.
- [x] Leader-only actions, one crew per person, crew cap (trigger on every write path), supplier caps (row lock),
  problem caps, bans and disqualification are all checked in the database.
- [x] Invite codes: `ABQ-` + 5 chars from a 32-letter alphabet (≈33.5M), generated server-side; `join_team` allows
  10 attempts per user per minute (failed attempts are counted).
- [x] Teammates are read through `my_crew()` (names, avatars, badges only: no emails or phones).
- [x] Problem statements are unreadable (RLS) before `problems_release_at`.
- [x] Admin = `admin_emails` allowlist only; the role can't be set through the API (trigger); every admin write is
  recorded in `admin_audit` by a trigger. Admin pages are client-gated, but the data is gated by RLS.
- [x] Only the anon key reaches the browser; the service-role key is never used by the app. No secrets in git or its
  history (checked). `npm audit --omit=dev`: 0 vulnerabilities.
- [x] Links must match `^https://` (DB check + RPC), so no `javascript:`; React escapes all text; problem statements
  render as plain text; avatars must be https; CSV export neutralises formula injection.
- [x] Post-login redirects accept same-site paths only (`src/lib/safeNext.ts`); the redirect origin is
  `NEXT_PUBLIC_SITE_URL` in production. The dev email login is compiled out of production builds.
- [x] Sponsor logos: admin-only uploads, PNG/WebP/JPEG only (no SVG), 2 MB, enforced by the storage bucket.
- [x] Security headers (`next.config.ts`): CSP (`frame-ancestors 'none'`, `object-src 'none'`, connect/img limited to
  this site + Supabase + Google avatars), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP,
  HSTS in production, no `X-Powered-By`. Accepted trade-off: `script-src 'unsafe-inline'` (prerendered pages carry
  Next's inline bootstrap; nonces would make every page dynamic).
- [x] `robots.txt` keeps `/dashboard`, `/admin`, `/login`, `/auth` out of search engines; `/.well-known/security.txt`.

## Audit 2026-10-30 (migration `20261030120000_security_hardening.sql`, 78 pgTAP checks)

Full pass over migrations, RPCs, grants, storage, auth flow, proxy, redirects, headers, client sinks and dependencies.

- [x] **Fixed (critical): admin / Jesse from an unverified email.** The signup trigger read `auth.users.email` as-is,
  so `auth.signUp()` with the public anon key and an allowlisted (or partner-university) address got the admin role
  (or Jesse) whenever the Email provider was on, verified or not. Role and category now come from
  `_trusted_email()`: a confirmed address from a Google sign-in (`raw_app_meta_data`, set by Auth, not the user).
  A trigger on `auth.users` updates re-derives them when Auth confirms the address. Existing profiles were re-synced.
  Local dev escape: `dev_settings.trust_email_logins` (no API access; only `seed.sql` turns it on).
- [x] **Fixed: invite-code rate limit race.** `join_team` locks the caller's profile row first, so parallel requests
  can't all pass the 10-a-minute count.
- [x] **Fixed: pending / waitlisted crews competing.** `pick_supplier`, `lock_problem` and `upsert_submission` need
  `registration_status = 'accepted'` (`not_accepted`); supplier and problem caps count accepted crews only.
- [x] `team_category()` no longer executable over the API. CSV export also neutralises leading tab / CR.
- [x] Re-checked, no change needed: RLS 16/16 tables, no hacker write policies, every function grant, storage
  policies, `safeNext` redirects, POST-only sign-out, security headers, no secrets in git, `npm audit` 0.

## Before launch (hosted project)
- [ ] Supabase Auth: Google provider on, **Email provider off**, redirect URLs = production domain + localhost only.
- [ ] `NEXT_PUBLIC_SITE_URL` set to the production origin; `NEXT_PUBLIC_DEV_LOGIN` **not** set.
- [ ] Add organiser emails to `admin_emails`; set the real event times in /admin → Event.
- [ ] Run the Supabase Security Advisor; enable point-in-time backups or take a manual backup before the event.
- [ ] Dry run with fake crews on the hosted project (`npx supabase test db --linked` for the rules).
- [ ] Optional hardening if abuse appears: Cloudflare/Vercel rate limiting in front of the site.

## Audit 2026-10-30, round 2 (migration `20261030150000_crew_handover.sql`, 93 pgTAP checks)

- [x] **Fixed: crews left without a leader.** An admin removing or moving a crew's leader left `leader_id` pointing at
  someone outside the crew, so nobody could pick a supplier or lock a problem; removing the last member left an empty
  crew. One trigger now hands over / deletes on every write path.
- [x] **Fixed: roster removals broadcast to everyone.** Realtime can't apply RLS to DELETE events, so anyone subscribed
  to `team_members` saw every crew's removals (team and user ids). `team_members` and `announcements` left the
  publication; the crew page listens to its own `teams` row instead.
- [x] **Fixed: invite-code oracle.** `join_team` answered "already in a crew" / "need links" only for real codes; the
  caller is now checked before the lookup.
- [x] Added: admins can clear a squatted LinkedIn / GitHub link (links are format-checked only and unique per person).
- [x] Accepted: `teams` DELETE events still carry the deleted crew's id to any subscriber (an id of a crew that no
  longer exists); admins can insert rows into `admin_audit` through `_audit()` (always under their own id).
- [x] Re-checked from the live local database: function grants for `anon` / `authenticated` match intent, RLS on all
  16 tables, `npm audit` 0, production build and lint clean.
