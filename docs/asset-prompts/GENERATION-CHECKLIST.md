> ⚠ Style changed to LINOCUT. Scene prompts are being re-issued in chat scene by scene as one combined message each; this file's scene descriptions are still valid, but use the linocut style bible.

# Image Generation Checklist (ChatGPT)

**How to use**
1. **One ChatGPT chat per scene.** First message of every chat: paste the style bible (`00-style-bible.md`). From scene 2 onward, also attach the approved `S1-master.png` as a style reference.
2. Send prompts **one at a time, in order**. Layers are made by *editing* the master in the same chat, so the framing stays identical.
3. Download each image as PNG and save it as **exactly** the filename shown into `assets-src/<scene>/`.
4. Tick the box. Claude handles chroma-keying, upscaling and exporting. Nobody cuts anything by hand.

**Screen-colour rule:** use **MAGENTA #FF00FF** wherever a scene contains green (smoke, tiles, Pollos). Use **GREEN #00FF00** elsewhere. Each prompt below already says which.

**Layer-prompt template** (used for every `-L*` line):
> Same image, **identical framing, camera, scale and position, nothing moved**. Keep ONLY [X] exactly as it is. Replace everything else with a perfectly flat solid [#00FF00 / #FF00FF] background, no shadows, no gradients, no texture on the screen colour.

**Clean-plate template** (background without the subject):
> Same image, identical framing. Remove [X] completely and paint in what would be behind it naturally. Change nothing else.

---

## S1: The Desert (hero), folder `assets-src/s1-desert/` · screen: MAGENTA
- [ ] `S1-master.png`: **(style test, do this first)** Wide 16:9 hand-drawn New Mexico desert at golden hour. A battered, highly detailed 1980s RV parked slightly right of centre, door ajar with a faint crystal-blue glow, wisp of smoke from the roof vent, two folding chairs and a gas mask in the dirt, distant mesas, big open sky. Keep the upper-centre sky fairly empty (title goes there) and the lower-centre ground clear (button goes there).
- [ ] `S1-L1-sky.png`: clean plate: remove the RV, chairs, gas mask, and ground foreground; keep only the sky and distant mesas. Extend the mesas naturally where the RV was.
- [ ] `S1-L2-ground.png`: layer: keep ONLY the desert ground, scrub and rocks (no sky, no RV) → magenta.
- [ ] `S1-L3-rv.png`: layer: keep ONLY the RV (and its smoke wisp) → magenta.
- [ ] `S1-L4-fg.png`: layer: keep ONLY the chairs, gas mask and nearest foreground rocks → magenta.
- [ ] `S1-V1-rv-cutaway.png`: edit of the master: same image, but the RV's near side wall is cut away like an architectural cross-section, revealing the interior meth-lab: glassware bubbling crystal blue, two figures in yellow hazmat suits and gas masks, smoke, blue glow. Everything else identical.
- [ ] `S1-V1-L3-rv-cutaway.png`: layer: keep ONLY the cutaway RV → magenta.
- [ ] `S1-mobile-master.png`: **new chat is fine**: the same scene re-composed **portrait 9:16** for phones, RV lower-centre, sky on top.

## S2: The Superlab, folder `assets-src/s2-superlab/` · screen: GREEN
> Revised 2026-10-16 (no railings/catwalks/hazmat; clipboard + wall pipe baked into the master so everything lines up). Send as one chat, in order; each layer is an EDIT of the master.
- [ ] `S2-master.png`: Wide 16:9, max quality. Underground production room, flat front view of the back wall, FULL of enormous steel cylinders/reactor tanks of different heights with portholes, gauges and overhead pipes; concrete ceiling slab across the top. NO railings, catwalks, stairs, people or text. An oversized steel clipboard with three blank clipped sheets hangs on the wall over the LEFT HALF (about 45% of the width, top edge ~10% to bottom edge ~68% of the height). A thick horizontal steel pipe with a dark EMPTY glass tube runs end to end (off both edges) at ~85% of the height, wall-mounted on brackets just above the floor, with 5 evenly spaced dusty-orange valve hand-wheels along it; the strip between clipboard and pipe is plain wall (labels go there). Crystal blue only on glowing portholes, gauge faces and drips; everything dark and moody.
- [ ] `S2-L1-back.png`: clean plate: remove the clipboard, the pipe, brackets and valves; paint in the plain wall and floor behind them. Change nothing else.
- [ ] `S2-L2-clipboard.png`: layer: keep ONLY the clipboard → green.
- [ ] `S2-L3-pipe.png`: layer: keep ONLY the pipe, brackets and valves → green.
- [ ] `S2-L4-glow.png`: layer: keep ONLY the crystal-blue glowing parts (portholes, gauge faces, drips) → green. (Animated in code: pulse/flicker.)
- [ ] `S2-transition-dirt.png`: **16:9** cross-section of the earth, joins S2-master (attach it): desert sand/gravel at the top, rock strata, a buried barrel, crossing pipes, roots, a steel hatch; bottom 10% = the same concrete ceiling slab and pipes as the top of S2-master. No sky.

## S3: The Classroom, folder `assets-src/s3-classroom/` · screen: GREEN
- [ ] `S3-master.png`: Wide 16:9 high-school chemistry classroom drawn in charcoal: a huge **blank, dusty chalkboard** centre-left, a large **blank periodic-table-style poster grid** on the right wall, lab benches, afternoon light through the blinds. A teacher in a short-sleeve shirt seen from behind at the edge of the frame.
- [ ] `S3-L1-room.png`: clean plate: remove the teacher.
- [ ] `S3-L2-teacher.png`: layer: keep ONLY the teacher → green.
- [ ] `S3-L3-desks.png`: layer: keep ONLY the nearest student desks/benches → green.

## S4: The Money Pile, folder `assets-src/s4-money/` · screen: GREEN
- [ ] `S4-master.png`: Wide 16:9 dim storage unit, roller door half open, a **huge mountain of banded cash** centre stage under a single bare bulb, a few blue plastic barrels to the side. Open dark space above the pile.
- [ ] `S4-L1-room.png`: clean plate: remove the cash pile and barrels.
- [ ] `S4-L2-cash.png`: layer: keep ONLY the cash mountain → green.
- [ ] `S4-L3-barrels.png`: layer: keep ONLY the barrels → green.
- [ ] `S4-L4-bulb.png`: layer: keep ONLY the bulb and its cord → green.

## S5: Car Wash, folder `assets-src/s5-carwash/` · screen: MAGENTA
- [ ] `S5-master.png`: Wide 16:9 sunny desert car wash in the style of the A1A car wash, but with **no readable text**: a big **blank roadside sign** on a pole, wash tunnel with brushes, an empty lane in front, palm tree, blue sky.
- [ ] `S5-L1-back.png`: clean plate: remove the brushes in front of the tunnel.
- [ ] `S5-L2-brushes.png`: layer: keep ONLY the spinning brushes → magenta.
- [ ] `S5-car.png`: **new image, same chat**: a plain, clean side-view sedan in the same style on a flat magenta background (sponsor logos are added onto its door in code).

## S6: Los Pollos Hermanos, folder `assets-src/s6-pollos/` · screen: MAGENTA
- [ ] `S6-master.png`: Wide 16:9 interior of a retro chicken fast-food restaurant (yellow/red/brown palette, no real logo): counter in front, a **large blank backlit menu board** overhead, and a calm manager in glasses and a shirt and tie standing behind the counter, **face in shadow**.
- [ ] `S6-L1-room.png`: clean plate: remove the manager.
- [ ] `S6-L2-gus.png`: layer: keep ONLY the manager → magenta.
- [ ] `S6-L3-counter.png`: layer: keep ONLY the counter (front-most) → magenta.

## S7: Saul's Office, folder `assets-src/s7-saul/` · screen: GREEN
- [ ] `S7-master.png`: Wide 16:9 tacky strip-mall lawyer office: fake marble columns, an inflatable Statue-of-Liberty figure, a flag, a cluttered desk, and a **boxy CRT TV with a blank grey screen** prominent on the right.
- [ ] `S7-L1-room.png`: clean plate: remove the desk.
- [ ] `S7-L2-desk.png`: layer: keep ONLY the desk → green.
- [ ] `S7-L3-tv.png`: layer: keep ONLY the CRT TV → green.

## S8: Desert at Night, folder `assets-src/s8-night/` · screen: MAGENTA
- [ ] `S8-master.png`: **in the S1 chat**, edit `S1-master`: same image, now at night under a starry sky, moonlight, the RV door wide open with strong crystal-blue light spilling onto the sand.
- [ ] `S8-L3-rv.png`: layer: keep ONLY the RV and its light spill → magenta.

## Extras, folder `assets-src/extras/`
- [ ] `X-avatar-1..6.png`: 6 head-and-shoulders portrait sketches: respirator / hazmat hood / welding goggles / bandana + sunglasses / lab goggles / pork-pie hat with face in shadow. Square, cream paper.
- [ ] `X-og.png`: 1200×630 social share card: the RV in the desert at dusk, large empty area on the left.
