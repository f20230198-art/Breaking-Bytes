-- The server-side rules, tested as real users. Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(88);

-- start from a clean slate, whatever is in the local database (all inside this transaction, rolled back at the end)
delete from public.admin_emails;
delete from public.admin_audit;
truncate public.teams cascade;
delete from auth.users;
delete from public.partner_universities;
insert into public.partner_universities (name, domain_pattern) values ('BITS Pilani, Dubai Campus', 'dubai.bits-pilani.ac.in');

-- ─── cast ──────────────────────────────────────────────────────────────────────────────────────────────────────
insert into public.dev_settings (id) values (1) on conflict (id) do update set trust_email_logins = false; -- not the local dev escape hatch
insert into public.admin_emails (email) values ('gus@lospollos.test'), ('saul@bettercall.test'), ('mike@lospollos.test');
insert into public.partner_universities (name, domain_pattern) values ('Test U', '%.testu.edu');

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'walt@gmail.com', '{"full_name":"Walter White"}'),
  ('00000000-0000-0000-0000-00000000000b', 'jesse@dubai.bits-pilani.ac.in', '{"full_name":"Jesse Pinkman"}'),
  ('00000000-0000-0000-0000-00000000000c', 'skinny@cs.testu.edu', '{"full_name":"Skinny Pete"}'),
  ('00000000-0000-0000-0000-00000000000d', 'badger@gmail.com', '{"full_name":"Badger"}'),
  ('00000000-0000-0000-0000-00000000000e', 'gus@lospollos.test', '{"full_name":"Gus"}'),
  ('00000000-0000-0000-0000-00000000000f', 'tuco@gmail.com', '{"full_name":"Tuco"}'),
  ('00000000-0000-0000-0000-000000000010', 'hank@gmail.com', '{"full_name":"Hank"}');
-- what Auth does on a Google sign-in: the row first, then the verified address and the provider in an update
update auth.users set email_confirmed_at = now(), raw_app_meta_data = '{"provider":"google","providers":["google"]}';
-- everyone but Hank has already given both links (crews need them)
update public.profiles set github_url = 'https://github.com/' || split_part(email, '@', 1),
  linkedin_url = 'https://www.linkedin.com/in/' || split_part(email, '@', 1) where email <> 'hank@gmail.com';

-- everyone signs in mid-event: suppliers open, problems still sealed, Dead Drop not open yet
update public.event_config set registration_open = true, team_max = 3, supplier_cap_slack = 0,
  supplier_pick_at = now() - interval '1 hour', problems_release_at = now() + interval '1 hour',
  roster_lock_at = now() + interval '1 hour', submissions_open_at = now() + interval '2 hours', deadline_at = now() + interval '3 hours';
update public.problems set is_published = true;

-- ─── profiles: category and role come from the server ─────────────────────────────────────────────────────────
select is((select category::text from public.profiles where email = 'walt@gmail.com'), 'walter', 'gmail user is a Walter');
select is((select category::text from public.profiles where email = 'jesse@dubai.bits-pilani.ac.in'), 'jesse', 'partner-uni email is a Jesse');
select is((select category::text from public.profiles where email = 'skinny@cs.testu.edu'), 'jesse', 'wildcard domain pattern matches');
select is((select role::text from public.profiles where email = 'gus@lospollos.test'), 'admin', 'allowlisted email gets the admin role');
select is((select role::text from public.profiles where email = 'walt@gmail.com'), 'hacker', 'everyone else is a hacker');

-- an email + password signup (auto-confirmed, no Google) claiming an allowlisted or a partner-university address
insert into auth.users (id, email, email_confirmed_at, raw_app_meta_data) values
  ('00000000-0000-0000-0000-000000000011', 'saul@bettercall.test', now(), '{"provider":"email","providers":["email"]}'),
  ('00000000-0000-0000-0000-000000000012', 'fake@dubai.bits-pilani.ac.in', now(), '{"provider":"email","providers":["email"]}');
select is((select role::text from public.profiles where email = 'saul@bettercall.test'), 'hacker', 'an unverified allowlisted address gets no admin role');
select is((select category::text from public.profiles where email = 'fake@dubai.bits-pilani.ac.in'), 'walter', 'an unverified partner address is no Jesse');
delete from public.admin_emails where email = 'saul@bettercall.test';
insert into public.admin_emails (email) values ('saul@bettercall.test');
select is((select role::text from public.profiles where email = 'saul@bettercall.test'), 'hacker', 'nor does re-adding it to the allowlist');
-- a Google sign-in before Auth has confirmed the address: nothing yet, then the role once it's verified
insert into auth.users (id, email, raw_app_meta_data) values
  ('00000000-0000-0000-0000-000000000013', 'mike@lospollos.test', '{"provider":"google","providers":["google"]}');
