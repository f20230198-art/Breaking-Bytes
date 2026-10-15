# Asset Pipeline: "Master plate → layers"

The problem we're solving: separately generated small assets are hard to place and look stitched together, while a single flat background looks dead.
The fix: **every scene starts as ONE big composed painting** (the "master plate"). All layers are **cut from that same image** and exported **at the full canvas size**, so they line up automatically: we just stack them. Nobody "places" anything.

## Per scene, step by step
1. **Master plate:** generate the whole scene composed as a single image (16:9), with **empty space where the UI/text will sit** (say so in the prompt).
2. **Upscale** 2–4× to ~3840×2160 (Higgsfield `upscale_image`, Upscayl, or Topaz). GPT outputs (~1536px) are too soft for full-screen otherwise.
3. **Split into 3–5 depth layers, made by ChatGPT, not cut by hand.** In the same chat, edit the master: "identical framing, keep ONLY X, everything else flat #00FF00 (or #FF00FF if the scene has green)". Claude only chroma-keys that exact colour and checks the alignment. Prompts: `asset-prompts/GENERATION-CHECKLIST.md`. Each layer is a full-canvas transparent PNG:
   - `bg`: sky / far wall. The subject is removed and the hole filled (AI edit: "remove the RV, fill naturally").
   - `mid`: the main environment.
   - `subject`: the RV / Gus / cash pile, cut out (remove-background tool or Photoshop "Select Subject").
   - `fg`: foreground rocks, door frame, desk edge, etc.
   - Anything that animates (water, smoke, a spinning wheel) gets its own layer.
4. **Variants from the same master** with image *editing*, not new generations: e.g. the RV **cutaway interior** (same angle, side wall removed) and the **night** version of the desert. Same framing, so they cross-fade perfectly.
5. **Motion:** loops like smoke, steam or a flickering TV can be short **image-to-video clips** made from the plate (WebM/MP4, 3–5 s seamless loop, muted) used inside one layer.
6. **Export:** AVIF + WebP, responsive sizes (1280 / 1920 / 2560 / 3840), roughly ≤400 KB per layer at 1920. Keep originals in `assets-src/` (git-ignored).
7. **Manifest:** each scene gets `src/scenes/<scene>/manifest.ts` listing its layers (file, depth for parallax, z-order, blend mode). The code renders layers from the manifest, so no hand-positioning.
8. **Mobile:** for the hero, a separate portrait (9:16) master. Other scenes reuse the 16:9 layers cropped with a defined focal point.

## What code adds on top (keeps it alive, not a static picture)
Parallax between layers on scroll and mouse, particles (dust, chalk, money bills, foam), heat haze (SVG displacement), light flicker and glow, the hand-drawn "draw-in" reveal, scroll-driven camera pushes (scale/translate of the whole stack), and scene transitions.

## Quality loop
After each scene is built, take headless screenshots at desktop and mobile sizes, compare against the master plate, fix, and only then move to the next scene.

## Scene plate list (8 masters + variants)
| Scene | Master plate | Variants / extra layers |
|---|---|---|
| ① Desert | Desert + RV, golden hour | RV cutaway interior; portrait mobile master; dust/smoke loop |
| ② Superlab | Underground lab wide shot, empty middle band for the pipe | Steam loop |
| ③ Classroom | Classroom with chalkboard (clear) + periodic poster area | Chalk-dust particles in code |
| ④ Money Pile | Storage unit, cash mountain, bulb | Bulb flicker; bills particles in code |
| ⑤ Car Wash | A1A-style car wash, empty lane | Car silhouette layer (logos added in code); foam loop |
| ⑥ Pollos | Counter + menu board (blank) + Gus from behind/shadow | — |
| ⑦ Saul's Office | Tacky office, CRT TV (blank screen) | TV static loop |
| ⑧ Desert Night | Edit of ① into night, RV door glowing | — |
| Earth cross-section | Transition strip ① → ②: sand, rock strata, pipes (tall 9:32) | — |
