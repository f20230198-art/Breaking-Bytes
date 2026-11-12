-- Registration happens online (the site is the register); 09:00 on day one is check-in at the venue.
update public.schedule_items
set title = 'Check-in', detail = 'Registered online? Show your ID at the door, grab your badge, find your crew.'
where day_offset = 0 and title = 'Registration opens';
