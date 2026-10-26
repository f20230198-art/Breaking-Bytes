-- Pre-registration. Until the organisers flip portal_open, the lab is only crew sign-up: everyone signs in, gives at
-- least one of LinkedIn / GitHub (a real profile link, checked here), and starts or joins a crew (a crew of one is
-- fine). The hall has a headcount limit, so every crew waits as 'pending' until an admin accepts or waitlists it.

create type public.registration_status as enum ('pending', 'accepted', 'waitlisted');

-- profile links in one canonical shape (the app normalises what people paste): no prank links, no other sites
create function public._linkedin_ok(u text) returns boolean
language sql immutable set search_path = '' as $$
  -- (Postgres caps {m,n} at 255, so the length is checked separately: slugs are up to 300 once percent-encoded)
  select u ~ '^https://www\.linkedin\.com/in/[A-Za-z0-9%_-]{3,}$' and length(u) <= length('https://www.linkedin.com/in/') + 300;
$$;
-- GitHub usernames: 1–39 letters, digits or single hyphens, not starting or ending with one
create function public._github_ok(u text) returns boolean
language sql immutable set search_path = '' as $$
  select u ~ '^https://github\.com/[A-Za-z0-9](-?[A-Za-z0-9])*$' and length(u) <= length('https://github.com/') + 39;
$$;

alter table public.event_config
  add column portal_open boolean not null default false,              -- false: the lab shows crew sign-up only
  add column seat_cap int check (seat_cap is null or seat_cap > 0);   -- the hall's headcount, for the admin tally

alter table public.profiles
  add column linkedin_url text check (linkedin_url is null or public._linkedin_ok(linkedin_url)),
  add column github_url text check (github_url is null or public._github_ok(github_url));

alter table public.teams add column registration_status public.registration_status not null default 'pending';