select is((select role::text from public.profiles where email = 'mike@lospollos.test'), 'hacker', 'no role before the address is verified');
update auth.users set email_confirmed_at = now() where email = 'mike@lospollos.test';
select is((select role::text from public.profiles where email = 'mike@lospollos.test'), 'admin', 'the role arrives with the verified address');

select throws_ok($$ update public.profiles set github_url = 'https://evil.example/hank' where email = 'hank@gmail.com' $$, '23514', null,
  'the table itself refuses a non-GitHub link');

-- ─── pre-registration: LinkedIn and GitHub, both, real profile links ───────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000010","role":"authenticated"}', true);
select throws_ok($$ select public.create_team('Hank Crew') $$, 'P0001', 'need_a_link', 'no crew without LinkedIn and GitHub');
select throws_ok($$ select public.update_profile('Hank') $$, 'P0001', 'need_a_link', 'a profile needs the links');
select throws_ok($$ select public.update_profile('Hank', null, 'https://evil.example/in/hank') $$, 'P0001', 'bad_linkedin', 'prank LinkedIn links are refused');
select throws_ok($$ select public.update_profile('Hank', null, null, 'https://github.com/hank/../../evil') $$, 'P0001', 'bad_github', 'only a GitHub profile, not any path');
select throws_ok($$ select public.update_profile('Hank Schrader', null, 'https://www.linkedin.com/in/hank-schrader') $$, 'P0001', 'need_a_link', 'LinkedIn alone is not enough');
select throws_ok($$ select public.update_profile('Hank Schrader', null, 'https://www.linkedin.com/in/hank-schrader', 'https://github.com/Walt') $$, 'P0001', 'link_taken', 'no claiming someone else''s GitHub');
select lives_ok($$ select public.update_profile('Hank Schrader', null, 'https://www.linkedin.com/in/hank-schrader', 'https://github.com/hank') $$, 'LinkedIn and GitHub together');

-- ─── crews ─────────────────────────────────────────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select throws_ok($$ select public.create_team('ab') $$, 'P0001', 'bad_name', 'crew name too short');
select throws_ok($$ select public.create_team('<script>alert(1)</script>') $$, 'P0001', 'bad_name', 'markup is not a crew name');
select lives_ok($$ select public.create_team('Blue  Sky') $$, 'Walt starts a crew');
select matches((select invite_code from public.teams), '^ABQ-[2-9A-HJ-NP-Z]{5}$', 'invite code is server-made, ABQ-XXXXX');
select is((select name from public.teams), 'Blue Sky', 'whitespace in the name is collapsed');
select throws_ok($$ select public.create_team('Second Crew') $$, 'P0001', 'already_in_crew', 'one crew per person');
select is((public.my_crew() -> 'members' -> 0) ? 'email', false, 'my_crew never exposes emails');
select is(public.my_crew() ->> 'registration_status', 'pending', 'a new crew waits for the organisers');
update public.teams set registration_status = 'accepted';
reset role;
select is((select registration_status::text from public.teams where name = 'Blue Sky'), 'pending', 'a leader cannot accept their own crew');
set local role authenticated;

reset role;
create temp table code on commit drop as select invite_code as c from public.teams where name = 'Blue Sky';
grant select on code to authenticated;
set local role authenticated;

-- Jesse joins with a sloppy, lowercase code without the prefix
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok($$ select public.create_team('blue sky') $$, 'P0001', 'name_taken', 'crew names are unique, case-insensitively');
select isnt(public.join_team(lower(substr((select c from code), 5))), null::uuid, 'Jesse joins with a lowercase code, no prefix');
select is((public.my_crew() ->> 'category'), 'walter', 'a mixed crew is Walter');

