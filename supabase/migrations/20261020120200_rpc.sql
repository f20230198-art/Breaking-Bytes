-- Hacker RPCs. Every crew / supplier / problem / submission action goes through one of these. They run with definer
-- rights, so each one checks the caller, their ban, their crew and the event clock (now(), never the client's time).
-- Errors are raised as short stable codes (the app maps them to friendly text): e.g. 'crew_full', 'submissions_closed'.

-- ─── internal helpers ─────────────────────────────────────────────────────────────────────────────────────────
create function public._me() returns public.profiles
language plpgsql stable security definer set search_path = '' as $$
declare
  me public.profiles;
begin
  if auth.uid() is null then raise exception 'not_signed_in' using errcode = 'P0001'; end if;
  select * into me from public.profiles where id = auth.uid();
  if not found then raise exception 'not_signed_in' using errcode = 'P0001'; end if;
  if me.banned then raise exception 'banned' using errcode = 'P0001'; end if;
  return me;
end;
$$;

create function public._cfg() returns public.event_config
language sql stable security definer set search_path = '' as $$
  select * from public.event_config where id = 1;
$$;

-- the caller's crew, locked for the rest of the transaction; optionally require them to lead it
create function public._my_team(p_leader boolean) returns public.teams
language plpgsql security definer set search_path = '' as $$
declare
  t public.teams;
begin
  select tm.* into t from public.teams tm join public.team_members m on m.team_id = tm.id
  where m.user_id = auth.uid() for update of tm;
  if not found then raise exception 'not_in_crew' using errcode = 'P0001'; end if;
  if t.status <> 'active' then raise exception 'disqualified' using errcode = 'P0001'; end if;
  if p_leader and t.leader_id is distinct from auth.uid() then raise exception 'not_leader' using errcode = 'P0001'; end if;
  return t;
end;
$$;

-- takes the timestamp, not the event_config row: a function of a row type would show up as a computed column in the API
create function public._roster_open(p_lock timestamptz) returns boolean
language sql stable as $$
  select p_lock is null or now() < p_lock;
$$;

-- 'ABQ-' + 5 characters from an alphabet without look-alikes (no 0/O, 1/I): 32^5 ≈ 33.5 million codes
create function public._new_invite_code() returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  code text;
  b bytea;
begin
  loop
    b := extensions.gen_random_bytes(5);
    code := 'ABQ-';
    for i in 0..4 loop
      code := code || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.teams where invite_code = code);
  end loop;
  return code;
end;
$$;

-- ─── public helpers ───────────────────────────────────────────────────────────────────────────────────────────
-- the client countdown is cosmetic; it offsets itself against this
create function public.server_time() returns timestamptz
language sql stable as $$ select now(); $$;

