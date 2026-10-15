"""Generates public/assets/logo/breaking-bytes-logo.svg with all lettering converted to paths.

Usage: python scripts/logo/build_logo.py <fonts_dir>
Fonts (Google Fonts, OFL/Apache): LuckiestGuy-Regular.ttf, Bangers-Regular.ttf, BowlbyOne-Regular.ttf
"""
import math
import random
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONTS = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[2] / "public/assets/logo/breaking-bytes-logo.svg"


class Font:
    def __init__(self, file):
        self.f = TTFont(FONTS / file)
        self.gs = self.f.getGlyphSet()
        self.cmap = self.f.getBestCmap()
        self.upm = self.f["head"].unitsPerEm

    def path(self, text, size, x=0, y=0, tracking=0, anchor="start"):
        """Return (svg path d, advance width) for text with baseline at y."""
        s = size / self.upm
        width = sum(self.gs[self.cmap[ord(c)]].width * s + tracking for c in text) - tracking
        if anchor == "middle":
            x -= width / 2
        pen = SVGPathPen(self.gs)
        cx = x
        for c in text:
            g = self.gs[self.cmap[ord(c)]]
            g.draw(TransformPen(pen, (s, 0, 0, -s, cx, y)))
            cx += g.width * s + tracking
        return pen.getCommands(), width


lucky = Font("LuckiestGuy-Regular.ttf")
bang = Font("Bangers-Regular.ttf")
bowlby = Font("BowlbyOne-Regular.ttf")

INK = "#0B0C10"


def extruded(d, depth=14, face="url(#face)", stroke=9, dx=1, dy=1):
    """Comic 3D lettering: stacked black extrusion + outlined gradient face + halftone + highlight."""
    out = [f'<path d="{d}" transform="translate({i*dx} {i*dy})" fill="{INK}" stroke="{INK}" '
           f'stroke-width="{stroke}" stroke-linejoin="round"/>' for i in range(depth, 0, -2)]
    out.append(f'<path d="{d}" fill="{INK}" stroke="{INK}" stroke-width="{stroke}" stroke-linejoin="round"/>')
    out.append(f'<path d="{d}" fill="{face}"/>')
    out.append(f'<path d="{d}" fill="url(#halftone)" clip-path="none" mask="url(#lowerHalf)"/>')
    out.append(f'<path d="{d}" fill="none" stroke="#FFF7C2" stroke-width="2.5" opacity=".9" '
               f'transform="translate(-2 -2)" mask="url(#upperHalf)"/>')
    return "\n".join(out)


def tile(cx, cy, size, rot, symbol, number, mass, name, sym_size):
    h = size / 2
    sym, _ = bowlby.path(symbol, sym_size, 0, sym_size * 0.36, tracking=0, anchor="middle")
    num, _ = bang.path(number, 34, -h + 18, -h + 46)
    ms, _ = bang.path(mass, 26, h - 18 - len(mass) * 11.5, -h + 44)
    nm, _ = bang.path(name, 26, 0, h - 20, tracking=3, anchor="middle")
    return f'''
  <g transform="translate({cx} {cy}) rotate({rot})">
    <rect x="{-h+16}" y="{-h+16}" width="{size}" height="{size}" rx="6" fill="{INK}"/>
    <rect x="{-h+8}" y="{-h+8}" width="{size}" height="{size}" rx="6" fill="{INK}"/>
    <rect x="{-h}" y="{-h}" width="{size}" height="{size}" rx="6" fill="url(#tileFill)" stroke="{INK}" stroke-width="10"/>
    <rect x="{-h+12}" y="{-h+12}" width="{size-24}" height="{size-24}" rx="3" fill="none" stroke="#B9F5C9" stroke-width="2.5" opacity=".55"/>
    <rect x="{-h}" y="{-h}" width="{size}" height="{size}" rx="6" fill="url(#tileDots)" mask="url(#tileShade)"/>
    <path d="{sym}" transform="translate(6 6)" fill="{INK}" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>
    <path d="{sym}" fill="#FFFFFF" stroke="{INK}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>
    <path d="{num}" fill="#EFFFF3"/>
    <path d="{ms}" fill="#CFF5DA"/>
    <path d="{nm}" fill="#CFF5DA"/>
  </g>'''