-- Badger guesses codes until the rate limit stops him
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select is(public.join_team('ABQ-ZZZZZ'), null::uuid, 'a wrong code just returns null');
select is(public.join_team('ABQ-ZZZZY'), null::uuid, 'another wrong code');
select is(public.join_team('ABQ-ZZZZX'), null::uuid, '3');
select is(public.join_team('ABQ-ZZZZW'), null::uuid, '4');
select is(public.join_team('ABQ-ZZZZV'), null::uuid, '5');
select is(public.join_team('ABQ-ZZZZU'), null::uuid, '6');
select is(public.join_team('ABQ-ZZZZT'), null::uuid, '7');
select is(public.join_team('ABQ-ZZZZS'), null::uuid, '8');
select is(public.join_team('ABQ-ZZZZR'), null::uuid, '9');
select is(public.join_team('ABQ-ZZZZQ'), null::uuid, '10');
select throws_ok($$ select public.join_team('ABQ-ZZZZP') $$, 'P0001', 'rate_limited', 'the 11th guess in a minute is refused');

-- Skinny joins (3/3), then Tuco finds the crew full
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select isnt(public.join_team((select c from code)), null::uuid, 'Skinny joins: crew is now at the cap of 3');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000f","role":"authenticated"}', true);
select throws_ok($$ select public.join_team((select c from code)) $$, 'P0001', 'crew_full', 'a full crew refuses a 4th');
select throws_ok($$ select public.pick_supplier((select id from public.sponsors where name = 'Deriv')) $$, 'P0001', 'not_in_crew', 'no crew, no supplier');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$ select public.pick_supplier((select id from public.sponsors where name = 'Deriv')) $$, 'P0001', 'not_accepted', 'a pending crew can''t pick a supplier');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000f","role":"authenticated"}', true);
-- the organisers accept Blue Sky
reset role;
update public.teams set registration_status = 'accepted' where name = 'Blue Sky';
set local role authenticated;

-- ─── what an outsider can see and do ──────────────────────────────────────────────────────────────────────────
select is((select count(*)::int from public.teams), 0, 'outsiders cannot read other crews');
select is((select count(*)::int from public.team_members), 0, 'or their rosters');
select is((select count(*)::int from public.profiles), 1, 'a hacker reads only their own profile');
select throws_ok($$ insert into public.teams (name, invite_code) values ('Sneaky', 'ABQ-22222') $$, '42501', null, 'no direct inserts into teams');
select is((select count(*)::int from public.problems), 0, 'problem statements are sealed before the drop');
update public.event_config set deadline_at = now() + interval '100 years';
reset role;
select isnt((select deadline_at from public.event_config), now() + interval '100 years', 'a hacker cannot move the deadline (RLS drops the write)');
set local role authenticated;

-- ─── leader-only actions and suppliers ────────────────────────────────────────────────────────────────────────
select throws_ok($$ select public.admin_crews() $$, 'P0001', 'not_admin', 'hackers can''t list crews');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select ok(not exists (select 1 from pg_proc where proname = 'set_roster_locked'), 'leaders have no roster lock RPC');
select throws_ok($$ select public.pick_supplier((select id from public.sponsors where name = 'Deriv')) $$, 'P0001', 'not_leader', 'only the leader picks a supplier');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$ select public.pick_supplier((select id from public.sponsors where name = 'Deriv')) $$, 'the leader picks Deriv');
select is((select taken from public.supplier_slots() where name = 'Deriv'), 1, 'supplier slots count the pick');

-- Tuco starts a second crew; with 2 crews / 3 suppliers and no slack the cap is 1, so Deriv is full
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000f","role":"authenticated"}', true);
select lives_ok($$ select public.create_team('Salamanca') $$, 'Tuco starts a crew');
select throws_ok($$ select public.upsert_submission('https://github.com/x', null, null) $$, 'P0001', 'not_accepted', 'a pending crew can''t ship');
reset role;
update public.teams set registration_status = 'accepted' where name = 'Salamanca';
set local role authenticated;
select throws_ok($$ select public.pick_supplier((select id from public.sponsors where name = 'Deriv')) $$, 'P0001', 'supplier_full', 'a full supplier refuses more crews');
select throws_ok($$ select public.lock_problem('D-001') $$, 'P0001', 'problems_sealed', 'no locking problems before the drop');

