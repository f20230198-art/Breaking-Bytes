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
insert into public.problems (id, title, track, summary, body_md, criteria_md, is_published) values
(
  'A-001',
  'Smart Farming for the Desert',
  'Desert AgriTech',
  'Help desert farmers choose crops that will thrive, keep plants healthy, and get the most out of scarce water, soil and inputs.',
  'THE SITUATION
Farming in the desert means sandy, salty soil, extreme heat, almost no rain and expensive water. Crops are often chosen by habit, plant problems are spotted late, and fields get too much or too little water.

THE CHALLENGE
Build a smart-farming solution that analyses crop characteristics, growth patterns, soil conditions and environmental factors (heat, humidity, salinity, water availability) to help a grower:
- identify crop varieties suited to their plot and season
- catch plant-health problems early (heat or water stress, disease, pests)
- optimise farming practices: irrigation scheduling, planting dates, fertiliser use
- make better use of limited water, land and inputs

WHO IT IS FOR
Small and mid-size farms, greenhouse and hydroponic growers, and agricultural advisers in arid regions like the UAE.

IDEAS TO GET YOU STARTED (not requirements)
- Crop recommendations from soil and climate inputs
- Plant-health checks from leaf photos
- Irrigation planners driven by weather forecasts
- Dashboards for soil and climate sensor data
Open datasets (FAO crop data, soil maps, weather APIs) or realistic simulated data are fine. Say which you used.

WHAT TO SHOW
A working prototype a farmer or adviser could actually use, demonstrated on real or realistic data.',
  '- Impact: does it solve a real problem for the people in the brief?
- Technical depth: how well does it work, and how well is it built?
- Realism: could it work in the desert, with the data, budget and connectivity that actually exist there?
- Demo: is it clear what it does and why it matters?
- Originality',
  true
),
(
  'W-001',
  'Early Warnings for Desert Water Sources',
  'Water & Climate AI',
  'Turn satellite and sensor data into early warnings: predict which wells, aquifers or oases are about to run dry, weeks before the crisis.',
  'THE SITUATION
In desert regions, whole communities and their livestock depend on a handful of wells, aquifers and oases. Today people usually find out a source is failing when it is already dry, and by then the options are a long journey or lost herds.

THE CHALLENGE
Build an AI system that combines satellite data with ground sensor data to:
- estimate the current state of each water source
- predict which sources are at risk of running dry, and roughly when
- raise early warnings weeks ahead, with how confident the model is
- get those warnings to the people affected, in a form they can act on (a simple map, SMS, local language)

WHO IT IS FOR
Desert communities, livestock herders, local water authorities and aid organisations.

IDEAS TO GET YOU STARTED (not requirements)
- Satellite: Sentinel-2 or Landsat (vegetation, surface water), NASA GRACE (groundwater), CHIRPS (rainfall), ERA5 (climate); Google Earth Engine makes these easy to pull
- Sensors: well levels, flow, salinity; simulated sensor data is fine, just be clear about it
- Remember who receives the warning: basic phones and patchy coverage

WHAT TO SHOW
A working pipeline from raw data to a warning someone receives, demonstrated on a real or realistic region.',
  '- Impact: does it solve a real problem for the people in the brief?
- Technical depth: how well does it work, and how well is it built?
- Realism: could it work in the desert, with the data, budget and connectivity that actually exist there?
- Demo: is it clear what it does and why it matters?
- Originality',
  true
),
(
  'T-001',
  'Staying Connected in the Deep Desert',
  'Off-Grid Connectivity',
  'Design reliable, affordable communication for remote desert areas with no towers, little power and huge distances.',
  'THE SITUATION
Outside the cities the desert is full of dead zones. Herders, field workers, remote clinics, desert camps and travellers often have no signal at all, power is scarce, distances are huge and the conditions (heat, dust, sandstorms) are hard on equipment. When something goes wrong, nobody can call for help.

THE CHALLENGE
Build a solution that gives people reliable communication in remote desert areas. For example, it could:
- keep people connected without a cell tower (mesh networks, LoRa, satellite links, store-and-forward)
- run on very little power and survive heat and dust
- put what matters first when bandwidth is tiny: emergency alerts, location, short messages
- stay affordable for the people who need it most
Hardware is optional. A software prototype, a network simulation, or a working demo between phones or laptops all count. Explain how it would be deployed for real.

WHO IT IS FOR
Herders and remote workers, desert tourism and safety teams, and emergency responders.

IDEAS TO GET YOU STARTED (not requirements)
- Offline messaging over Bluetooth or Wi-Fi mesh
- LoRa or Meshtastic networks
- SMS-over-satellite gateways
- Delay-tolerant networking
- Coverage planners that find where a relay would help most

WHAT TO SHOW
A prototype or simulation that proves the idea works under real desert constraints.',
  '- Impact: does it solve a real problem for the people in the brief?
- Technical depth: how well does it work, and how well is it built?
- Realism: could it work in the desert, with the data, budget and connectivity that actually exist there?
- Demo: is it clear what it does and why it matters?
- Originality',
  true
)
on conflict (id) do nothing;
