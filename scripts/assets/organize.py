"""Copies the raw ChatGPT batch into assets-src/<scene>/ with canonical names, then reports layer alignment."""
import glob, os, shutil, sys
import numpy as np
from PIL import Image

SRC = "Breaking-Bytes-All-Images"
gen = {int(os.path.basename(p)[:2]): p for p in glob.glob(f"{SRC}/generated/*.png")}
gen[0] = f"{SRC}/00-original-master.png"

# index -> (scene folder, name, master index for alignment check or None)
MAP = {
 0:("s1-desert","S1-master",None), 1:("s1-desert","S1-L1-sky",0), 2:("s1-desert","S1-L2-ground",0),
 3:("s1-desert","S1-L3-rv",0), 4:("s1-desert","S1-L4-fg",0), 5:("s1-desert","S1-V1-rv-cutaway",0),
 6:("s1-desert","S1-V1-L3-rv-cutaway",5), 7:("s1-desert","S1-mobile-master",None),
 8:("s2-superlab","S2-master",None), 9:("s2-superlab","S2-L1-back",8), 10:("s2-superlab","S2-L2-fg",8),
 11:("s2-superlab","S2-transition-strata",None),
 12:("s3-classroom","S3-master",None), 13:("s3-classroom","S3-L1-room",12), 14:("s3-classroom","S3-L2-teacher",12),
 15:("s3-classroom","S3-L3-desks",12),
 16:("s4-money","S4-master",None), 17:("s4-money","S4-L1-room",16), 18:("s4-money","S4-L2-cash",16),
 19:("s4-money","S4-L3-barrels",16), 20:("s4-money","S4-L4-bulb",16),
 21:("s5-carwash","S5-master",None), 22:("s5-carwash","S5-L1-back",21), 23:("s5-carwash","S5-L2-brushes",21),
 24:("s5-carwash","S5-car",None),
 25:("s6-pollos","S6-master",None), 26:("s6-pollos","S6-L1-room",25), 27:("s6-pollos","S6-L2-gus",25),
 28:("s6-pollos","S6-L3-counter",25),
 29:("s7-saul","S7-master",None), 30:("s7-saul","S7-REJECT-duplicate",29), 31:("s7-saul","S7-L1-room",29),
 32:("s7-saul","S7-L2-desk",29), 33:("s7-saul","S7-L3-tv",29),
 34:("s8-night","S8-master",None), 35:("s8-night","S8-master-alt",34), 36:("s8-night","S8-L1-sky",34),
 37:("s8-night","S8-L2-ground-with-mesas",34), 38:("s8-night","S8-L2-ground",34), 39:("s8-night","S8-L3-rv",34),
 40:("s8-night","S8-L4-fg",34),
 **{41+i:("extras",f"X-avatar-{i+1}",None) for i in range(6)},
 47:("extras","X-og",None), 48:("extras","X-404",None), 49:("extras","X-dashboard-bg",None),
}

def load(p): return np.asarray(Image.open(p).convert("RGB")).astype(np.int16)

def is_magenta(a): return (a[...,0]>200)&(a[...,1]<70)&(a[...,2]>200)

for i,(scene,name,m) in sorted(MAP.items()):
    os.makedirs(f"assets-src/{scene}", exist_ok=True)
    shutil.copy2(gen[i], f"assets-src/{scene}/{name}.png")
    if m is None: continue
    a, b = load(gen[i]), load(gen[m])
    h, w = min(a.shape[0],b.shape[0]), min(a.shape[1],b.shape[1])
    a, b = a[:h,:w], b[:h,:w]
    keep = ~is_magenta(a)
    # best integer shift within +-12px of the kept region vs master
    best=(1e9,0,0)
    ys,xs=np.where(keep)
    if len(ys)==0: continue
    sel=np.random.default_rng(0).choice(len(ys),min(40000,len(ys)),replace=False); ys,xs=ys[sel],xs[sel]
    for dy in range(-12,13,2):
        for dx in range(-12,13,2):
            y2,x2=np.clip(ys+dy,0,h-1),np.clip(xs+dx,0,w-1)
            d=np.abs(a[ys,xs]-b[y2,x2]).mean()
            if d<best[0]: best=(d,dx,dy)
    d0=np.abs(a[ys,xs]-b[ys,xs]).mean()
    print(f"{i:02d} {name:28s} cover={keep.mean()*100:5.1f}%  diff@0={d0:5.1f}  best={best[0]:5.1f} at dx={best[1]:+d},dy={best[2]:+d}")