-- ─── the drop and the Dead Drop ───────────────────────────────────────────────────────────────────────────────
reset role;
update public.event_config set problems_release_at = now() - interval '1 minute', submissions_open_at = now() - interval '1 minute';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select count(*)::int from public.problems), 3, 'problems unseal at the drop');
select throws_ok($$ select public.pick_supplier((select id from public.sponsors where name = '.zero')) $$, 'P0001', 'supplier_window_closed', 'suppliers are fixed once problems drop');
select throws_ok($$ select public.lock_problem('Z-001') $$, 'P0001', 'wrong_supplier', 'only your supplier''s problems');
select lives_ok($$ select public.lock_problem('D-001') $$, 'the leader locks Deriv''s problem');
select throws_ok($$ select public.upsert_submission('http://github.com/x', null, null) $$, 'P0001', 'bad_url', 'links must be https');
select throws_ok($$ select public.upsert_submission('javascript:alert(1)', null, null) $$, 'P0001', 'bad_url', 'no javascript: links');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok($$ select public.upsert_submission('https://github.com/blue-sky/cook', 'https://bluesky.dev', null, 'v1') $$, 'any member can ship');
select is((select repo_url from public.submissions), 'https://github.com/blue-sky/cook', 'the crew reads its own submission');

reset role;
update public.event_config set deadline_at = now() - interval '1 second';
set local role authenticated;
select throws_ok($$ select public.upsert_submission('https://github.com/late', null, null) $$, 'P0001', 'submissions_closed', 'nothing gets in after the deadline');

-- ─── bans ──────────────────────────────────────────────────────────────────────────────────────────────────────
reset role;
update public.profiles set banned = true where email = 'badger@gmail.com';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select throws_ok($$ select public.create_team('Banned Crew') $$, 'P0001', 'banned', 'banned users can''t act');

-- ─── admins ────────────────────────────────────────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select is((select count(*)::int from public.teams), 2, 'admins see every crew');
update public.event_config set deadline_at = now() + interval '1 hour';
select is((select count(*)::int from public.admin_audit where target_table = 'event_config'), 1, 'admin edits are audited');
select throws_ok($$ update public.profiles set role = 'admin' where email = 'walt@gmail.com' $$, 'P0001', 'role_is_managed_by_admin_emails', 'the admin role only comes from the allowlist');
select is((public.admin_overview() ->> 'crews')::int, 2, 'admin overview counts crews');
select is((select count(*)::int from public.admin_crews()), 2, 'admin crew list returns every crew');
select is((select jsonb_array_length(members) from public.admin_crews() where name = 'Blue Sky'), 3, 'with their rosters');
select is((select members -> 0 ->> 'github' from public.admin_crews() where name = 'Blue Sky'), 'https://github.com/walt', 'admins see members'' links');
update public.teams set registration_status = 'accepted' where name = 'Blue Sky';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000010","role":"authenticated"}', true);
select throws_ok($$ select public.join_team((select c from code)) $$, 'P0001', 'crew_accepted', 'an accepted crew''s roster is the organisers'' call');

-- ─── leaving ───────────────────────────────────────────────────────────────────────────────────────────────────
reset role;
update public.event_config set roster_lock_at = now() + interval '1 hour';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$ select public.leave_team() $$, 'the leader leaves');
reset role;
select is((select leader_id from public.teams where name = 'Blue Sky'), '00000000-0000-0000-0000-00000000000b'::uuid, 'the longest-standing member takes over');


-- ─── deleting people ───────────────────────────────────────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000010","role":"authenticated"}', true);
select throws_ok($$ select public.admin_delete_user('00000000-0000-0000-0000-00000000000b') $$, 'P0001', 'not_admin', 'hackers can''t delete people');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select throws_ok($$ select public.admin_delete_user('00000000-0000-0000-0000-00000000000e') $$, 'P0001', 'cannot_delete_self', 'no deleting yourself');
select throws_ok($$ select public.admin_delete_user('00000000-0000-0000-0000-000000000013') $$, 'P0001', 'remove_admin_first', 'admins come off the allowlist first');
select lives_ok($$ select public.admin_delete_user('00000000-0000-0000-0000-00000000000b') $$, 'an admin deletes Jesse, Blue Sky''s leader now');
select lives_ok($$ select public.admin_delete_user('00000000-0000-0000-0000-00000000000f') $$, 'and Tuco, alone in Salamanca');
reset role;
select is((select leader_id from public.teams where name = 'Blue Sky'), '00000000-0000-0000-0000-00000000000c'::uuid, 'a deleted leader hands the crew on');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), 0, 'the profile and account are gone');
select is((select count(*)::int from public.teams where name = 'Salamanca'), 0, 'a crew left empty goes with its last member');

select * from finish();
rollback;