-- ─── profile ───────────────────────────────────────────────────────────────────────────────────────────────────
create function public.update_profile(p_display_name text, p_phone text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  n text := btrim(p_display_name);
  ph text := nullif(btrim(coalesce(p_phone, '')), '');
begin
  if n is null or length(n) not between 2 and 60 then raise exception 'bad_display_name' using errcode = 'P0001'; end if;
  if ph is not null and ph !~ '^\+?[0-9 ()-]{6,20}$' then raise exception 'bad_phone' using errcode = 'P0001'; end if;
  update public.profiles set display_name = n, phone = ph, onboarded = true where id = me.id;
end;
$$;

-- ─── crews ─────────────────────────────────────────────────────────────────────────────────────────────────────
create function public.create_team(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  n text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  tid uuid;
begin
  if not c.registration_open then raise exception 'registration_closed' using errcode = 'P0001'; end if;
  if not public._roster_open(c.roster_lock_at) then raise exception 'rosters_frozen' using errcode = 'P0001'; end if;
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

-- returns the crew id, or null when no crew has that code (the attempt is still counted against the rate limit)
create function public.join_team(p_code text) returns uuid
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
  if exists (select 1 from public.team_members where user_id = me.id) then raise exception 'already_in_crew' using errcode = 'P0001'; end if;
  if t.status <> 'active' then raise exception 'disqualified' using errcode = 'P0001'; end if;
  if t.roster_locked then raise exception 'crew_locked' using errcode = 'P0001'; end if;
  begin
    insert into public.team_members (team_id, user_id) values (t.id, me.id); -- team_size trigger enforces the cap
  exception when raise_exception then
    if sqlerrm = 'team_full' then raise exception 'crew_full' using errcode = 'P0001'; end if;
    raise;
  end;
  return t.id;
end;
$$;

-- leaving hands the crew to the longest-standing member; the last one out deletes it
create function public.leave_team() returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  t public.teams := public._my_team(false);
  heir uuid;
begin
  if not public._roster_open(c.roster_lock_at) then raise exception 'rosters_frozen' using errcode = 'P0001'; end if;
  delete from public.team_members where team_id = t.id and user_id = me.id;
  if t.leader_id = me.id then
    select user_id into heir from public.team_members where team_id = t.id order by joined_at, user_id limit 1;
    if heir is null then
      delete from public.teams where id = t.id;
    else
      update public.teams set leader_id = heir where id = t.id;
    end if;
  end if;
end;
$$;

create function public.remove_member(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  t public.teams := public._my_team(true);
begin
  if not public._roster_open(c.roster_lock_at) then raise exception 'rosters_frozen' using errcode = 'P0001'; end if;
  if p_user = me.id then raise exception 'use_leave_team' using errcode = 'P0001'; end if;
  delete from public.team_members where team_id = t.id and user_id = p_user;
  if not found then raise exception 'not_member' using errcode = 'P0001'; end if;
end;
$$;

create function public.set_roster_locked(p_locked boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  t public.teams := public._my_team(true);
begin
  if not p_locked and not public._roster_open(c.roster_lock_at) then raise exception 'rosters_frozen' using errcode = 'P0001'; end if;
  update public.teams set roster_locked = p_locked where id = t.id;
end;
$$;

-- ─── suppliers and problems ───────────────────────────────────────────────────────────────────────────────────
-- crews spread evenly: each supplier takes at most ceil(active crews / suppliers) + slack
create function public._supplier_cap() returns int
language sql stable security definer set search_path = '' as $$
  select (ceil(
            (select count(*) from public.teams t where t.status = 'active' and exists (select 1 from public.team_members m where m.team_id = t.id))::numeric
            / greatest(1, (select count(*) from public.sponsors s where s.is_supplier and s.visible))
          ) + (select supplier_cap_slack from public.event_config where id = 1))::int;
$$;

create function public.supplier_slots() returns table (sponsor_id uuid, name text, symbol text, logo_path text, taken int, cap int)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.symbol, s.logo_path,
         (select count(*) from public.teams t where t.sponsor_id = s.id and t.status = 'active')::int,
         public._supplier_cap()
  from public.sponsors s
  where s.is_supplier and s.visible
  order by s.sort_order, s.name;
$$;

create function public.pick_supplier(p_sponsor uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  t public.teams := public._my_team(true);
  taken int;
begin
  if c.supplier_pick_at is null or now() < c.supplier_pick_at or (c.problems_release_at is not null and now() >= c.problems_release_at) then
    raise exception 'supplier_window_closed' using errcode = 'P0001';
  end if;
  perform 1 from public.sponsors where id = p_sponsor and is_supplier and visible for update; -- one pick at a time per supplier
  if not found then raise exception 'not_a_supplier' using errcode = 'P0001'; end if;
  if t.sponsor_id = p_sponsor then return; end if;
  select count(*) into taken from public.teams where sponsor_id = p_sponsor and status = 'active' and id <> t.id;
  if taken >= public._supplier_cap() then raise exception 'supplier_full' using errcode = 'P0001'; end if;
  update public.teams set sponsor_id = p_sponsor, problem_id = null where id = t.id;
end;
$$;

-- after the drop the leader locks one of their supplier's problems (once; admins can reassign)
create function public.lock_problem(p_problem text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  t public.teams := public._my_team(true);
  pr public.problems;
begin
  if c.problems_release_at is null or now() < c.problems_release_at then raise exception 'problems_sealed' using errcode = 'P0001'; end if;
  if c.deadline_at is not null and now() >= c.deadline_at then raise exception 'submissions_closed' using errcode = 'P0001'; end if;
  if t.problem_id is not null then raise exception 'problem_already_locked' using errcode = 'P0001'; end if;
  select * into pr from public.problems where id = p_problem and is_published for update;
  if not found then raise exception 'no_such_problem' using errcode = 'P0001'; end if;
  if t.sponsor_id is distinct from pr.sponsor_id then raise exception 'wrong_supplier' using errcode = 'P0001'; end if;
  if pr.capacity is not null and (select count(*) from public.teams where problem_id = pr.id and status = 'active') >= pr.capacity then
    raise exception 'problem_full' using errcode = 'P0001';
  end if;
  update public.teams set problem_id = pr.id where id = t.id;
end;
$$;

-- ─── the dead drop ─────────────────────────────────────────────────────────────────────────────────────────────
create function public.upsert_submission(p_repo text, p_live text, p_video text, p_notes text default '') returns timestamptz
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
  if c.submissions_open_at is null or now() < c.submissions_open_at or c.deadline_at is null or now() >= c.deadline_at then
    raise exception 'submissions_closed' using errcode = 'P0001';
  end if;
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

-- ─── reads that RLS can't express cleanly ─────────────────────────────────────────────────────────────────────
-- my crew with its roster: teammates' safe fields only (no email, no phone)
create function public.my_crew() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when t.id is null then null else jsonb_build_object(
    'id', t.id, 'name', t.name, 'invite_code', t.invite_code, 'leader_id', t.leader_id, 'roster_locked', t.roster_locked,
    'sponsor_id', t.sponsor_id, 'problem_id', t.problem_id, 'status', t.status,
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

-- ─── who may call what ─────────────────────────────────────────────────────────────────────────────────────────
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.server_time() to anon, authenticated;
grant execute on function
  public.update_profile(text, text), public.create_team(text), public.join_team(text), public.leave_team(),
  public.remove_member(uuid), public.set_roster_locked(boolean), public.supplier_slots(), public.pick_supplier(uuid),
  public.lock_problem(text), public.upsert_submission(text, text, text, text), public.my_crew()
  to authenticated;
-- used inside RLS policies, so the API roles need them too
grant execute on function public.is_admin(), public.my_team_id(), public.team_category(uuid) to anon, authenticated;
