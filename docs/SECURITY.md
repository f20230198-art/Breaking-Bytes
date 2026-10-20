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

## Before launch (hosted project)
- [ ] Supabase Auth: Google provider on, **Email provider off**, redirect URLs = production domain + localhost only.
- [ ] `NEXT_PUBLIC_SITE_URL` set to the production origin; `NEXT_PUBLIC_DEV_LOGIN` **not** set.
- [ ] Add organiser emails to `admin_emails`; set the real event times in /admin → Event.
- [ ] Run the Supabase Security Advisor; enable point-in-time backups or take a manual backup before the event.
- [ ] Dry run with fake crews on the hosted project (`npx supabase test db --linked` for the rules).
- [ ] Optional hardening if abuse appears: Cloudflare/Vercel rate limiting in front of the site.
