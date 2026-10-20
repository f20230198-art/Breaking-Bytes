-- Admin side: audit trail on every admin write, the sponsor-logo bucket, and a few admin-only reads.
-- Admins write tables directly (RLS: is_admin()); hackers never can, so any direct API write is an admin's.

-- ─── audit every direct (admin) write ──────────────────────────────────────────────────────────────────────────
-- writes the row; definer rights so it can insert into admin_audit, and it only ever records an admin as the actor
create function public._audit(p_action text, p_table text, p_id text, p_before jsonb, p_after jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then return; end if;
  insert into public.admin_audit (admin_id, action, target_table, target_id, before, after)
  values (auth.uid(), p_action, p_table, p_id, p_before, p_after);
end;
$$;

-- invoker rights on purpose: current_user is 'authenticated' only for writes made straight through the API (admins);
-- writes inside the hacker RPCs run as the function owner and are not admin edits, so they are skipped
create function public.audit_admin_write() returns trigger
language plpgsql set search_path = '' as $$
declare
  b jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  a jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  r jsonb := coalesce(a, b);
begin
  if current_user <> 'authenticated' then return null; end if;
  perform public._audit(tg_op, tg_table_name, coalesce(r ->> 'id', r ->> 'team_id', r ->> 'email', r ->> 'user_id'), b, a);
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'event_config', 'admin_emails', 'partner_universities', 'profiles', 'sponsors', 'problems', 'teams',
    'team_members', 'submissions', 'prizes', 'faqs', 'schedule_items', 'announcements'
  ] loop
    execute format('create trigger audit_admin after insert or update or delete on public.%I for each row execute function public.audit_admin_write()', t);
  end loop;
end $$;

-- ─── prize board: amounts from the pool and the ratios (an explicit amount wins) ──────────────────────────────
create view public.prize_board with (security_invoker = true) as
select p.id, p.rank, p.name, p.kind, p.perk_description, p.category_only, p.awarded_team_id,
       coalesce(
         p.amount_aed,
         case when p.kind = 'cash' and p.ratio is not null then
           round((select prize_pool_aed from public.event_config where id = 1)
                 * p.ratio / nullif(sum(p.ratio) filter (where p.kind = 'cash' and p.amount_aed is null) over (), 0))::int
         end
       ) as amount_aed
from public.prizes p;
grant select on public.prize_board to anon, authenticated;

-- ─── admin reads ───────────────────────────────────────────────────────────────────────────────────────────────
create function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = 'P0001'; end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'banned', (select count(*) from public.profiles where banned),
    'crews', (select count(*) from public.teams where status = 'active'),
    'disqualified', (select count(*) from public.teams where status = 'disqualified'),
    'solo', (select count(*) from public.profiles p where not exists (select 1 from public.team_members m where m.user_id = p.id)),
    'jesse_crews', (select count(*) from public.teams t where t.status = 'active' and public.team_category(t.id) = 'jesse'),
    'submitted', (select count(*) from public.submissions s join public.teams t on t.id = s.team_id
                  where t.status = 'active' and (s.repo_url is not null or s.live_url is not null or s.video_url is not null)),
    'suppliers', (select coalesce(jsonb_agg(jsonb_build_object('name', x.name, 'taken', x.taken, 'cap', x.cap)), '[]'::jsonb)
                  from public.supplier_slots() x)
  );
end;
$$;

-- every crew with its roster, category and submission, for the admin tables and the CSV export
create function public.admin_crews() returns table (
  id uuid, name text, invite_code text, status public.team_status, roster_locked boolean, category public.category,
  sponsor text, problem_id text, members jsonb, repo_url text, live_url text, video_url text, notes text,
  submitted_at timestamptz, late boolean
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = 'P0001'; end if;
  return query
  select t.id, t.name, t.invite_code, t.status, t.roster_locked, public.team_category(t.id), s.name, t.problem_id,
         (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.display_name, 'email', p.email, 'category', p.category,
                                                      'leader', p.id = t.leader_id) order by m.joined_at), '[]'::jsonb)
          from public.team_members m join public.profiles p on p.id = m.user_id where m.team_id = t.id),
         sub.repo_url, sub.live_url, sub.video_url, sub.notes, sub.updated_at,
         coalesce(sub.updated_at > (select deadline_at from public.event_config where id = 1), false)
  from public.teams t
  left join public.sponsors s on s.id = t.sponsor_id
  left join public.submissions sub on sub.team_id = t.id
  order by t.created_at;
end;
$$;

revoke execute on function public._audit(text, text, text, jsonb, jsonb), public.audit_admin_write(), public.admin_overview(), public.admin_crews() from public, anon, authenticated;
-- all three check is_admin() inside; _audit has to be callable by the (invoker-rights) audit trigger
grant execute on function public._audit(text, text, text, jsonb, jsonb), public.admin_overview(), public.admin_crews() to authenticated;

-- ─── sponsor logos: public read, admin write, images only, 2 MB ────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sponsor-logos', 'sponsor-logos', true, 2097152, array['image/png', 'image/webp', 'image/jpeg'])
on conflict (id) do nothing;

create policy "sponsor logos: admins upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'sponsor-logos' and public.is_admin());
create policy "sponsor logos: admins replace" on storage.objects for update to authenticated
  using (bucket_id = 'sponsor-logos' and public.is_admin());
create policy "sponsor logos: admins remove" on storage.objects for delete to authenticated
  using (bucket_id = 'sponsor-logos' and public.is_admin());
