-- Local stack only (loaded by `supabase db reset` after seed.sql): trust the dev login's email + password accounts like
-- Google ones (admin role, Jesse category). NEVER run this against the hosted project: it makes any confirmed email
-- account count as verified.
update public.dev_settings set trust_email_logins = true where id = 1;
