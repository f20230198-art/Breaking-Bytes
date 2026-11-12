-- Chapter 1's clock (Gulf time, UTC+4), all still editable in Admin → Event:
--   16 Nov 10:00  the cook starts, problem statements unseal, the Dead Drop opens
--   17 Nov 00:00  crews freeze (no joining, leaving or new members after this)
--   17 Nov 10:00  submissions lock: 24 hours of cooking
update public.event_config set
  starts_at           = '2026-11-16 06:00:00+00',
  supplier_pick_at    = null,
  problems_release_at = '2026-11-16 06:00:00+00',
  submissions_open_at = '2026-11-16 06:00:00+00',
  roster_lock_at      = '2026-11-16 20:00:00+00',
  deadline_at         = '2026-11-17 06:00:00+00'
where id = 1;

-- the fuse timeline and FAQ follow the new 10:00 → 10:00 window (only rows still carrying the original times)
update public.schedule_items set time_label = '09:00'
where day_offset = 0 and title = 'Registration opens' and time_label = '10:00';
update public.schedule_items set time_label = '10:00', detail = 'Problem statements unseal. The 24-hour cook starts now.'
where day_offset = 0 and title = 'Problem statements drop' and time_label = '12:00';
update public.schedule_items set time_label = '10:00'
where day_offset = 0 and title = 'Mentors on the floor' and time_label = '12:00';
update public.schedule_items set time_label = '10:00'
where day_offset = 1 and title = 'Cook stops' and time_label = '12:00';
insert into public.schedule_items (day_offset, time_label, title, detail, sort_order)
select 0, '23:59', 'Crews freeze', 'Last chance to join or change crews. Rosters lock at midnight.', 5
where not exists (select 1 from public.schedule_items where title = 'Crews freeze');

update public.faqs set a = 'Problem statements unseal at 10:00 sharp on day one, for everyone at once. Your leader locks one in for the crew.'
where q = 'When do problems drop?' and a like '%12:00%';
