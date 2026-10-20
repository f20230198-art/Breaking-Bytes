-- Breaking Bytes: core schema. See docs/DATABASE.md for the design and docs/SECURITY.md for the rules it enforces.
-- Hackers never write tables directly: every hacker action is a security-definer RPC (20261020120200_rpc.sql).
-- Admins write tables directly, gated by RLS (is_admin()) and recorded by audit triggers (20261020120300_admin.sql).

create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('hacker', 'admin', 'judge');
create type public.category as enum ('walter', 'jesse'); -- walter = open, jesse = verified partner-university student
create type public.team_status as enum ('active', 'disqualified');
create type public.sponsor_tier as enum ('title', 'track', 'food', 'perk');
create type public.prize_kind as enum ('cash', 'perk');

-- ─── event config: one row, the server's idea of the event clock ───────────────────────────────────────────────
create table public.event_config (
  id int primary key default 1 check (id = 1),
  registration_open boolean not null default true,
  starts_at timestamptz,            -- the cook begins
  supplier_pick_at timestamptz,     -- leaders may pick a supplier (sponsor) from here...
  problems_release_at timestamptz,  -- ...until here, when problem statements unseal
  submissions_open_at timestamptz,  -- the Dead Drop opens
  deadline_at timestamptz,          -- submissions lock (the only deadline that matters is this one, on now())
  roster_lock_at timestamptz,       -- crews freeze: no joining, leaving or removing after this
  team_max int not null default 4 check (team_max between 1 and 10),
  supplier_cap_slack int not null default 1 check (supplier_cap_slack between 0 and 50),
  prize_pool_aed int check (prize_pool_aed >= 0),
  updated_at timestamptz not null default now(),
  check (problems_release_at is null or supplier_pick_at is null or supplier_pick_at <= problems_release_at),
  check (deadline_at is null or submissions_open_at is null or submissions_open_at <= deadline_at)
);
insert into public.event_config (id) values (1);

-- ─── who is who ────────────────────────────────────────────────────────────────────────────────────────────────
create table public.admin_emails (
  email text primary key check (email = lower(email) and email like '%_@_%')
);

create table public.partner_universities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 120),
  -- matched with LIKE against the email's domain: 'dubai.bits-pilani.ac.in' or '%.bits-pilani.ac.in'
  domain_pattern text not null unique check (domain_pattern = lower(domain_pattern) and domain_pattern ~ '^[a-z0-9.%-]+$'),
  active boolean not null default true
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default '' check (length(display_name) <= 60),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{6,20}$'),
  role public.user_role not null default 'hacker',
  category public.category not null default 'walter',
  category_override boolean not null default false, -- an admin set the category by hand; domain changes leave it alone
  university_id uuid references public.partner_universities (id) on delete set null,
  banned boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── sponsors, problems, prizes ───────────────────────────────────────────────────────────────────────────────
create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  tier public.sponsor_tier not null default 'track',
  website text check (website is null or website ~ '^https://'),
  logo_path text,                    -- object path in the public 'sponsor-logos' bucket
  symbol text check (symbol is null or symbol ~ '^[A-Z][a-z]?$'), -- the periodic-tile stand-in until a logo exists
  is_supplier boolean not null default false, -- crews can pick it and it sets problem statements
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.problems (
  id text primary key check (id ~ '^[A-Z]-[0-9]{3}$'), -- e.g. 'F-001'
  sponsor_id uuid not null references public.sponsors (id) on delete restrict,
  title text not null check (length(title) between 3 and 140),
  track text check (length(track) <= 60),
  summary text not null default '' check (length(summary) <= 600),
  body_md text not null default '' check (length(body_md) <= 20000),
  criteria_md text not null default '' check (length(criteria_md) <= 8000),
  capacity int check (capacity is null or capacity > 0), -- null = no per-problem cap beyond the supplier cap
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.problems (sponsor_id);

-- ─── crews ─────────────────────────────────────────────────────────────────────────────────────────────────────
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 3 and 40),
  invite_code text not null unique check (invite_code ~ '^ABQ-[2-9A-HJ-NP-Z]{5}$'),
  leader_id uuid references public.profiles (id) on delete set null,
  roster_locked boolean not null default false,
  sponsor_id uuid references public.sponsors (id) on delete set null,
  problem_id text references public.problems (id) on delete set null,
  status public.team_status not null default 'active',
  created_at timestamptz not null default now()
);
create unique index teams_name_ci on public.teams (lower(name));
create index on public.teams (sponsor_id);
create index on public.teams (problem_id);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null unique references public.profiles (id) on delete cascade, -- one crew per person
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table public.submissions (
  team_id uuid primary key references public.teams (id) on delete cascade,
  repo_url text check (repo_url is null or (repo_url ~ '^https://' and length(repo_url) <= 300)),
  live_url text check (live_url is null or (live_url ~ '^https://' and length(live_url) <= 300)),
  video_url text check (video_url is null or (video_url ~ '^https://' and length(video_url) <= 300)),
  notes text not null default '' check (length(notes) <= 2000),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table public.prizes (
  id uuid primary key default gen_random_uuid(),
  rank int not null check (rank between 1 and 50),
  name text not null check (length(name) between 2 and 80),
  ratio numeric(6, 2) check (ratio is null or ratio >= 0), -- share of the pool (6:4:2:1:1 by default)
  amount_aed int check (amount_aed is null or amount_aed >= 0), -- overrides the ratio when set
  kind public.prize_kind not null default 'cash',
  perk_description text check (length(perk_description) <= 200),
  category_only public.category, -- 'jesse' = student crews only
  awarded_team_id uuid references public.teams (id) on delete set null
);

-- ─── site content (public read, admin write) ──────────────────────────────────────────────────────────────────
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  q text not null check (length(q) between 3 and 200),
  a text not null check (length(a) between 1 and 1200),
  sort_order int not null default 0,
  visible boolean not null default true
);

