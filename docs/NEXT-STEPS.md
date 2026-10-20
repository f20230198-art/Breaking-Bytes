# What's left (as of 2026-10-20)

Everything is built and tested: landing page (+ loader, FAQ pool, finale, easter eggs), hacker dashboard,
admin panel, Supabase backend (RLS, RPCs, 60 pgTAP tests), 404 / share image / robots / sitemap / security.txt /
security headers, and a security review (see `SECURITY.md`). What remains:

## 1. Deploy (deferred on purpose)
- [ ] Create the hosted Supabase project; `npx supabase link` then `npx supabase db push` (migrations), seed or enter content.
- [ ] Google OAuth client in Google Cloud console (free): steps in `DEPLOY.md` → "Google sign-in".
- [ ] Vercel (free Hobby) from the GitHub repo. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `NEXT_PUBLIC_SITE_URL` (the real domain). Do **not** set `NEXT_PUBLIC_DEV_LOGIN`.
- [ ] Supabase free tier pauses after ~1 week idle: open the dashboard before the event. Realtime is only used on
      the Crew page (free plan ≈ 200 concurrent connections).

## 2. Launch checklist
See `SECURITY.md` → "Before launch": email provider off, redirect URLs, admin emails, real event times,
Security Advisor, backup, dry run with fake crews.

## 3. Content from the club (entered in /admin, no code)
- [ ] Final event times (16–17 Nov 2026 is in; Gulf time).
- [ ] Sponsors + logos (PNG/WebP/JPEG ≤ 2 MB), which ones are suppliers.
- [ ] Problem statements (one or more per supplier), publish them.
- [ ] Prize names, pool and amounts; perks.
- [ ] Partner university email domains (decides who is a Jesse).
- [ ] FAQ, schedule, announcements as needed.

## 4. Small code bits
- [ ] Classroom chalkboard tracks + rules are still placeholders in `src/data/site.ts` (`TRACKS`, `RULES`).
- [ ] `src/app/opengraph-image.jpg` / `twitter-image.jpg` have "16–17 Nov 2026" baked in: regenerate if dates change.

## Local dev reminders
- `npm run dev` (add `-- -H 0.0.0.0` for phones on the LAN); `.env.local` points at the LAN IP 10.30.67.85.
- Backend: start Docker Desktop, `npx supabase start`; `npx supabase test db` for the rules; stop both after.
- Dev login on `/login` (local only): any email; `@dubai.bits-pilani.ac.in` makes a Jesse. Add yourself as admin with
  `insert into public.admin_emails (email) values ('you@…');` in the local DB.
