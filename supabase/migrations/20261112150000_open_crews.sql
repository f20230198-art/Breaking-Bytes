-- Chapter 1 is online with no headcount limit, so the pre-registration review gets out of the way:
--   1. With no seat cap (event_config.seat_cap null), every crew is accepted the moment it is created, and an
--      accepted crew can still take new members with its code until crews freeze. Set a seat cap and the review
--      comes back exactly as before (new crews pending, accepted rosters closed to self-joins).
--   2. A profile needs at least one of LinkedIn / GitHub again (was: both).
--   3. A crew must have locked a problem before it can ship, so every submission says which problem it answers.

-- ─── 1. auto-accept while there is no seat cap ─────────────────────────────────────────────────────────────────
create function public.auto_accept_crew() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select seat_cap from public.event_config where id = 1) is null then
    new.registration_status := 'accepted';
  end if;
  return new;
end;
$$;
create trigger auto_accept_crew before insert on public.teams
  for each row execute function public.auto_accept_crew();
revoke execute on function public.auto_accept_crew() from public, anon, authenticated;

-- anyone still waiting gets in now (only while there is no cap)
update public.teams set registration_status = 'accepted'
where registration_status = 'pending' and (select seat_cap from public.event_config where id = 1) is null;

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
  -- everything about the caller, before the code is looked up: these answers mustn't depend on the code
  if not c.registration_open then raise exception 'registration_closed' using errcode = 'P0001'; end if;
  if not public._roster_open(c.roster_lock_at) then raise exception 'rosters_frozen' using errcode = 'P0001'; end if;
  if me.linkedin_url is null and me.github_url is null then raise exception 'need_a_link' using errcode = 'P0001'; end if;
  if exists (select 1 from public.team_members where user_id = me.id) then raise exception 'already_in_crew' using errcode = 'P0001'; end if;

  if code !~ '^ABQ-' then code := 'ABQ-' || code; end if;
  select * into t from public.teams where invite_code = code for update;
  hit := found; -- saved first: the insert below resets FOUND
  insert into public.join_attempts (user_id, ok) values (me.id, hit);
  if not hit then return null; end if;

  if t.status <> 'active' then raise exception 'disqualified' using errcode = 'P0001'; end if;
  if t.roster_locked then raise exception 'crew_locked' using errcode = 'P0001'; end if;
  -- with a seat cap, the seats were counted when the crew was accepted: adding someone is an organiser's call
  if t.registration_status = 'accepted' and c.seat_cap is not null then raise exception 'crew_accepted' using errcode = 'P0001'; end if;
  begin
    insert into public.team_members (team_id, user_id) values (t.id, me.id); -- team_size trigger enforces the cap
  exception when raise_exception then
    if sqlerrm = 'team_full' then raise exception 'crew_full' using errcode = 'P0001'; end if;
    raise;
  end;
  return t.id;
end;
$$;

-- ─── 2. at least one link ──────────────────────────────────────────────────────────────────────────────────────
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
  if li is null and gh is null then raise exception 'need_a_link' using errcode = 'P0001'; end if;
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

-- people sent back to onboarding for having only one link (20261030130000) are fine again
update public.profiles set onboarded = true
where not onboarded and (linkedin_url is not null or github_url is not null) and length(btrim(coalesce(display_name, ''))) >= 2;

-- ─── 3. no shipping without a locked problem ───────────────────────────────────────────────────────────────────
create or replace function public.upsert_submission(p_repo text, p_live text, p_video text, p_notes text default '') returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  t public.teams := public._my_team(false);
  repo text := nullif(btrim(coalesce(p_repo, '')), '');
  live text := nullif(btrim(coalesce(p_live, '')), '');
  video text := nullif(btrim(coalesce(p_video, '')), '');
  stamp timestamptz := now();
begin
  if t.registration_status <> 'accepted' then raise exception 'not_accepted' using errcode = 'P0001'; end if;
  if c.submissions_open_at is null or now() < c.submissions_open_at or c.deadline_at is null or now() >= c.deadline_at then
    raise exception 'submissions_closed' using errcode = 'P0001';
  end if;
  if t.problem_id is null then raise exception 'no_problem' using errcode = 'P0001'; end if;
  if (repo is not null and (repo !~ '^https://[^\s]+$' or length(repo) > 300))
     or (live is not null and (live !~ '^https://[^\s]+$' or length(live) > 300))
     or (video is not null and (video !~ '^https://[^\s]+$' or length(video) > 300)) then
    raise exception 'bad_url' using errcode = 'P0001';
  end if;
  if length(coalesce(p_notes, '')) > 2000 then raise exception 'notes_too_long' using errcode = 'P0001'; end if;
  insert into public.submissions (team_id, repo_url, live_url, video_url, notes, updated_at, updated_by)
  values (t.id, repo, live, video, coalesce(p_notes, ''), stamp, me.id)
  on conflict (team_id) do update set repo_url = excluded.repo_url, live_url = excluded.live_url, video_url = excluded.video_url,
    notes = excluded.notes, updated_at = excluded.updated_at, updated_by = excluded.updated_by;
  return stamp;
end;
$$;
