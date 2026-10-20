-- The server-side rules, tested as real users. Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(60);

-- start from a clean slate, whatever is in the local database (all inside this transaction, rolled back at the end)
delete from public.admin_emails;
delete from public.admin_audit;
truncate public.teams cascade;
delete from auth.users;
delete from public.partner_universities;
insert into public.partner_universities (name, domain_pattern) values ('BITS Pilani, Dubai Campus', 'dubai.bits-pilani.ac.in');

-- ─── cast ──────────────────────────────────────────────────────────────────────────────────────────────────────
insert into public.admin_emails (email) values ('gus@lospollos.test');
insert into public.partner_universities (name, domain_pattern) values ('Test U', '%.testu.edu');

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'walt@gmail.com', '{"full_name":"Walter White"}'),
  ('00000000-0000-0000-0000-00000000000b', 'jesse@dubai.bits-pilani.ac.in', '{"full_name":"Jesse Pinkman"}'),
  ('00000000-0000-0000-0000-00000000000c', 'skinny@cs.testu.edu', '{"full_name":"Skinny Pete"}'),
  ('00000000-0000-0000-0000-00000000000d', 'badger@gmail.com', '{"full_name":"Badger"}'),
  ('00000000-0000-0000-0000-00000000000e', 'gus@lospollos.test', '{"full_name":"Gus"}'),
  ('00000000-0000-0000-0000-00000000000f', 'tuco@gmail.com', '{"full_name":"Tuco"}');

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

-- ─── crews ─────────────────────────────────────────────────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select throws_ok($$ select public.create_team('ab') $$, 'P0001', 'bad_name', 'crew name too short');
select throws_ok($$ select public.create_team('<script>alert(1)</script>') $$, 'P0001', 'bad_name', 'markup is not a crew name');
select lives_ok($$ select public.create_team('Blue  Sky') $$, 'Walt starts a crew');
select matches((select invite_code from public.teams), '^ABQ-[2-9A-HJ-NP-Z]{5}$', 'invite code is server-made, ABQ-XXXXX');
select is((select name from public.teams), 'Blue Sky', 'whitespace in the name is collapsed');
select throws_ok($$ select public.create_team('Second Crew') $$, 'P0001', 'already_in_crew', 'one crew per person');
select is((public.my_crew() -> 'members' -> 0) ? 'email', false, 'my_crew never exposes emails');

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
select throws_ok($$ select public.set_roster_locked(true) $$, 'P0001', 'not_leader', 'only the leader locks the roster');
select throws_ok($$ select public.pick_supplier((select id from public.sponsors where name = 'Deriv')) $$, 'P0001', 'not_leader', 'only the leader picks a supplier');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$ select public.pick_supplier((select id from public.sponsors where name = 'Deriv')) $$, 'the leader picks Deriv');
select is((select taken from public.supplier_slots() where name = 'Deriv'), 1, 'supplier slots count the pick');

-- Tuco starts a second crew; with 2 crews / 3 suppliers and no slack the cap is 1, so Deriv is full
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000f","role":"authenticated"}', true);
select lives_ok($$ select public.create_team('Salamanca') $$, 'Tuco starts a crew');
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

-- ─── leaving ───────────────────────────────────────────────────────────────────────────────────────────────────
reset role;
update public.event_config set roster_lock_at = now() + interval '1 hour';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$ select public.leave_team() $$, 'the leader leaves');
reset role;
select is((select leader_id from public.teams where name = 'Blue Sky'), '00000000-0000-0000-0000-00000000000b'::uuid, 'the longest-standing member takes over');

select * from finish();
rollback;
