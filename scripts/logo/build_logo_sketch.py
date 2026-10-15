"""Hand-inked "Heisenberg's notebook" logo -> public/assets/logo/breaking-bytes-logo.svg (+ -transparent.svg).

Usage: python scripts/logo/build_logo_sketch.py <fonts_dir>
Fonts (Google Fonts): ArchivoBlack-Regular.ttf, PermanentMarker-Regular.ttf, Caveat.ttf
"""
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONTS = Path(sys.argv[1])
OUTDIR = Path(__file__).resolve().parents[2] / "public/assets/logo"


class Font:
    def __init__(self, file):
        self.f = TTFont(FONTS / file)
        self.gs = self.f.getGlyphSet()
        self.cmap = self.f.getBestCmap()
        self.upm = self.f["head"].unitsPerEm

    def path(self, text, size, x=0, y=0, tracking=0, anchor="start"):
        s = size / self.upm
        width = sum(self.gs[self.cmap[ord(c)]].width * s + tracking for c in text) - tracking
        if anchor == "middle":
            x -= width / 2
        elif anchor == "end":
            x -= width
        pen = SVGPathPen(self.gs)
        cx = x
        for c in text:
            g = self.gs[self.cmap[ord(c)]]
            g.draw(TransformPen(pen, (s, 0, 0, -s, cx, y)))
            cx += g.width * s + tracking
        return pen.getCommands(), width


grot = Font("ArchivoBlack-Regular.ttf")
marker = Font("PermanentMarker-Regular.ttf")
hand = Font("Caveat.ttf")

INK = "#17150F"
GREEN = "#2E6B3F"
PENCIL = "#6B655A"
BLUE = "#13C8E8"


def tile(x, y, size, symbol, number, mass, name, sym_size, rot, seed):
    h = size / 2
    sym, _ = grot.path(symbol, sym_size, 0, sym_size * 0.36, tracking=-4, anchor="middle")
    num, _ = marker.path(number, 30, -h + 16, -h + 40)
    ms, _ = hand.path(mass, 32, h - 14, -h + 38, anchor="end")
    nm, _ = hand.path(name, 30, 0, h - 16, tracking=1, anchor="middle")
    return f'''
  <g transform="translate({x} {y}) rotate({rot})">
    <!-- marker fill: slightly overshoots the box, uneven, hatched -->
    <rect x="{-h-3}" y="{-h+2}" width="{size+4}" height="{size-2}" fill="{GREEN}" filter="url(#markerFill{seed})"/>
    <rect x="{-h}" y="{-h}" width="{size}" height="{size}" fill="url(#hatch)" filter="url(#rough{seed})" opacity=".28"/>
    <!-- double ink outline, slightly off each other like a quick sketch -->
    <rect x="{-h}" y="{-h}" width="{size}" height="{size}" fill="none" stroke="{INK}" stroke-width="5" filter="url(#rough{seed})"/>
    <rect x="{-h+3}" y="{-h-2}" width="{size-4}" height="{size+3}" fill="none" stroke="{INK}" stroke-width="2" opacity=".7" filter="url(#rough{seed+1})"/>
    <!-- pencil construction lines running past the corners -->
    <path d="M{-h-40} {-h} H{h+30} M{-h} {-h-30} V{h+36} M{-h-24} {h} H{h+44}" stroke="{PENCIL}" stroke-width="1.2" opacity=".55" filter="url(#rough{seed+2})"/>
    <path d="{sym}" fill="#F3EEDF" stroke="{INK}" stroke-width="3" paint-order="stroke" filter="url(#rough{seed})"/>
    <path d="{num}" fill="#F3EEDF" filter="url(#rough{seed+1})"/>
    <path d="{ms}" fill="#E4EBD9" filter="url(#rough{seed+1})"/>
    <path d="{nm}" fill="#E4EBD9" filter="url(#rough{seed+2})"/>
  </g>'''


def rough(id_, seed, scale=3.2, freq=0.035):
    return (f'<filter id="{id_}" x="-10%" y="-10%" width="120%" height="120%">'
            f'<feTurbulence type="fractalNoise" baseFrequency="{freq}" numOctaves="3" seed="{seed}" result="n"/>'
            f'<feDisplacementMap in="SourceGraphic" in2="n" scale="{scale}" xChannelSelector="R" yChannelSelector="G"/></filter>')


def marker_fill(id_, seed):
    # wobbly edge + streaky, uneven alcohol-marker density
    return (f'<filter id="{id_}" x="-10%" y="-10%" width="120%" height="120%">'
            f'<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="{seed}" result="edge"/>'
            f'<feDisplacementMap in="SourceGraphic" in2="edge" scale="9" xChannelSelector="R" yChannelSelector="G" result="d"/>'
            f'<feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="2" seed="{seed+5}" result="streak"/>'
            f'<feColorMatrix in="streak" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 1.2" result="a"/>'
            f'<feComposite in="d" in2="a" operator="in"/></filter>')


W, H = 1300, 760

eaking, ew = grot.path("eaking", 196, 0, 0, tracking=-6)
ytes, yw = grot.path("ytes", 196, 0, 0, tracking=-6)
tagline, tw = marker.path("THE UNDERGROUND HACKATHON", 40, 0, 0, tracking=3, anchor="middle")
note, _ = hand.path("99.1% pure", 44, 0, 0)
note2, _ = hand.path("(made of bytes)", 30, 0, 0)

