-- LinkedIn AND GitHub are both required now (was: at least one). update_profile, create_team and join_team refuse
-- anyone missing either ('need_a_link'). People who saved only one go back through onboarding on their next visit;
-- anyone already on a roster stays on it. A link belongs to one person: two accounts can't claim the same profile
-- ('link_taken').

create unique index profiles_linkedin_unique on public.profiles (lower(linkedin_url)) where linkedin_url is not null;
create unique index profiles_github_unique on public.profiles (lower(github_url)) where github_url is not null;

create or replace function public.update_profile(p_display_name text, p_phone text default null, p_linkedin text default null, p_github text default null)
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
  if li is null or gh is null then raise exception 'need_a_link' using errcode = 'P0001'; end if;
  begin
    update public.profiles set display_name = n, phone = ph, linkedin_url = li, github_url = gh, onboarded = true where id = me.id;
  exception when unique_violation then
    raise exception 'link_taken' using errcode = 'P0001';
  end;
end;
$$;

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
  if me.linkedin_url is null or me.github_url is null then raise exception 'need_a_link' using errcode = 'P0001'; end if;
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
  perform 1 from public.profiles where id = me.id for update; -- one attempt at a time per person, so the count holds
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
  if me.linkedin_url is null or me.github_url is null then raise exception 'need_a_link' using errcode = 'P0001'; end if;
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

-- missing one of the two: back through onboarding (the lab sends anyone not onboarded there)
update public.profiles set onboarded = false where onboarded and (linkedin_url is null or github_url is null);
