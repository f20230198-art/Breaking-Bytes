"""Splits a green-screen layer of separate objects into one full-canvas file per object.

Each object (plus its ripple patch) becomes its own layer, numbered left to right, so it can move and be hit-tested
on its own. Usage: python scripts/assets/split_items.py assets-src/pool/P-items.png  ->  P-item-1.png, P-item-2.png ...
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

src = Path(sys.argv[1])
min_area = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0005  # ignore specks smaller than this canvas fraction
a = np.asarray(Image.open(src).convert("RGB"))
g = (a[..., 1] > 200) & (a[..., 0] < 90) & (a[..., 2] < 90)
fg = (~g).astype(np.uint8)
# join an object with its own ripples / loose bits before labelling
joined = cv2.dilate(fg, np.ones((25, 25), np.uint8))
n, labels, stats, _ = cv2.connectedComponentsWithStats(joined)
parts = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > min_area * fg.size]
parts.sort(key=lambda i: stats[i, cv2.CC_STAT_LEFT])
stem = src.stem[:-1] if src.stem.endswith("s") else src.stem  # P-items -> P-item
for k, i in enumerate(parts, 1):
    out = a.copy()
    out[(labels != i) | (fg == 0)] = (0, 255, 0)
    Image.fromarray(out).save(src.with_name(f"{stem}-{k}.png"))
    x, y, w, h = stats[i, :4]
    print(f"{stem}-{k}: x {x} y {y} w {w} h {h}")
