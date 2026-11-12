-- Domains: the element tiles chalked on the classroom board (public, admin-editable), and the headings crews see
-- the problems grouped under. A problem's track should match a domain's name. Plus Chapter 1's three statements.

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  symbol text not null check (symbol ~ '^[A-Z][a-z]?$'), -- the element-tile stand-in, e.g. 'Ag'
  name text not null check (length(name) between 2 and 40),
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.domains enable row level security;
create policy "visible domains are public" on public.domains for select using (visible or public.is_admin());
create policy "admins insert" on public.domains for insert to authenticated with check (public.is_admin());
create policy "admins update" on public.domains for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete" on public.domains for delete to authenticated using (public.is_admin());
create trigger audit_admin after insert or update or delete on public.domains
  for each row execute function public.audit_admin_write();

insert into public.domains (symbol, name, sort_order) values
  ('Ag', 'Desert AgriTech', 1),
  ('Aq', 'Water & Climate AI', 2),
  ('Te', 'Off-Grid Connectivity', 3);

-- ─── Chapter 1's problem statements (sealed by RLS until problems_release_at; edit them in Admin → Problems) ───
-- One format for all three: THE CORE is the same for every team (so judges compare like with like), YOUR ANGLE is
-- where teams differ, THE DESERT RULES are the constraints every solution must respect. Shared, weighted criteria.
insert into public.problems (id, title, track, summary, body_md, criteria_md, is_published) values
('A-001', 'Smart Farming for the Desert', 'Desert AgriTech', 'Desert farms waste water and lose crops because decisions are made by habit and problems are spotted late. Build something that helps a desert grower decide better. Who you help, and how, is up to you.', 'THE SITUATION
Farming in the desert means sandy, salty soil, extreme heat, almost no rain and expensive water. Crops are often chosen by habit, plant problems are spotted late, and fields get too much or too little water. Every bad decision costs water that was never there to spare.

THE CORE (every team must deliver this)
Take real or realistic data about the crop, the soil or the environment (growth patterns, soil conditions, heat, humidity, salinity, water) and turn it into a decision a grower can act on. Show that decision being made, and show why it beats the grower''s guess.

YOUR ANGLE (this is where you stand out)
You choose the person, the decision and the method. Each of these would be a very different project:
- Who: a balcony grower in Dubai, a 50-hectare date farm, a greenhouse or hydroponics operator, an agricultural adviser covering hundreds of farms
- Which decision: what to plant, when and how much to water, what is wrong with a plant, how to share or trade scarce water, when to harvest
- How: a phone camera, cheap soil sensors, satellite imagery, a WhatsApp bot, a voice assistant for farmers who don''t read
These are examples, not a menu. The strongest entries find a problem inside the problem that nobody else spotted.

THE DESERT RULES (every solution must respect these)
- Water is the scarcest input: show how your idea saves it or uses it better.
- Your user may have weak connectivity and little time. It has to work for them.
- It has to be affordable for the person you chose.

WHAT TO SHOW
A working prototype, a demo on real or realistic data (say which), and one minute on why you chose your angle.', 'Every team on this problem is scored on the same five points:
1. The core (30%): does it fully do what THE CORE asks, and does it actually work?
2. Your angle (25%): how original and well chosen is the problem you found inside the problem?
3. Desert rules (20%): does it respect the constraints? Would it survive in the real desert?
4. Execution (15%): quality of the build and of the technical choices.
5. Demo and pitch (10%): is it clear what it does, for whom, and why it matters?
Ties go to the solution the judges would most want to see deployed.', true),
('W-001', 'Early Warnings for Desert Water Sources', 'Water & Climate AI', 'Communities and herders find out a well is failing when it is already dry. Build an AI system that warns them weeks earlier. What you predict, from which data, and how the warning reaches people is up to you.', 'THE SITUATION
In desert regions, whole communities and their livestock depend on a handful of wells, aquifers and oases. Today people usually find out a source is failing when it is already dry, and by then the options are a long journey or lost herds.

THE CORE (every team must deliver this)
1. Take satellite and/or sensor data (real, public, or realistically simulated) about at least one water source.
2. Predict something about its future (for example risk of failing, days left, expected level) and say how confident the prediction is.
3. Turn that prediction into a warning someone can act on, weeks before the crisis.

YOUR ANGLE (this is where you stand out)
- Who you warn: a herder with a basic phone, a village council, a water authority managing 500 wells, an aid agency deciding where to send water trucks
- What you predict: running dry, turning too salty, being overused by too many herds, which oasis to move to next
- How you predict: time-series models, vegetation from space as a stand-in for groundwater, reports crowdsourced from herders, combining many weak signals
- What happens after the warning: rationing plans, herd routes, sharing water between communities
These are examples, not a menu. Pick a direction and go deep.

THE DESERT RULES (every solution must respect these)
- Data is sparse and messy: say what you do when a sensor dies or the satellite image is cloudy.
- The people at risk often have basic phones and patchy coverage.
- A false alarm costs trust and a missed one costs lives: show how you balance the two.

DATA YOU CAN USE (optional)
Sentinel-2 or Landsat, NASA GRACE (groundwater), CHIRPS (rainfall), ERA5 (climate), all easy to pull through Google Earth Engine. Simulated sensor data is fine if you say so.

WHAT TO SHOW
The full chain, from data to prediction to a warning someone receives, on a real or realistic region.', 'Every team on this problem is scored on the same five points:
1. The core (30%): does it fully do what THE CORE asks, and does it actually work?
2. Your angle (25%): how original and well chosen is the problem you found inside the problem?
3. Desert rules (20%): does it respect the constraints? Would it survive in the real desert?
4. Execution (15%): quality of the build and of the technical choices.
5. Demo and pitch (10%): is it clear what it does, for whom, and why it matters?
Ties go to the solution the judges would most want to see deployed.', true),
('T-001', 'Staying Connected in the Deep Desert', 'Off-Grid Connectivity', 'Out in the desert there is no signal, little power and huge distances. Build a way for people there to communicate reliably. Who you connect, for what, and with which technology is up to you.', 'THE SITUATION
Outside the cities the desert is full of dead zones. Herders, field crews, remote clinics, desert camps and travellers often have no signal at all, power is scarce, distances are huge, and heat, dust and sandstorms are hard on equipment. When something goes wrong, nobody can call for help.

THE CORE (every team must deliver this)
Let at least two people or devices exchange useful information where there is no normal mobile coverage. Show it working (live between devices, or in a convincing simulation) and show what happens when the link is weak or drops.

YOUR ANGLE (this is where you stand out)
- Who: herders, tourists at a desert camp, oil-field crews, search-and-rescue teams, a remote clinic, a whole village
- What gets through: SOS and location, short messages, health readings, weather and sandstorm alerts, payments, lessons for children
- How: phone-to-phone mesh, LoRa radios, store-and-forward (data that rides along with a truck or a camel and syncs later), satellite SMS, solar relays, squeezing messages into tiny bandwidth
These are examples, not a menu. Hardware is optional: software, simulations and phone-to-phone demos all count.

THE DESERT RULES (every solution must respect these)
- Power is scarce: say how your devices stay charged.
- Heat, dust and distance are real: say how your system survives them.
- The cost per user has to make sense for the people you chose.

WHAT TO SHOW
A working demo or simulation, plus a short plan for how it would actually be deployed.', 'Every team on this problem is scored on the same five points:
1. The core (30%): does it fully do what THE CORE asks, and does it actually work?
2. Your angle (25%): how original and well chosen is the problem you found inside the problem?
3. Desert rules (20%): does it respect the constraints? Would it survive in the real desert?
4. Execution (15%): quality of the build and of the technical choices.
5. Demo and pitch (10%): is it clear what it does, for whom, and why it matters?
Ties go to the solution the judges would most want to see deployed.', true)
on conflict (id) do nothing;
