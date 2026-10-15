# Security Plan

## Threats that matter for a hackathon portal
(Your users are hackers. Assume someone *will* open devtools.)
1. Submitting/editing after the deadline by tampering with the client timer.
2. Non-leaders locking problems; joining full/locked teams; being in two teams.
3. Reading other teams' submissions or invite codes.
4. Brute-forcing invite codes (`ABQ-XXX` = small space).
5. Leaked service-role key / env secrets.
6. XSS via team names, notes (markdown), or submitted URLs (`javascript:` links).
7. Spam/bot signups, API flooding on event day.

## Checklist
- [ ] RLS on every table; client has **no direct write** to teams/members/submissions — only `security definer` RPCs (see DATABASE.md).
- [ ] Deadlines enforced in SQL with `now()`; client timer is display only. Fetch server time offset on load.
- [ ] Invite codes: longer space (e.g. `ABQ-7K2Q9`, ~32^5), generated server-side, rate-limit `join_team` per user (e.g. 10/min) + log failures.
- [ ] Only `NEXT_PUBLIC_SUPABASE_URL` + anon key in browser. Service role key only in Railway server env, never imported in client components (`import 'server-only'`).
- [ ] Zod validation in route handlers/server actions **and** DB constraints (lengths, URL regex `^https://`).
- [ ] Render URLs only if scheme is `https:`; `rel="noopener noreferrer"`. Notes rendered as plain text or sanitized markdown (no raw HTML).
- [ ] Auth via Supabase SSR (`@supabase/ssr`) cookies; middleware refreshes session and guards `/dashboard`. Use `getUser()` (verifies with server), not `getSession()`, for authz.
- [ ] Security headers in `next.config`: CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- [ ] Supabase Auth: allowed redirect URLs restricted to prod + localhost; email confirmation on; CAPTCHA not needed — Google OAuth only; disable email provider.
- [ ] Admin actions gated by `profiles.role = 'admin'` checked in SQL, never by a hidden UI toggle. Dev timer toggle removed/disabled in production.
- [ ] Supabase: enable leaked-password protection, review Security Advisor, back up DB before event.
- [ ] Dependency audit (`npm audit`), lockfile committed.
- [ ] Run `/security-review` before deploy.
