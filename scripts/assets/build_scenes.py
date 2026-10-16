"""Builds web-ready scene layers from assets-src/ into public/scenes/ + src/scenes/layers.generated.json.

- Magenta-screen layers are chroma-keyed (soft edge + de-spill) into transparent WebP.
- Scenes in UNIFY are re-printed: 2x upscale, then every pixel snapped to one linocut ink palette,
  so separate AI generations read as one crisp print (hard ink edges instead of soft upscaled mush).
- Every layer is resized to the same canvas as its scene master, so layers stack 1:1.
Usage: python scripts/assets/build_scenes.py [max_width=3344]
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets-src"
OUT = ROOT / "public" / "scenes"
MAX_W = int(sys.argv[1]) if len(sys.argv) > 1 else 3344

# scene -> master file, [(layer id, source file, keyed?)] in back-to-front order
SCENES = {
    "s1-desert": ("S1-master", [
        ("sky", "S1-L1-sky", True), ("ground", "S1-L2-ground", True), ("rv", "S1-L3-rv", True),
        ("rv-cutaway", "S1-V1-L3-rv-cutaway", True), ("fg", "S1-L4-fg", True)]),
    "s2-superlab": ("S2-master", [("back", "S2-L1-back", False), ("fg", "S2-L2-fg", True)]),
    "s3-classroom": ("S3-master", [
        ("room", "S3-L1-room", False), ("teacher", "S3-L2-teacher", True), ("desks", "S3-L3-desks", True)]),
    "s4-money": ("S4-master", [
        ("room", "S4-L1-room", False), ("cash", "S4-L2-cash", True), ("barrels", "S4-L3-barrels", True),
        ("bulb", "S4-L4-bulb", True)]),
    "s5-carwash": ("S5-master", [("back", "S5-L1-back", False), ("brushes", "S5-L2-brushes-aligned", True)]),
    "s6-pollos": ("S6-master", [
        ("room", "S6-L1-room", False), ("gus", "S6-L2-gus-aligned", True), ("counter", "S6-L3-counter", True)]),
    "s7-saul": ("S7-master", [
        ("room", "S7-L1-room", False), ("tv", "S7-L3-tv-aligned", True), ("desk", "S7-L2-desk-aligned", True)]),
    "s8-night": ("S8-master", [
        ("sky", "S8-L1-sky", True), ("ground", "S8-L2-ground", True), ("rv", "S8-L3-rv", True), ("fg", "S8-L4-fg", True)]),
}
SINGLES = {  # standalone images (keyed?)
    "s1-desert/mobile": ("s1-desert/S1-mobile-master", False),
    "s2-superlab/strata": ("s2-superlab/S2-transition-strata", False),
    "s5-carwash/car": ("s5-carwash/S5-car", True),
    "extras/og": ("extras/X-og", False),
    "extras/404": ("extras/X-404", False),
    "extras/dashboard-bg": ("extras/X-dashboard-bg", False),
    **{f"extras/avatar-{i}": (f"extras/X-avatar-{i}", False) for i in range(1, 7)},
}

# scenes/singles that get the unified print treatment (rolling out scene by scene)
UNIFY = {"s1-desert", "s2-superlab", "s1-desert/mobile", "s2-superlab/strata"}
# ink, paper, orange, rust, crystal, hazmat (matches the @theme tokens in globals.css)
PALETTE = np.array([[17, 17, 17], [239, 230, 210], [232, 106, 46], [150, 58, 34], [19, 200, 232], [232, 185, 49]], np.uint8)


def unify(img: Image.Image) -> Image.Image:
    """Upscale 2x and re-print in the shared palette. Neutral pixels may only become ink or paper."""
    a = np.asarray(img.convert("RGB"))
    a = cv2.resize(a, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    a = cv2.bilateralFilter(a, 9, 50, 6)
    lab = cv2.cvtColor(a, cv2.COLOR_RGB2LAB).astype(np.float32)
    chroma = np.hypot(lab[..., 1] - 128, lab[..., 2] - 128)
    pal = cv2.cvtColor(PALETTE[None], cv2.COLOR_RGB2LAB)[0].astype(np.float32)
    d = ((lab[..., None, :] - pal) ** 2).sum(-1)
    d[..., 2:] += np.where(chroma < 28, 1e9, 0)[..., None]
    idx = cv2.medianBlur(d.argmin(-1).astype(np.uint8), 5)
    out = PALETTE[idx]
    if img.mode == "RGBA":
        al = cv2.resize(np.asarray(img)[..., 3], (out.shape[1], out.shape[0]), interpolation=cv2.INTER_CUBIC)
        al = np.clip((al.astype(np.float32) - 96) * 4, 0, 255).astype(np.uint8)  # crisp cut edge
        return Image.fromarray(np.dstack([out, al]), "RGBA")
    return Image.fromarray(out)


def key_magenta(img: Image.Image) -> Image.Image:
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # "magenta-ness": high R and B, low G. 0 = not magenta, 1 = pure screen.
    m = np.clip((np.minimum(r, b) - g - 40) / 110, 0, 1)
    alpha = 1 - m
    # choke the matte ~1px so the printed edge, not the screen, defines the outline
    alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8))
    # de-spill: magenta spill = R and B both above G. Our inks never have that, so remove it everywhere.
    spill = np.clip(np.minimum(r, b) - g, 0, None)
    a[..., 0] -= spill
    a[..., 2] -= spill
    rgba = np.dstack([a, alpha * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def make_plate(master: Image.Image, keyed_layers) -> Image.Image:
    """Master with every keyed subject inpainted away: the bottom layer that fills gaps when layers move."""
    m = cv2.cvtColor(np.asarray(master.convert("RGB")), cv2.COLOR_RGB2BGR)
    hole = np.zeros(m.shape[:2], np.uint8)
    for lay in keyed_layers:
        al = np.asarray(lay.resize(master.size))[..., 3]
        cover = (al > 30).mean()
        if cover > 0.45:  # big environment layers (sky/ground) are not "subjects"
            continue
        hole |= (al > 30).astype(np.uint8)
    hole = cv2.dilate(hole * 255, np.ones((15, 15), np.uint8))
    small = cv2.resize(m, None, fx=0.5, fy=0.5); sh = cv2.resize(hole, None, fx=0.5, fy=0.5)
    filled = cv2.inpaint(small, sh, 9, cv2.INPAINT_TELEA)
    filled = cv2.resize(filled, (m.shape[1], m.shape[0]))
    out = np.where(hole[..., None] > 0, filled, m)
    return Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB))


def export(img: Image.Image, size, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    img = img.resize(size, Image.LANCZOS) if img.size != size else img
    img.save(dest.with_suffix(".webp"), "WEBP", quality=88, method=6)
    return dest.with_suffix(".webp")


def fit(size):
    w, h = size
    return (MAX_W, round(h * MAX_W / w)) if w > MAX_W else size


manifest = {}
for scene, (master, layers) in SCENES.items():
    m = Image.open(SRC / scene / f"{master}.png")
    if scene in UNIFY:
        m = unify(m)
    size = fit(m.size)
    export(m.convert("RGB"), size, OUT / scene / "master")
    entry = {"width": size[0], "height": size[1], "master": f"/scenes/{scene}/master.webp",
             "plate": f"/scenes/{scene}/plate.webp", "layers": []}
    keyed_imgs = []
    for lid, file, keyed in layers:
        im = Image.open(SRC / scene / f"{file}.png")
        im = key_magenta(im) if keyed else im.convert("RGB")
        if scene in UNIFY:
            im = unify(im)
        if keyed:
            keyed_imgs.append(im)
        export(im, size, OUT / scene / lid)
        layer = {"id": lid, "src": f"/scenes/{scene}/{lid}.webp"}
        if keyed:  # bounding box of visible pixels, as fractions of the canvas (for hit areas / anchors)
            al = np.asarray(im)[..., 3]
            ys, xs = np.where(al > 30)
            H, W = al.shape
            layer["bbox"] = [round(xs.min() / W, 4), round(ys.min() / H, 4), round(xs.max() / W, 4), round(ys.max() / H, 4)]
        entry["layers"].append(layer)
    export(make_plate(m, keyed_imgs), size, OUT / scene / "plate")
    manifest[scene] = entry
    print("scene", scene, size, len(layers), "layers")

singles = {}
for out, (file, keyed) in SINGLES.items():
    im = Image.open(SRC / f"{file}.png")
    im = key_magenta(im) if keyed else im.convert("RGB")
    if out in UNIFY:
        im = unify(im)
    size = fit(im.size)
    export(im, size, OUT / out)
    singles[out] = {"src": f"/scenes/{out}.webp", "width": size[0], "height": size[1]}

(ROOT / "src" / "scenes").mkdir(parents=True, exist_ok=True)
(ROOT / "src" / "scenes" / "layers.generated.json").write_text(
    json.dumps({"scenes": manifest, "singles": singles}, indent=2), encoding="utf-8")
print("ok", len(singles), "singles")
