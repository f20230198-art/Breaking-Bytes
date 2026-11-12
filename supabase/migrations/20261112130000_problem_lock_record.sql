-- Who locked a crew's problem in, and when. Set by a trigger, so it holds on every path: the leader's lock_problem
-- and an admin reassigning (or clearing) a problem in Admin → Crews. Hackers can't write teams directly (RLS), so
-- the record can't be forged. my_crew and admin_crews return it.

alter table public.teams
  add column problem_locked_at timestamptz,
  add column problem_locked_by uuid references public.profiles (id) on delete set null;

create function public.stamp_problem_lock() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.problem_locked_at := case when new.problem_id is null then null else now() end;
  new.problem_locked_by := case when new.problem_id is null then null else auth.uid() end;
  return new;
end;
$$;
create trigger stamp_problem_lock before update of problem_id on public.teams
  for each row when (old.problem_id is distinct from new.problem_id)
  execute function public.stamp_problem_lock();
revoke execute on function public.stamp_problem_lock() from public, anon, authenticated;

-- crews already holding a problem keep it, just without a who/when
create or replace function public.my_crew() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when t.id is null then null else jsonb_build_object(
    'id', t.id, 'name', t.name, 'invite_code', t.invite_code, 'leader_id', t.leader_id, 'roster_locked', t.roster_locked,
    'sponsor_id', t.sponsor_id, 'problem_id', t.problem_id, 'status', t.status, 'registration_status', t.registration_status,
    'problem_locked_at', t.problem_locked_at,
    'problem_locked_by', (select p.display_name from public.profiles p where p.id = t.problem_locked_by),
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

drop function public.admin_crews();
create function public.admin_crews() returns table (
  id uuid, name text, invite_code text, status public.team_status, registration_status public.registration_status,
  roster_locked boolean, category public.category, sponsor text, problem_id text, problem_title text,
  problem_locked_at timestamptz, problem_locked_by text, members jsonb, repo_url text,
  live_url text, video_url text, notes text, submitted_at timestamptz, late boolean, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
-- (the output columns are named like table columns: id, name, ... so plain names mean the columns)
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = 'P0001'; end if;
  return query
  select t.id, t.name, t.invite_code, t.status, t.registration_status, t.roster_locked, public.team_category(t.id), s.name,
         t.problem_id, pr.title, t.problem_locked_at, lb.display_name,
         (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.display_name, 'email', p.email, 'category', p.category,
                                                      'leader', p.id = t.leader_id, 'linkedin', p.linkedin_url, 'github', p.github_url)
                                    order by m.joined_at), '[]'::jsonb)
          from public.team_members m join public.profiles p on p.id = m.user_id where m.team_id = t.id),
         sub.repo_url, sub.live_url, sub.video_url, sub.notes, sub.updated_at,
         coalesce(sub.updated_at > (select deadline_at from public.event_config where id = 1), false),
         t.created_at
  from public.teams t
  left join public.sponsors s on s.id = t.sponsor_id
  left join public.problems pr on pr.id = t.problem_id
  left join public.profiles lb on lb.id = t.problem_locked_by
  left join public.submissions sub on sub.team_id = t.id
  order by t.created_at;
end;
$$;
revoke execute on function public.admin_crews() from public, anon, authenticated;
grant execute on function public.admin_crews() to authenticated; -- checks is_admin() inside
