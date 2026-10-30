-- Security audit 2026-10-30, round 3 (skill run, report outside the repo).
--   1. The admin role and the Jesse category come from the address *Google* asserted, not the account's current email.
--      Before this, _trusted_email trusted auth.users.email whenever 'google' was anywhere in the providers list, so
--      (a) a Google user could updateUser({ email }) to an allowlisted / partner address (applied unverified when
--      'Confirm email' is off), and (b) an email + password account made ahead of an organiser became admin when their
--      Google sign-in auto-linked to it, with the squatter's password still working. Now: a verified Google identity
--      whose email equals the account email, and no password (email) identity on the account.
--   2. Admins can't delete profile rows directly (that skipped admin_delete_user's checks and left an auth user with no
--      profile); deleting a person goes through admin_delete_user only.
--   3. A hacker's direct INSERT into team_members no longer runs the crew-size check as the owner (it locked any crew
--      and answered 'team_full' before RLS refused the row).

-- ─── 1. trust the Google identity, not the account ─────────────────────────────────────────────────────────────
create or replace function public._trusted_email(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select lower(u.email) from auth.users u
  where u.id = p_user and u.email is not null and u.email_confirmed_at is not null
    and (
      (select trust_email_logins from public.dev_settings where id = 1)
      or (
        exists (select 1 from auth.identities i
                where i.user_id = u.id and i.provider = 'google'
                  and lower(i.identity_data ->> 'email') = lower(u.email)
                  and i.identity_data ->> 'email_verified' = 'true')
        and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email')
      )
    );
$$;

-- Auth writes the identity rows around the user row, so a linked, unlinked or changed identity re-derives the role too
create function public.handle_identity_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public._sync_identity(coalesce(new.user_id, old.user_id));
  return null;
end;
$$;
create trigger on_auth_identity_changed after insert or update or delete on auth.identities
  for each row execute function public.handle_identity_change();

-- anyone holding a role or category on the old rule loses it now
select public._sync_identity(id) from public.profiles;

-- ─── 2. no direct profile deletes ──────────────────────────────────────────────────────────────────────────────
drop policy "admins delete" on public.profiles;

-- ─── 3. crew-size check only for writes that can land ─────────────────────────────────────────────────────────
-- invoker rights, like guard_profile_role: current_user is 'authenticated' only for direct API writes, and those are
-- refused by RLS unless the caller is an admin; RPC writes run as the owner and are always checked
create or replace function public.enforce_team_size() returns trigger
language plpgsql set search_path = '' as $$
declare
  cap int := (select team_max from public.event_config where id = 1);
begin
  if current_user = 'authenticated' and not public.is_admin() then return new; end if;
  perform 1 from public.teams where id = new.team_id for update; -- serialise joins to one crew
  if (select count(*) from public.team_members where team_id = new.team_id) >= cap then
    raise exception 'team_full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ─── who may call what (new functions start out callable by everyone) ──────────────────────────────────────────
revoke execute on function public.handle_identity_change() from public, anon, authenticated;