create table public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  day_offset int not null default 0 check (day_offset between 0 and 3), -- 0 = first day
  time_label text not null check (time_label ~ '^[0-2][0-9]:[0-5][0-9]$'),
  end_label text check (end_label is null or end_label ~ '^[0-2][0-9]:[0-5][0-9]$'),
  title text not null check (length(title) between 2 and 80),
  detail text not null default '' check (length(detail) <= 300),
  sort_order int not null default 0
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  body text not null check (length(body) between 1 and 600),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── bookkeeping ───────────────────────────────────────────────────────────────────────────────────────────────
create table public.admin_audit (
  id bigint generated always as identity primary key,
  admin_id uuid,
  action text not null,           -- INSERT / UPDATE / DELETE
  target_table text not null,
  target_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index on public.admin_audit (created_at desc);

-- join attempts, for rate limiting invite-code guessing
create table public.join_attempts (
  user_id uuid not null,
  at timestamptz not null default now(),
  ok boolean not null
);
create index on public.join_attempts (user_id, at desc);

-- ─── helpers ───────────────────────────────────────────────────────────────────────────────────────────────────
-- the caller is a signed-in, unbanned admin (role is only ever granted from admin_emails)
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and not p.banned);
$$;

create function public.my_team_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select m.team_id from public.team_members m where m.user_id = auth.uid();
$$;

-- a crew is 'jesse' only if every member is
create function public.team_category(p_team uuid) returns public.category
language sql stable security definer set search_path = '' as $$
  select case when count(*) > 0 and bool_and(p.category = 'jesse') then 'jesse'::public.category else 'walter'::public.category end
  from public.team_members m join public.profiles p on p.id = m.user_id
  where m.team_id = p_team;
$$;

-- category and university from an email's domain
create function public.university_for(p_email text) returns uuid
language sql stable security definer set search_path = '' as $$
  select u.id from public.partner_universities u
  where u.active and lower(split_part(p_email, '@', 2)) like u.domain_pattern
  order by length(u.domain_pattern) desc
  limit 1;
$$;

-- new auth user → profile, with category and role worked out on the server
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uni uuid := public.university_for(new.email);
begin
  insert into public.profiles (id, email, display_name, avatar_url, category, university_id, role)
  values (
    new.id,
    lower(new.email),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 60),
    case when new.raw_user_meta_data ->> 'avatar_url' ~ '^https://' then new.raw_user_meta_data ->> 'avatar_url' end,
    case when uni is not null then 'jesse'::public.category else 'walter'::public.category end,
    uni,
    case when exists (select 1 from public.admin_emails a where a.email = lower(new.email)) then 'admin'::public.user_role else 'hacker'::public.user_role end
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- partner list changed → recompute everyone's category (except hand-set ones)
create function public.recompute_categories() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles p
  set university_id = public.university_for(p.email),
      category = case when public.university_for(p.email) is not null then 'jesse'::public.category else 'walter'::public.category end
  where not p.category_override;
  return null;
end;
$$;
create trigger partner_universities_changed after insert or update or delete on public.partner_universities
  for each statement execute function public.recompute_categories();

-- admin allowlist changed → grant / revoke the admin role to match
create function public.sync_admin_roles() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles p
  set role = case when exists (select 1 from public.admin_emails a where a.email = p.email) then 'admin'::public.user_role
                  when p.role = 'admin' then 'hacker'::public.user_role
                  else p.role end;
  return null;
end;
$$;
create trigger admin_emails_changed after insert or update or delete on public.admin_emails
  for each statement execute function public.sync_admin_roles();

-- crew size cap holds on every write path (RPCs and admin moves alike)
create function public.enforce_team_size() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  cap int := (select team_max from public.event_config where id = 1);
begin
  perform 1 from public.teams where id = new.team_id for update; -- serialise joins to one crew
  if (select count(*) from public.team_members where team_id = new.team_id) >= cap then
    raise exception 'team_full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger team_size before insert or update of team_id on public.team_members for each row execute function public.enforce_team_size();

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger event_config_touch before update on public.event_config for each row execute function public.touch_updated_at();