def burst(cx, cy, r1, r2, n, seed, jitter=0.18):
    rnd = random.Random(seed)
    pts = []
    for i in range(n * 2):
        a = math.pi * i / n - math.pi / 2
        r = (r1 if i % 2 == 0 else r2) * (1 + rnd.uniform(-jitter, jitter))
        pts.append(f"{cx + r*math.cos(a)*1.55:.1f},{cy + r*math.sin(a):.1f}")
    return " ".join(pts)


def shard(x, y, s, rot):
    return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})">'
            f'<path d="M0 -34 L18 -6 L8 30 L-14 22 L-20 -10 Z" fill="url(#crystal)" stroke="{INK}" stroke-width="{4/s:.1f}" stroke-linejoin="round"/>'
            f'<path d="M0 -34 L4 0 L8 30 M4 0 L-20 -10" stroke="#E9FDFF" stroke-width="{2/s:.1f}" fill="none" opacity=".8"/></g>')


def sparkle(x, y, s):
    return (f'<path transform="translate({x} {y}) scale({s})" d="M0 -20 Q2 -2 20 0 Q2 2 0 20 Q-2 2 -20 0 Q-2 -2 0 -20Z" '
            f'fill="#E9FDFF" filter="url(#glow)"/>')


W, H = 1400, 820

# Words
eaking, ew = lucky.path("EAKING", 210, 0, 0, tracking=-2)
ytes, yw = lucky.path("YTES", 210, 0, 0, tracking=-2)
tag, tw = bang.path("THE UNDERGROUND HACKATHON", 46, 0, 0, tracking=6, anchor="middle")
bits = [bang.path(t, sz, 0, 0)[0] for t, sz in (("01", 40), ("1", 30), ("10", 34), ("0", 24), ("011", 28))]

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<!-- Generated by scripts/logo/build_logo.py — edit the script, not this file. -->
<defs>
  <linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFF6B0"/><stop offset=".45" stop-color="#F5C518"/><stop offset="1" stop-color="#E08A1E"/>
  </linearGradient>
  <linearGradient id="tileFill" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#5BD48A"/><stop offset=".5" stop-color="#1F8E4D"/><stop offset="1" stop-color="#0F4F2C"/>
  </linearGradient>
  <linearGradient id="crystal" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#E9FDFF"/><stop offset=".45" stop-color="#00E5FF"/><stop offset="1" stop-color="#006E9E"/>
  </linearGradient>
  <radialGradient id="burstFill" cx=".5" cy=".5" r=".6">
    <stop offset="0" stop-color="#1B3A4A"/><stop offset=".7" stop-color="#11161F"/><stop offset="1" stop-color="#0B0C10"/>
  </radialGradient>
  <pattern id="halftone" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
    <circle cx="5" cy="5" r="2.6" fill="#B4560E" fill-opacity=".55"/>
  </pattern>
  <pattern id="tileDots" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <circle cx="4.5" cy="4.5" r="2" fill="#000" fill-opacity=".35"/>
  </pattern>
  <pattern id="burstDots" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
    <circle cx="7" cy="7" r="2.4" fill="#00E5FF" fill-opacity=".22"/>
  </pattern>
  <linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1">
    <stop offset=".45" stop-color="#000"/><stop offset=".75" stop-color="#fff"/>
  </linearGradient>
  <linearGradient id="fadeUp" x1="0" y1="0" x2="0" y2="1">
    <stop offset=".1" stop-color="#fff"/><stop offset=".4" stop-color="#000"/>
  </linearGradient>
  <linearGradient id="diag" x1="0" y1="0" x2="1" y2="1">
    <stop offset=".45" stop-color="#000"/><stop offset="1" stop-color="#fff"/>
  </linearGradient>
  <mask id="lowerHalf" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#fadeDown)"/></mask>
  <mask id="upperHalf" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#fadeUp)"/></mask>
  <mask id="tileShade" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#diag)"/></mask>
  <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="smoke" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
