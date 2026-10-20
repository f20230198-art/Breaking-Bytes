# Deploy: Railway + Supabase

## Railway
- Service from GitHub repo; Nixpacks/Railpack auto-detects Next.js.
- `next.config`: `output: "standalone"`. Start: `node .next/standalone/server.js` (copy `public/` + `.next/static` in build) or plain `next start` with `PORT` from Railway.
- Custom domain + Railway TLS.
- Scale: 1 instance is fine; DB does the heavy lifting. Bump RAM before event day.

## Supabase
- Separate projects for `dev` and `prod`. Migrations in `supabase/migrations`, applied with Supabase CLI (`supabase db push`).
- Auth redirect URLs: `https://<domain>/auth/callback`, `http://localhost:3000/auth/callback`.

## Google sign-in (one-time setup)
1. Google Cloud console → APIs & Services → Credentials → **OAuth client ID** (Web application).
2. Authorised redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback` (hosted) and
   `http://127.0.0.1:54321/auth/v1/callback` (local stack).
3. Hosted: Supabase dashboard → Authentication → Providers → Google: paste client ID + secret; **disable the Email
   provider**; URL configuration: site URL = the domain, redirect URLs = `https://<domain>/auth/callback` (+ localhost).
4. Local: put `SUPABASE_AUTH_GOOGLE_CLIENT_ID` / `SUPABASE_AUTH_GOOGLE_SECRET` in `.env` (see `.env.example`), then
   `npx supabase stop && npx supabase start`.
5. Add organiser emails: `insert into public.admin_emails (email) values ('…');` (they get the admin role on sign-in).

## Env vars
| Var | Where | Public? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Railway + `.env.local` | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Railway + `.env.local` | yes (RLS protects) |
| `SUPABASE_SERVICE_ROLE_KEY` | Railway only, if needed for admin jobs | **NO** |
| `NEXT_PUBLIC_SITE_URL` | both | yes |

## Event-day runbook (fill in later)
- Verify `event_config` timestamps in UTC.
- Freeze deploys 2h before start.
- Export submissions CSV after deadline.