filters = "".join(rough(f"rough{i}", i) for i in range(1, 9)) + marker_fill("markerFill1", 11) + marker_fill("markerFill5", 23)

BODY = f'''
<g transform="rotate(-1.5 650 380)">
  <!-- pencil baseline guides -->
  <path d="M60 300 H1240 M200 560 H1250" stroke="{PENCIL}" stroke-width="1.1" opacity=".45" filter="url(#rough4)"/>

  {tile(230, 200, 220, "Br", "35", "79.904", "Bromine", 128, -2.5, 1)}
  <g transform="translate(366 298)">
    <path d="{eaking}" fill="{INK}" filter="url(#inkBleed)"/>
    <path d="{eaking}" fill="none" stroke="{INK}" stroke-width="1.6" transform="translate(4 -3)" opacity=".55" filter="url(#rough6)"/>
  </g>

  {tile(560, 458, 220, "B", "5", "10.81", "Boron", 150, 2, 5)}
  <g transform="translate(696 556)">
    <path d="{ytes}" fill="{INK}" filter="url(#inkBleed)"/>
    <path d="{ytes}" fill="none" stroke="{INK}" stroke-width="1.6" transform="translate(4 -3)" opacity=".55" filter="url(#rough7)"/>
  </g>

  <!-- the only saturated colour: one blue crystal, watercolour-washed, with a notebook annotation -->
  <g transform="translate(300 470) rotate(-14)">
    <path d="M0 -62 L40 -18 L26 52 L-30 46 L-46 -14 Z" fill="{BLUE}" opacity=".85" filter="url(#wash)"/>
    <path d="M0 -62 L40 -18 L26 52 L-30 46 L-46 -14 Z M0 -62 L-6 4 L26 52 M-6 4 L40 -18 M-6 4 L-46 -14 M-6 4 L-30 46"
          fill="none" stroke="{INK}" stroke-width="3" stroke-linejoin="round" filter="url(#rough3)"/>
    <path d="M-36 -10 L-6 4 M-20 30 L-6 4" stroke="#E8FCFF" stroke-width="3" opacity=".9" filter="url(#rough2)"/>
  </g>
  <g fill="{INK}" filter="url(#rough8)">
    <path d="{note}" transform="translate(98 610) rotate(-6)"/>
    <path d="{note2}" transform="translate(108 650) rotate(-6)" opacity=".75"/>
  </g>
  <path d="M232 590 C250 570 262 548 272 528 M272 528 l-16 4 M272 528 l2 16" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linecap="round" filter="url(#rough5)"/>

  <!-- tagline in marker, with a scribbled double underline -->
  <g transform="translate(870 664) rotate(-1)">
    <path d="{tagline}" fill="{INK}" filter="url(#rough2)"/>
    <path d="M-330 22 C-120 30 120 14 335 20 M-310 34 C-60 40 160 28 300 34" fill="none" stroke="{BLUE}" stroke-width="5" stroke-linecap="round" opacity=".9" filter="url(#rough3)"/>
  </g>
</g>'''

DEFS = f'''<defs>
  {filters}
  <filter id="inkBleed" x="-5%" y="-10%" width="110%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="9" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.5" result="ga"/>
    <feComposite in="d" in2="ga" operator="in"/>
  </filter>
  <filter id="wash" x="-30%" y="-30%" width="160%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="1.2"/>
  </filter>
  <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
    <path d="M0 0 V9" stroke="#0E2A17" stroke-width="2.2"/>
  </pattern>
  <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
    <path d="M28 0 H0 V28" fill="none" stroke="#9FB7C9" stroke-width=".8" opacity=".55"/>
  </pattern>
  <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="2"/>
    <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.25  0 0 0 0.09 0"/></filter>
  <radialGradient id="stain" cx=".5" cy=".5" r=".5">
    <stop offset=".78" stop-color="#8A5A2B" stop-opacity="0"/><stop offset=".9" stop-color="#8A5A2B" stop-opacity=".22"/><stop offset="1" stop-color="#8A5A2B" stop-opacity="0"/>
  </radialGradient>
</defs>'''

PAPER = f'''
<rect width="{W}" height="{H}" fill="#EFE8D6"/>
<rect width="{W}" height="{H}" fill="url(#grid)"/>
<path d="M120 0 V{H}" stroke="#D27A6E" stroke-width="1.5" opacity=".5"/>
<rect width="{W}" height="{H}" filter="url(#paper)"/>
<circle cx="1150" cy="150" r="105" fill="url(#stain)" filter="url(#rough4)"/>'''

head = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">\n<!-- Generated by scripts/logo/build_logo_sketch.py — edit the script, not this file. -->\n'
(OUTDIR / "breaking-bytes-logo.svg").write_text(head + DEFS + PAPER + BODY + "\n</svg>\n", encoding="utf-8")
(OUTDIR / "breaking-bytes-logo-transparent.svg").write_text(head + DEFS + BODY + "\n</svg>\n", encoding="utf-8")
print("ok", f"eaking {ew:.0f} ytes {yw:.0f} tag {tw:.0f}")
