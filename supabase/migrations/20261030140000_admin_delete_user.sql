-- Admins delete a person outright (test accounts, data-removal requests). Deleting the auth user cascades to the
-- profile and the roster row; before that, their crew is handed to the longest-standing remaining member, or deleted
-- if they were the last one in it. Admins must come off the allowlist first, and nobody deletes themselves.

create function public.admin_delete_user(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  victim public.profiles;
  t public.teams;
  heir uuid;
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = 'P0001'; end if;
  if p_user = auth.uid() then raise exception 'cannot_delete_self' using errcode = 'P0001'; end if;
  select * into victim from public.profiles where id = p_user;
  if not found then raise exception 'no_such_user' using errcode = 'P0001'; end if;
  if victim.role = 'admin' then raise exception 'remove_admin_first' using errcode = 'P0001'; end if;

  select tm.* into t from public.teams tm join public.team_members m on m.team_id = tm.id
  where m.user_id = p_user for update of tm;
  if found then
    delete from public.team_members where team_id = t.id and user_id = p_user;
    select user_id into heir from public.team_members where team_id = t.id order by joined_at, user_id limit 1;
    if heir is null then
      delete from public.teams where id = t.id;
    elsif t.leader_id = p_user then
      update public.teams set leader_id = heir where id = t.id;
    end if;
  end if;

  perform public._audit('DELETE', 'users', p_user::text, to_jsonb(victim), null);
  delete from auth.users where id = p_user;
end;
$$;

revoke execute on function public.admin_delete_user(uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated; -- checks is_admin() inside
