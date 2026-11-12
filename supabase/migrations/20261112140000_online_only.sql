-- Chapter 1 is fully online: no check-in, no venue. The 09:00 check-in, mentors on the floor and "head home" rows
-- go; the drop says where the cook happens; the FAQ stops promising food on site. (Only rows still carrying the
-- original wording are touched; anything an organiser added stays.)
delete from public.schedule_items
where day_offset = 0 and title in ('Registration opens', 'Check-in', 'Mentors on the floor', 'Head home');
update public.schedule_items
set detail = 'Problem statements unseal in the lab. The 24-hour cook starts now, from wherever you are.'
where day_offset = 0 and title = 'Problem statements drop';
update public.faqs set a = 'No. Free to enter, and you cook from wherever you are.'
where q = 'Does it cost anything?' and a like '%food sponsors%';