</defs>

<!-- toxic smoke behind everything -->
<g filter="url(#smoke)" opacity=".75">
  <ellipse cx="300" cy="640" rx="210" ry="90" fill="#1F6E3D"/>
  <ellipse cx="1120" cy="250" rx="200" ry="80" fill="#1F6E3D"/>
  <ellipse cx="760" cy="700" rx="260" ry="70" fill="#2C8F55" opacity=".7"/>
</g>

<!-- comic action burst -->
<polygon points="{burst(700, 400, 360, 270, 18, 7)}" fill="{INK}" transform="translate(14 14)"/>
<polygon points="{burst(700, 400, 360, 270, 18, 7)}" fill="url(#burstFill)" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>
<polygon points="{burst(700, 400, 360, 270, 18, 7)}" fill="url(#burstDots)"/>
<polygon points="{burst(700, 400, 300, 250, 18, 7, 0.1)}" fill="none" stroke="#00E5FF" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round" opacity=".6"/>

<g transform="rotate(-5 700 400)">
  <!-- line 1: [Br]EAKING -->
  {tile(330, 270, 230, -6, "Br", "35", "79.904", "BROMINE", 118)}
  <g transform="translate(470 355)">{extruded(eaking)}</g>

  <!-- line 2: [B]YTES (staggered right, like the show) -->
  {tile(610, 520, 230, 5, "B", "5", "10.81", "BORON", 140)}
  <g transform="translate(748 607)">{extruded(ytes)}</g>

  <!-- byte-crystals shattering off the B tile -->
  <g>
    {shard(455, 470, 1.3, -25)}{shard(405, 560, 0.9, 30)}{shard(470, 610, 0.7, 70)}{shard(360, 500, 0.6, -60)}{shard(500, 405, 0.55, 10)}
    {sparkle(430, 420, 0.9)}{sparkle(372, 610, 0.6)}{sparkle(510, 560, 0.5)}
  </g>
  <g fill="#00E5FF" filter="url(#glow)">
    <path d="{bits[0]}" transform="translate(300 450) rotate(-12)"/>
    <path d="{bits[1]}" transform="translate(255 560)" opacity=".8"/>
    <path d="{bits[2]}" transform="translate(330 650) rotate(10)" opacity=".85"/>
    <path d="{bits[3]}" transform="translate(220 640)" opacity=".55"/>
    <path d="{bits[4]}" transform="translate(240 500) rotate(-20)" opacity=".5"/>
  </g>
</g>

<!-- tagline ribbon -->
<g transform="translate(700 742) rotate(-2)">
  <path d="M-470 -34 L-530 -34 L-505 0 L-530 34 L-470 34 Z" fill="#B88A00" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>
  <path d="M470 -34 L530 -34 L505 0 L530 34 L470 34 Z" fill="#B88A00" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>
  <rect x="-482" y="-42" width="964" height="84" fill="{INK}" transform="translate(9 9)"/>
  <rect x="-482" y="-42" width="964" height="84" fill="#F5C518" stroke="{INK}" stroke-width="8"/>
  <path d="{tag}" transform="translate(3 19)" fill="#E08A1E"/>
  <path d="{tag}" transform="translate(0 16)" fill="{INK}"/>
</g>
</svg>
'''

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(svg, encoding="utf-8")
print("wrote", OUT, f"(EAKING {ew:.0f}px, YTES {yw:.0f}px, tag {tw:.0f}px)")
