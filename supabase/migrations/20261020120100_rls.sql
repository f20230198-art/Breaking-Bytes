-- Row level security on every table. The rule of thumb:
--   * site content (event clock, sponsors, prizes, FAQ, schedule, announcements) is public read
--   * a hacker reads only their own profile, their own crew, its roster and its submission
--   * problem statements stay sealed until problems_release_at, on the server clock
--   * hackers have NO write policies at all: they act through the RPCs in 20261020120200_rpc.sql
--   * admins read and write everything (policies below), and every admin write is audited

alter table public.event_config enable row level security;
alter table public.admin_emails enable row level security;
alter table public.partner_universities enable row level security;
alter table public.profiles enable row level security;
alter table public.sponsors enable row level security;
alter table public.problems enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.submissions enable row level security;
alter table public.prizes enable row level security;
alter table public.faqs enable row level security;
alter table public.schedule_items enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_audit enable row level security;
alter table public.join_attempts enable row level security;

-- ─── public site content ──────────────────────────────────────────────────────────────────────────────────────
create policy "event clock is public" on public.event_config for select using (true);
create policy "visible sponsors are public" on public.sponsors for select using (visible or public.is_admin());
create policy "prizes are public" on public.prizes for select using (true);
create policy "visible faqs are public" on public.faqs for select using (visible or public.is_admin());
create policy "schedule is public" on public.schedule_items for select using (true);
create policy "announcements are public" on public.announcements for select using (true);
create policy "partner list is public" on public.partner_universities for select using (active or public.is_admin());

-- ─── hacker data ───────────────────────────────────────────────────────────────────────────────────────────────
-- own profile only; teammates are read through my_crew(), which returns safe fields (no email, no phone)
create policy "read own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "read own crew" on public.teams for select to authenticated
  using (id = public.my_team_id() or public.is_admin());

create policy "read own roster" on public.team_members for select to authenticated
  using (team_id = public.my_team_id() or public.is_admin());

create policy "read own submission" on public.submissions for select to authenticated
  using (team_id = public.my_team_id() or public.is_admin());

-- sealed until the drop, on the server clock
create policy "problems unseal at the drop" on public.problems for select to authenticated
  using (
    public.is_admin()
    or (is_published and now() >= coalesce((select problems_release_at from public.event_config where id = 1), 'infinity'::timestamptz))
  );

-- ─── admin-only tables ─────────────────────────────────────────────────────────────────────────────────────────
create policy "admins read the allowlist" on public.admin_emails for select to authenticated using (public.is_admin());
create policy "admins read the audit log" on public.admin_audit for select to authenticated using (public.is_admin());
-- join_attempts: no policies at all (only the join_team RPC touches it)

-- ─── admin writes (audited by triggers in 20261020120300_admin.sql) ───────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'event_config', 'admin_emails', 'partner_universities', 'profiles', 'sponsors', 'problems', 'teams',
    'team_members', 'submissions', 'prizes', 'faqs', 'schedule_items', 'announcements'
  ] loop
    execute format('create policy "admins insert" on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "admins update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- the event_config row and the profile rows are never created or deleted from the client
drop policy "admins insert" on public.event_config;
drop policy "admins delete" on public.event_config;
drop policy "admins insert" on public.profiles;

-- an admin cannot hand out the admin role directly: role follows admin_emails only (see sync_admin_roles)
-- (invoker rights on purpose: current_user is 'authenticated' for API calls, but the definer-rights sync functions run
-- as the owner, so their own role updates pass)
create function public.guard_profile_role() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.role is distinct from old.role and current_user = 'authenticated' then
    raise exception 'role_is_managed_by_admin_emails' using errcode = 'P0001';
  end if;
  if new.email is distinct from old.email and current_user = 'authenticated' then
    raise exception 'email_is_read_only' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger profiles_guard_role before update on public.profiles for each row execute function public.guard_profile_role();

-- live roster updates for the crew page (Realtime respects the select policies above)
alter publication supabase_realtime add table public.team_members, public.teams, public.announcements;
