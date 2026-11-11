-- Chapter 1 has no company sponsors, so there is no "pick a supplier" step any more: problem statements stand on
-- their own (grouped by track / domain on screen), and at the drop a crew's leader locks in any published problem.
-- pick_supplier / supplier_slots stay in place but nothing calls them; a problem may still name a sponsor.

alter table public.problems alter column sponsor_id drop not null;

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
  select * into pr from public.problems where id = p_problem and is_published for update; -- one lock at a time per problem
  if not found then raise exception 'no_such_problem' using errcode = 'P0001'; end if;
  if pr.capacity is not null
     and (select count(*) from public.teams where problem_id = pr.id and status = 'active' and registration_status = 'accepted') >= pr.capacity then
    raise exception 'problem_full' using errcode = 'P0001';
  end if;
  update public.teams set problem_id = pr.id where id = t.id;
end;
$$;
