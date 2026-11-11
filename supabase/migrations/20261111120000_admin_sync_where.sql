-- Adding or removing an admin email failed on hosted Supabase with "UPDATE requires a WHERE clause": the API
-- session loads pg_safeupdate, which also checks statements run inside triggers, and sync_admin_roles() updated
-- every profile with no WHERE. Same logic, now only touching the rows whose role actually changes.
create or replace function public.sync_admin_roles() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles p
  set role = x.role
  from (
    select q.id,
           case when exists (select 1 from public.admin_emails a where a.email = public._trusted_email(q.id)) then 'admin'::public.user_role
                when q.role = 'admin' then 'hacker'::public.user_role
                else q.role end as role
    from public.profiles q
  ) x
  where x.id = p.id and p.role is distinct from x.role;
  return null;
end;
$$;
