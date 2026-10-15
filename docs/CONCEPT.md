# Creative Concept: "Heisenberg's Notebook"

> **Style pivot (2026-10-15):** no comic-book pop (too close to Bit N Build). The look is **hand-drawn realism**: pencil, charcoal and ink sketches with muted washes on cream notebook paper, where crystal blue is the only saturated colour. Style prompt: `asset-prompts/00-style-bible.md`. Logo: `public/assets/logo/breaking-bytes-logo.svg` (made by `scripts/logo/build_logo_sketch.py`).
> Where this doc says "comic", read it as "sketchbook / notebook". The mechanics below still apply.

> Bit N Build sets the **effort bar**: painted scenes, one standout interaction, text built into the art. We match the effort with **mechanics that only make sense for Breaking Bad + comics**, so nothing here would fit on their site.

## Core idea: the site *is* a notebook you flip through, and reading it is "the cook"
- **The hero is the notebook's cover / first spread**: a worn lab notebook with the hand-inked logo, a coffee ring, and the RV sketch. The first scroll **turns the page** (3D page curl) and you're inside.
- **Sketches draw themselves**: each illustration animates from pencil construction lines, to ink, to a colour wash as it enters the screen (layered images + SVG line-draw + mask reveal). Each section is a notebook *spread* with taped photos, annotations and arrows.
- **Purity meter** (global scroll-progress indicator): a small flask in the corner fills from 0% to **99.1%** as you read. Hitting the bottom gives a "99.1% — Pure." stamp. Doubles as the nav (click to jump between "chapters").
- **Colour shifts with the story**: early pages are sun-bleached desert yellow; as you go deeper the art moves into the night lab and the crystal blue takes over.

## Chapter by chapter
| Ch. | Section | Breaking-Bad-native idea |
|---|---|---|
| — | **Loader** | The logo draws itself: pencil guides, then ink, then the green marker fill, then the blue crystal appears |
| 1 | **Cover / Hero** | Notebook cover/spread described above. The RV sketch is in parallax layers. The countdown is a taped-on digital timer. CTA = a blue stamped button |
| 2 | **The Lesson (About)** | Classroom chalkboard: "Chemistry is the study of *change*" gets crossed out to "Hacking is the study of change." The about text writes itself in chalk as you scroll |
| 3 | **The Periodic Table of Problems** (tracks + sponsor problems) | Problems as **element tiles in a periodic table**: the sponsor's initials are the symbol, the "atomic number" is the formula ID, the colour is the track. Click and the tile flips/expands into the dossier. Number of tiles = number of sponsors, so it scales |
| 4 | **The Cook Schedule** | The glass pipe timeline (already planned), where each milestone is a **comic panel** that inks from pencil to colour as the liquid reaches it |
| 5 | **The Money Pile** (prizes) | A desert scene with barrels; prize amounts **count up like a money-counting machine**, with bills flying. Top 3 barrels, then the 2 green "Student Stash" barrels with an explainer caption about who's eligible |
| 6 | **The Distributors** (sponsors) | A parody **fast-food menu board** ("Los Hackos Hermanos"): each sponsor is a menu item with a logo |
| 7 | **Better Call Us** (FAQ + contact) | A cheesy late-night TV ad on a CRT: the FAQ plays as channel-flip "commercials" (click to flip), and the contacts are tacky business cards with copy buttons |
| 8 | **The Vault** (final CTA + footer) | The vault door swings open on scroll and the blue glow reveals "START COOKING → GO TO PORTAL" |

## Easter eggs (cheap, and memorable for hackers)
- Type `say my name` anywhere and a "Heisenberg." panel pops up with a "You're goddamn right" toast.
- Konami code switches the whole site to blacklight mode (blue glow, inverted ink).
- Console message for devtools-openers: an ASCII RV plus "Looking for vulnerabilities? Save it for the hackathon."
- 404 page: "Jesse, we have to 404."

## Why it isn't Bit N Build
Theirs is saturated pop-comic poster scenes with a cursor lens. Ours is a muted, hand-drawn notebook with one accent colour: page turns, sketches drawing themselves, a purity meter, the periodic table as content structure, and Breaking Bad set-pieces (classroom, menu board, TV ad).