-- ─── profile: name, phone and the links ───────────────────────────────────────────────────────────────────────
drop function public.update_profile(text, text);
create function public.update_profile(p_display_name text, p_phone text default null, p_linkedin text default null, p_github text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  n text := btrim(p_display_name);
  ph text := nullif(btrim(coalesce(p_phone, '')), '');
  li text := nullif(btrim(coalesce(p_linkedin, '')), '');
  gh text := nullif(btrim(coalesce(p_github, '')), '');
begin
  if n is null or length(n) not between 2 and 60 then raise exception 'bad_display_name' using errcode = 'P0001'; end if;
  if ph is not null and ph !~ '^\+?[0-9 ()-]{6,20}$' then raise exception 'bad_phone' using errcode = 'P0001'; end if;
  if li is not null and not public._linkedin_ok(li) then raise exception 'bad_linkedin' using errcode = 'P0001'; end if;
  if gh is not null and not public._github_ok(gh) then raise exception 'bad_github' using errcode = 'P0001'; end if;
  if li is null and gh is null then raise exception 'need_a_link' using errcode = 'P0001'; end if;
  update public.profiles set display_name = n, phone = ph, linkedin_url = li, github_url = gh, onboarded = true where id = me.id;
end;
$$;

-- ─── crews: a link before you're on a roster; an accepted crew's roster is the organisers' to change ────────────
create or replace function public.create_team(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  n text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  tid uuid;
begin
  if not c.registration_open then raise exception 'registration_closed' using errcode = 'P0001'; end if;
  if not public._roster_open(c.roster_lock_at) then raise exception 'rosters_frozen' using errcode = 'P0001'; end if;
  if me.linkedin_url is null and me.github_url is null then raise exception 'need_a_link' using errcode = 'P0001'; end if;
  if exists (select 1 from public.team_members where user_id = me.id) then raise exception 'already_in_crew' using errcode = 'P0001'; end if;
  if length(n) not between 3 and 40 or n !~ '^[[:alnum:] .''&!?_-]+$' then raise exception 'bad_name' using errcode = 'P0001'; end if;
  begin
    insert into public.teams (name, invite_code, leader_id) values (n, public._new_invite_code(), me.id) returning id into tid;
  exception when unique_violation then
    raise exception 'name_taken' using errcode = 'P0001';
  end;
  insert into public.team_members (team_id, user_id) values (tid, me.id);
  insert into public.submissions (team_id) values (tid);
  return tid;
end;
$$;

create or replace function public.join_team(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  t public.teams;
  hit boolean;
begin
  if (select count(*) from public.join_attempts where user_id = me.id and at > now() - interval '1 minute') >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if code !~ '^ABQ-' then code := 'ABQ-' || code; end if;
  select * into t from public.teams where invite_code = code for update;
  hit := found; -- saved first: the insert below resets FOUND
  insert into public.join_attempts (user_id, ok) values (me.id, hit);
  if not hit then return null; end if;

  if not c.registration_open then raise exception 'registration_closed' using errcode = 'P0001'; end if;
  if not public._roster_open(c.roster_lock_at) then raise exception 'rosters_frozen' using errcode = 'P0001'; end if;
  if me.linkedin_url is null and me.github_url is null then raise exception 'need_a_link' using errcode = 'P0001'; end if;
  if exists (select 1 from public.team_members where user_id = me.id) then raise exception 'already_in_crew' using errcode = 'P0001'; end if;
  if t.status <> 'active' then raise exception 'disqualified' using errcode = 'P0001'; end if;
  if t.roster_locked then raise exception 'crew_locked' using errcode = 'P0001'; end if;
  -- the seats were counted when the crew was accepted: adding someone is an organiser's call
  if t.registration_status = 'accepted' then raise exception 'crew_accepted' using errcode = 'P0001'; end if;
  begin
    insert into public.team_members (team_id, user_id) values (t.id, me.id); -- team_size trigger enforces the cap
  exception when raise_exception then
    if sqlerrm = 'team_full' then raise exception 'crew_full' using errcode = 'P0001'; end if;
    raise;
  end;
  return t.id;
end;
$$;

-- my_crew gains the registration status (teammates' links stay private, like their emails)
create or replace function public.my_crew() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when t.id is null then null else jsonb_build_object(
    'id', t.id, 'name', t.name, 'invite_code', t.invite_code, 'leader_id', t.leader_id, 'roster_locked', t.roster_locked,
    'sponsor_id', t.sponsor_id, 'problem_id', t.problem_id, 'status', t.status, 'registration_status', t.registration_status,
    'category', public.team_category(t.id),
    'members', (
      select jsonb_agg(jsonb_build_object('id', p.id, 'display_name', p.display_name, 'avatar_url', p.avatar_url,
                                          'category', p.category, 'is_leader', p.id = t.leader_id, 'joined_at', m.joined_at)
                       order by m.joined_at)
      from public.team_members m join public.profiles p on p.id = m.user_id where m.team_id = t.id
    )
  ) end
  from (select 1) one
  left join public.teams t on t.id = public.my_team_id();
$$;

-- ─── admin crew list: registration status and every member's links, for the review ─────────────────────────────
drop function public.admin_crews();
create function public.admin_crews() returns table (
  id uuid, name text, invite_code text, status public.team_status, registration_status public.registration_status,
  roster_locked boolean, category public.category, sponsor text, problem_id text, members jsonb, repo_url text,
  live_url text, video_url text, notes text, submitted_at timestamptz, late boolean, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
-- (the output columns are named like table columns: id, name, ... so plain names mean the columns)
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = 'P0001'; end if;
  return query
  select t.id, t.name, t.invite_code, t.status, t.registration_status, t.roster_locked, public.team_category(t.id), s.name,
         t.problem_id,
         (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.display_name, 'email', p.email, 'category', p.category,
                                                      'leader', p.id = t.leader_id, 'linkedin', p.linkedin_url, 'github', p.github_url)
                                    order by m.joined_at), '[]'::jsonb)
          from public.team_members m join public.profiles p on p.id = m.user_id where m.team_id = t.id),
         sub.repo_url, sub.live_url, sub.video_url, sub.notes, sub.updated_at,
         coalesce(sub.updated_at > (select deadline_at from public.event_config where id = 1), false),
         t.created_at
  from public.teams t
  left join public.sponsors s on s.id = t.sponsor_id
  left join public.submissions sub on sub.team_id = t.id
  order by t.created_at;
end;
$$;

-- ─── who may call what (new functions start out callable by everyone) ──────────────────────────────────────────
revoke execute on function public.update_profile(text, text, text, text), public.admin_crews() from public, anon, authenticated;
grant execute on function public.update_profile(text, text, text, text), public.admin_crews() to authenticated;
-- pure format checks, used by the profiles check constraints whoever writes the row
grant execute on function public._linkedin_ok(text), public._github_ok(text) to anon, authenticated;
