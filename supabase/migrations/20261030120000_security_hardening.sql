-- Security hardening (audit 2026-10-30).
--   1. The admin role and the Jesse category come from a *verified* address only: one Google vouched for. Before this,
--      anyone could call auth.signUp() with the public anon key and an allowlisted (or partner-university) address; the
--      signup trigger read the unverified email and handed out the role. Email accounts are trusted only on a local
--      stack whose seed turns dev_settings.trust_email_logins on (the dev login).
--   2. join_team serialises each person's attempts, so parallel requests can't slip past the 10-a-minute limit.
--   3. Only accepted crews compete: picking a supplier, locking a problem and shipping need registration_status =
--      'accepted', and only accepted crews count against supplier and problem caps (pending / waitlisted crews used to
--      eat supplier slots).
--   4. team_category() leaves the API (nothing outside definer functions uses it).

-- ─── 1. trusted email ──────────────────────────────────────────────────────────────────────────────────────────
-- local dev only (seed.sql turns it on): trust email + password accounts, so the dev login can make Jesses and admins
create table public.dev_settings (
  id int primary key default 1 check (id = 1),
  trust_email_logins boolean not null default false
);
insert into public.dev_settings (id) values (1);
alter table public.dev_settings enable row level security; -- no policies: nobody reads or writes it over the API
revoke all on public.dev_settings from anon, authenticated;

-- the user's address if it is verified (Google only hands over verified ones), else null. Auth sets app metadata, not
-- the user, so it can't be forged from the client.
create function public._trusted_email(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select lower(u.email) from auth.users u
  where u.id = p_user and u.email is not null and u.email_confirmed_at is not null
    and (
      u.raw_app_meta_data ->> 'provider' = 'google'
      or coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'google'
      or (select trust_email_logins from public.dev_settings where id = 1)
    );
$$;

-- role and category for one person, from their trusted address (a hand-set category is left alone)
create function public._sync_identity(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  e text := public._trusted_email(p_user);
  uni uuid := public.university_for(e);
begin
  update public.profiles p
  set role = case when e is not null and exists (select 1 from public.admin_emails a where a.email = e) then 'admin'::public.user_role
                  when p.role = 'admin' then 'hacker'::public.user_role
                  else p.role end,
      university_id = case when p.category_override then p.university_id else uni end,
      category = case when p.category_override then p.category
                      when uni is not null then 'jesse'::public.category
                      else 'walter'::public.category end
  where p.id = p_user;
end;
$$;

-- new auth user → plain profile; role and category follow once the address is verified (for Google sign-ins Auth
-- confirms the address in an update right after the insert, so the trigger below does the real work)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 60),
    case when new.raw_user_meta_data ->> 'avatar_url' ~ '^https://' then new.raw_user_meta_data ->> 'avatar_url' end
  );
  perform public._sync_identity(new.id);
  return new;
end;
$$;

-- address confirmed, changed, or a provider linked → re-derive role and category
create function public.handle_user_identity_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = lower(new.email)
  where id = new.id and new.email is not null and email is distinct from lower(new.email);
  perform public._sync_identity(new.id);
  return null;
end;
$$;
create trigger on_auth_user_identity_changed after update on auth.users for each row
  when (old.email is distinct from new.email or old.email_confirmed_at is distinct from new.email_confirmed_at
        or old.raw_app_meta_data is distinct from new.raw_app_meta_data)
  execute function public.handle_user_identity_change();

-- partner list changed → recompute everyone's category from their trusted address (except hand-set ones)
create or replace function public.recompute_categories() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles p
  set university_id = x.uni,
      category = case when x.uni is not null then 'jesse'::public.category else 'walter'::public.category end
  from (select id, public.university_for(public._trusted_email(id)) as uni from public.profiles) x
  where x.id = p.id and not p.category_override;
  return null;
end;
$$;

-- admin allowlist changed → grant / revoke the admin role to match, verified addresses only
create or replace function public.sync_admin_roles() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles p
  set role = case when exists (select 1 from public.admin_emails a where a.email = public._trusted_email(p.id)) then 'admin'::public.user_role
                  when p.role = 'admin' then 'hacker'::public.user_role
                  else p.role end;
  return null;
