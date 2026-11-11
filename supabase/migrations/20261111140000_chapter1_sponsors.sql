-- Chapter 1's sponsors are the two food sponsors. The company sponsors that backed out are hidden (not deleted:
-- problems or crews may still point at them). Logos are uploaded in Admin → Sponsors. Safe to run more than once.
update public.sponsors set visible = false, is_supplier = false
where name in ('Deriv', '.zero', 'Replit');

insert into public.sponsors (name, tier, symbol, is_supplier, sort_order, visible)
select x.name, 'food', x.symbol, false, x.sort_order, true
from (values ('Sam''s Burger', 'Sb', 1), ('Bubee Drinks Cafe', 'Bu', 2)) as x(name, symbol, sort_order)
where not exists (select 1 from public.sponsors s where lower(s.name) = lower(x.name));

-- prizes: AED 1,000 in cash, 500 / 300 / 200, open to everyone. Student-only cash prizes and the Replit perk go.
update public.event_config set prize_pool_aed = 1000 where id = 1;
delete from public.prizes where category_only = 'jesse' and awarded_team_id is null;
delete from public.prizes where kind = 'perk' and (name ilike '%replit%' or perk_description ilike '%replit%') and awarded_team_id is null;
update public.prizes p set amount_aed = x.amount, name = x.name
from (values (1, 'The Cook''s Cut', 500), (2, 'The Distributor''s Cut', 300), (3, 'The Lawyer''s Cut', 200)) as x(rank, name, amount)
where p.rank = x.rank and p.kind = 'cash' and p.category_only is null;
insert into public.prizes (rank, name, amount_aed, kind)
select x.rank, x.name, x.amount, 'cash'
from (values (1, 'The Cook''s Cut', 500), (2, 'The Distributor''s Cut', 300), (3, 'The Lawyer''s Cut', 200)) as x(rank, name, amount)
where not exists (select 1 from public.prizes p where p.rank = x.rank and p.kind = 'cash' and p.category_only is null);

-- FAQ: no more Walter / Jesse split or supplier pick; say what Chapter 1 is. Only touches the original wording.
update public.faqs set visible = false where q = 'Walter or Jesse?';
update public.faqs set a = 'Problem statements unseal at 12:00 sharp, for everyone at once. Your leader locks one in for the crew.'
where q = 'When do problems drop?' and a like 'Pick a supplier%';
update public.faqs set a = 'No. Free to enter, and our food sponsors keep you fed.'
where q = 'Does it cost anything?' and a = 'No. Free to enter. Food stalls are run by our sponsors.';
insert into public.faqs (q, a, sort_order)
select 'Why "Chapter 1"?',
       'Because every empire starts in an RV. This is the first Breaking Bytes: no big backers, a small cash pot, 24 hours and whoever shows up to cook. Chapter 2 is already being written.',
       0
where not exists (select 1 from public.faqs where q = 'Why "Chapter 1"?');
