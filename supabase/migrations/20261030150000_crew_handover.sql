-- Crew handover on every write path, and a Realtime feed that can't leak other crews (audit 2026-10-30, round 2).
--   1. Whoever takes someone off a roster (leave_team, an admin's Remove / Move, deleting the account), the crew is
--      handed to its longest-standing member, or deleted if nobody is left. Before this only leave_team and
--      admin_delete_user did it, so an admin removing a leader left a crew nobody could lead.
--   2. team_members leaves the Realtime publication: Postgres can't check RLS on a deleted row, so every subscriber got
--      every crew's removals. A roster change now bumps teams.roster_updated_at, and the crew page listens to its own
--      teams row only (RLS-checked). announcements leaves it too (nothing listens).
--   3. join_team checks the caller (registration open, links, already in a crew) before looking the code up, so those
--      errors no longer tell a valid code from a wrong one.

-- ─── 1 + 2. one trigger keeps every crew led, non-empty and its roster stamp fresh ─────────────────────────────
alter table public.teams add column roster_updated_at timestamptz not null default now();

create function public.after_roster_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  heir uuid;
begin
  if tg_op in ('DELETE', 'UPDATE') and (tg_op = 'DELETE' or old.team_id is distinct from new.team_id) then
    perform 1 from public.teams where id = old.team_id for update;
    select user_id into heir from public.team_members where team_id = old.team_id order by joined_at, user_id limit 1;
    if heir is null then
      delete from public.teams where id = old.team_id;
    else
      -- (leader_id may already be null: deleting an account nulls it before the roster row goes)
      update public.teams set roster_updated_at = now(),
        leader_id = case when leader_id is null or leader_id = old.user_id then heir else leader_id end
      where id = old.team_id;
    end if;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.teams set roster_updated_at = now() where id = new.team_id;
  end if;
  return null;
end;
$$;
create trigger roster_changed after insert or delete or update of team_id on public.team_members
  for each row execute function public.after_roster_change();

-- the trigger does the handover now
create or replace function public.leave_team() returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  t public.teams := public._my_team(false);
begin
  if not public._roster_open(c.roster_lock_at) then raise exception 'rosters_frozen' using errcode = 'P0001'; end if;
  delete from public.team_members where team_id = t.id and user_id = me.id;
end;
$$;

create or replace function public.admin_delete_user(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  victim public.profiles;
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = 'P0001'; end if;
  if p_user = auth.uid() then raise exception 'cannot_delete_self' using errcode = 'P0001'; end if;
  select * into victim from public.profiles where id = p_user;
  if not found then raise exception 'no_such_user' using errcode = 'P0001'; end if;
  if victim.role = 'admin' then raise exception 'remove_admin_first' using errcode = 'P0001'; end if;
  -- the roster row goes first, so the crew is handed on (or deleted) by after_roster_change
  delete from public.team_members where user_id = p_user;
  perform public._audit('DELETE', 'users', p_user::text, to_jsonb(victim), null);
  delete from auth.users where id = p_user;
end;
$$;

alter publication supabase_realtime drop table public.team_members, public.announcements;

-- ─── 3. join_team: the caller's own checks first ───────────────────────────────────────────────────────────────
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
  if me.linkedin_url is null or me.github_url is null then raise exception 'need_a_link' using errcode = 'P0001'; end if;
  if exists (select 1 from public.team_members where user_id = me.id) then raise exception 'already_in_crew' using errcode = 'P0001'; end if;

  if code !~ '^ABQ-' then code := 'ABQ-' || code; end if;
  select * into t from public.teams where invite_code = code for update;
  hit := found; -- saved first: the insert below resets FOUND
  insert into public.join_attempts (user_id, ok) values (me.id, hit);
  if not hit then return null; end if;

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

-- ─── who may call what (new functions start out callable by everyone) ──────────────────────────────────────────
revoke execute on function public.after_roster_change() from public, anon, authenticated;