end;
$$;

-- anyone who got a role or category from an unverified address loses it now
select public._sync_identity(id) from public.profiles;

-- ─── 2 + 3. crews: serialised join attempts; accepted crews only past pre-registration ─────────────────────────
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

-- crews spread evenly over the suppliers: only accepted crews are coming, so only they count
create or replace function public._supplier_cap() returns int
language sql stable security definer set search_path = '' as $$
  select (ceil(
            (select count(*) from public.teams t
             where t.status = 'active' and t.registration_status = 'accepted'
               and exists (select 1 from public.team_members m where m.team_id = t.id))::numeric
            / greatest(1, (select count(*) from public.sponsors s where s.is_supplier and s.visible))
          ) + (select supplier_cap_slack from public.event_config where id = 1))::int;
$$;

create or replace function public.supplier_slots() returns table (sponsor_id uuid, name text, symbol text, logo_path text, taken int, cap int)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.symbol, s.logo_path,
         (select count(*) from public.teams t where t.sponsor_id = s.id and t.status = 'active' and t.registration_status = 'accepted')::int,
         public._supplier_cap()
  from public.sponsors s
  where s.is_supplier and s.visible
  order by s.sort_order, s.name;
$$;

create or replace function public.pick_supplier(p_sponsor uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  t public.teams := public._my_team(true);
  taken int;
begin
  if t.registration_status <> 'accepted' then raise exception 'not_accepted' using errcode = 'P0001'; end if;
  if c.supplier_pick_at is null or now() < c.supplier_pick_at or (c.problems_release_at is not null and now() >= c.problems_release_at) then
    raise exception 'supplier_window_closed' using errcode = 'P0001';
  end if;
  perform 1 from public.sponsors where id = p_sponsor and is_supplier and visible for update; -- one pick at a time per supplier
  if not found then raise exception 'not_a_supplier' using errcode = 'P0001'; end if;
  if t.sponsor_id = p_sponsor then return; end if;
  select count(*) into taken from public.teams
  where sponsor_id = p_sponsor and status = 'active' and registration_status = 'accepted' and id <> t.id;
  if taken >= public._supplier_cap() then raise exception 'supplier_full' using errcode = 'P0001'; end if;
  update public.teams set sponsor_id = p_sponsor, problem_id = null where id = t.id;
end;
$$;

create or replace function public.lock_problem(p_problem text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles := public._me();
  c public.event_config := public._cfg();
  t public.teams := public._my_team(true);
  pr public.problems;
begin
  if t.registration_status <> 'accepted' then raise exception 'not_accepted' using errcode = 'P0001'; end if;
  if c.problems_release_at is null or now() < c.problems_release_at then raise exception 'problems_sealed' using errcode = 'P0001'; end if;
  if c.deadline_at is not null and now() >= c.deadline_at then raise exception 'submissions_closed' using errcode = 'P0001'; end if;
  if t.problem_id is not null then raise exception 'problem_already_locked' using errcode = 'P0001'; end if;
  select * into pr from public.problems where id = p_problem and is_published for update;
  if not found then raise exception 'no_such_problem' using errcode = 'P0001'; end if;
  if t.sponsor_id is distinct from pr.sponsor_id then raise exception 'wrong_supplier' using errcode = 'P0001'; end if;
  if pr.capacity is not null
     and (select count(*) from public.teams where problem_id = pr.id and status = 'active' and registration_status = 'accepted') >= pr.capacity then
    raise exception 'problem_full' using errcode = 'P0001';
  end if;
  update public.teams set problem_id = pr.id where id = t.id;
end;
$$;

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

-- ─── who may call what (new functions start out callable by everyone) ──────────────────────────────────────────
revoke execute on function public._trusted_email(uuid), public._sync_identity(uuid), public.handle_user_identity_change()
  from public, anon, authenticated;
-- 4. only ever called inside definer functions (my_crew, admin_*), never by a policy or the app
revoke execute on function public.team_category(uuid) from public, anon, authenticated;
