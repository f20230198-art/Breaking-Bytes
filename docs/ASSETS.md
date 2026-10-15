# Asset Strategy

## Who makes what
| Kind | Method | Examples |
|---|---|---|
| **Illustrations** (characters, scenes, props with personality) | AI image gen (GPT image / ChatGPT) using the style bible in `asset-prompts/00-style-bible.md` | RV scene, barrels, timeline panels, vault door, characters |
| **UI chrome** (must be crisp, animatable, themeable) | Hand-coded SVG | Glass pipe + liquid, flasks, periodic tiles, caution stripes, speech bubbles, burst shapes, stamps |
| **Textures/effects** | CSS (radial-gradient halftone, noise) or tiny tiled PNG | Halftone dots, paper grain, smoke blobs, dust |
| **Icons** | Lucide | Tabs, copy, lock, etc. |

**Rule of thumb:** if it moves along a path, changes color with state, or contains text → SVG/CSS. If it needs character and texture → AI.

## Legal / tone
- Parody *vibes*, original designs. **No actor faces or likenesses**, no official logo, no show screenshots, no "Breaking Bad" in the title lockup.
- Characters are archetypes: "The Professor" (bald, goatee, pork-pie hat, glasses — keep stylized, cartoonish, not Bryan Cranston), "The Kid" (beanie, baggy hoodie), "The Lawyer" (loud suit), "The Chicken Man" (glasses, manager uniform). Faces can be shadowed / hidden behind gas masks — gas masks solve likeness *and* look great.
- Keep it fun-PG: crystals are blue "code crystals", no drug paraphernalia beyond lab glassware.

## Generation workflow (keeps style consistent)
1. Generate the **style reference sheet** first (prompt `01`). Pick the best one. Re-attach it as a reference image to every later prompt.
2. Generate at 1536×1024 (landscape) / 1024×1536 (portrait) / 1024×1024.
3. For parallax layers ask for **transparent background** (GPT image supports it) or plain flat background, then remove BG (remove.bg / Photoshop / Higgsfield remove_background).
4. Export to **WebP** (quality ~80) + keep originals in `assets-src/` (git-ignored or LFS). Target: hero layers ≤ 250 KB each, others ≤ 120 KB.
5. Name files by asset ID below, e.g. `public/assets/hero/hero-rv.webp`.

## Asset list
| ID | Section | Description | Format | Size | Status |
|---|---|---|---|---|---|
| `style-sheet` | — | Style reference: palette, line weight, halftone, sample character + prop | ref only | 1536×1024 | ☐ |
| `hero-sky` | A | Desert sky w/ halftone sun — **CSS**, no image | CSS | — | ☐ |
| `hero-mesas` | A | Distant mesas silhouette strip, transparent | PNG→WebP | 2400×800 | ☐ |
| `hero-rv` | A | Beat-up RV, side 3/4 view, roof vent smoke, transparent | PNG→WebP | 1600×1000 | ☐ |
| `hero-foreground` | A | Rocks, scrub, folding chair w/ hazmat suit draped, transparent | PNG→WebP | 2400×700 | ☐ |
| `hero-smoke` | A | Green chemical smoke loop — **CSS blobs** first; optional looping WebM later | CSS/WebM | — | ☐ |
| `prop-handshake` | B | Panel: two gas-masked figures shaking hands inside RV | WebP | 1200×900 | ☐ |
| `prize-barrel-1/2/3` | B | Blue plastic barrel half-buried in sand; variants: gold glow / silver / bronze tag. Transparent. Separate `barrel-lid` layer for pop animation | PNG→WebP | 800×1000 | ☐ |
| `timeline-01-saul` | C | Flashy lawyer at desk handing out burner phones | WebP | 900×700 | ☐ |
| `timeline-02-precursors` | C | Gloved hands opening a "CLASSIFIED" file with chemical formulas | WebP | 900×700 | ☐ |
| `timeline-03-cook` | C | Two hazmat cooks at glowing laptops + lab glassware, night | WebP | 900×700 | ☐ |
| `timeline-04-deaddrop` | C | Duffel bag w/ USB drive dropped under a desert rock at dawn | WebP | 900×700 | ☐ |
| `timeline-05-purity` | C | Judges in lab coats holding a blue crystal up to a light, "99.1%" | WebP | 900×700 | ☐ |
| `vault-door` | D | Round steel vault door, front view, transparent; separate `vault-wheel` layer for rotation | PNG→WebP | 1400×1400 | ☐ |
| `dash-corkboard` | Dash | Cork texture tile | WebP tile | 512×512 | ☐ |
| `dash-polaroid-avatars` | Dash | 6 generic gas-mask/hazmat avatar portraits (default avatars) | WebP | 400×400 | ☐ |
| `dash-locker` | Dash | Evidence locker / metal shelf background (subtle, dark) | WebP | 1600×900 | ☐ |
| `hero-lens-alt` | A | Alternate "blacklight" version of the hero scene, revealed inside the cursor lens. Same composition, rendered as a glowing blue lab/blueprint | WebP | match hero | ☐ |
| `about-chalkboard` | About | Classroom chalkboard full of chemistry scribbles, with a teacher archetype seen from behind; leave an empty area for the about text | WebP | 2400×1200 | ☐ |
| `tracks-rv-side` | Tracks | Long side view of the RV with 3–4 empty windows (the track/problem text goes in them) | WebP | 3200×1000 | ☐ |
| `timeline-bg` | C | Painterly desert-night background for the timeline section | WebP | 2400×3000 | ☐ |
| `timeline-hanger` | C | Hazmat character hanging from the pipe, transparent | PNG→WebP | 600×900 | ☐ |
| `prize-barrel-student` | B | Smaller green-tagged barrel variant for the 2 student prizes | PNG→WebP | 600×750 | ☐ |
| `sponsors-tag` | Sponsors | Big evidence-tag / specimen-label sticker ("THE SUPPLIERS"); text is added in code | PNG | 1200×700 | ☐ |
| `faq-scene` | FAQ | Black-and-white ink sketch of a gas-masked figure gesturing, with empty space around it for bubbles | PNG | 1600×1000 | ☐ |
| `loader-mark` | Loader | Animated SVG, coded (glitching periodic tile) | SVG | — | ☐ |
| `og-image` | Meta | Social share card w/ title | PNG | 1200×630 | ☐ |
| `favicon` | Meta | "Co" periodic tile — **SVG** | SVG | — | ☐ |

### Coded SVG components (no AI)
`GlassPipe`, `Flask` (timeline nodes), `PeriodicTile`, `CautionStripes`, `SpeechBubble`, `BurstShape` (KAPOW), `Stamp` (CLASSIFIED / LOCKED IN / 99.1% PURE), `LedDigits`, `CrystalShard` (confetti shape).
