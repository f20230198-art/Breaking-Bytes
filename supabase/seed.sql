-- Placeholder content, mirroring src/data/site.ts until the club confirms the real values (all editable in /admin).
-- Times are UTC; the venue is Gulf time (UTC+4): pick 10:00, drop 12:00 on 16 Nov, Dead Drop 08:00–12:00 on 17 Nov.
-- Admin emails are NOT seeded (no personal addresses in git): add yours locally with
--   insert into public.admin_emails (email) values ('you@example.com');

update public.event_config set
  registration_open = true,
  starts_at = '2026-11-16 08:00+00',
  supplier_pick_at = '2026-11-16 06:00+00',
  problems_release_at = '2026-11-16 08:00+00',
  roster_lock_at = '2026-11-16 08:00+00',
  submissions_open_at = '2026-11-17 04:00+00',
  deadline_at = '2026-11-17 08:00+00',
  team_max = 4,
  supplier_cap_slack = 1,
  prize_pool_aed = 7000
where id = 1;

insert into public.partner_universities (name, domain_pattern) values
  ('BITS Pilani, Dubai Campus', 'dubai.bits-pilani.ac.in');

insert into public.sponsors (name, tier, symbol, is_supplier, sort_order) values
  ('Deriv', 'track', 'Dv', true, 1),
  ('.zero', 'track', 'Zo', true, 2),
  ('Replit', 'perk', 'Rp', true, 3);

insert into public.problems (id, sponsor_id, title, track, summary, is_published)
select x.id, s.id, x.title, x.track, 'Placeholder brief: the real statement is entered in admin.', false
from (values ('D-001', 'Deriv', 'Deriv problem statement (TBA)', 'FinTech'),
             ('Z-001', '.zero', '.zero problem statement (TBA)', 'Open'),
             ('R-001', 'Replit', 'Replit problem statement (TBA)', 'AI / Tools')) as x(id, sponsor, title, track)
join public.sponsors s on s.name = x.sponsor;

insert into public.prizes (rank, name, ratio, kind, category_only) values
  (1, 'The Cook''s Cut', 6, 'cash', null),
  (2, 'The Distributor''s Cut', 4, 'cash', null),
  (3, 'The Lawyer''s Cut', 2, 'cash', null),
  (4, 'The Partner''s Cut', 1, 'cash', 'jesse'),
  (5, 'The Rookie''s Cut', 1, 'cash', 'jesse');
insert into public.prizes (rank, name, kind, perk_description) values
  (10, 'The Replit Combo', 'perk', 'Best idea: Replit subscriptions'),
  (11, 'Night Shift Special', 'perk', 'Best hack built after midnight');

insert into public.faqs (q, a, sort_order) values
  ('Who can join?', 'Anyone who can cook code. Students, grads, professionals. Crews of 1–4.', 1),
  ('Walter or Jesse?', 'Just our nicknames for the two prize pools. Students are Jesses: sign in with your partner-university Google account and you also compete for the student prizes. Everyone else is a Walter. Same hackathon, same rules, same 24 hours.', 2),
  ('Does it cost anything?', 'No. Free to enter. Food stalls are run by our sponsors.', 3),
  ('Can I bring pre-built code?', 'No pre-cooked repos. Libraries and boilerplate are fine; the product must be built during the 24 hours.', 4),
  ('When do problems drop?', 'Pick a supplier from 10:00. Problem statements unseal at 12:00 sharp for everyone at once.', 5),
  ('What do I submit?', 'GitHub repo, a live link, and a short demo video — before the timer hits zero.', 6);

insert into public.schedule_items (day_offset, time_label, end_label, title, detail, sort_order) values
  (0, '10:00', null, 'Registration opens', 'Check in, grab your badge, find your crew.', 1),
  (0, '12:00', null, 'Problem statements drop', 'Pick your problem. The 24-hour cook starts now.', 2),
  (0, '12:00', '18:00', 'Mentors on the floor', 'Stuck? Flag one down. They''re around all afternoon.', 3),
  (0, '18:00', null, 'Head home', 'The venue closes. The cook doesn''t.', 4),
  (1, '12:00', null, 'Cook stops', 'Timer hits zero. Submissions lock.', 5),
  (1, '14:00', null, 'Top 10% shortlisted', 'The purest batches make the cut.', 6),
  (1, '15:00', null, 'Judging', 'Shortlisted crews demo to the judges.', 7),
  (1, '17:00', null, 'Winners announced', 'Somebody walks out with the cash.', 8);
