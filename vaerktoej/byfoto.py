# -*- coding: utf-8 -*-
"""Byfoto -> beskaaret baand i naturlige farver, kun dæmpet saa det passer
til den moerke side. Ingen farvelaegning."""
import sys
from PIL import Image, ImageOps, ImageEnhance
BAND = (1600, 533)   # 3:1

def lav(src, ud_stem, bredder=(1600, 800)):
    im = Image.open(src).convert("RGB")
    im = ImageOps.fit(im, BAND, method=Image.LANCZOS, centering=(0.5, 0.42))
    im = ImageEnhance.Color(im).enhance(0.82)        # en anelse mindre maettet
    im = ImageEnhance.Brightness(im).enhance(0.80)   # dæmpet, ikke moerklagt
    im = ImageEnhance.Contrast(im).enhance(1.05)
    for w in bredder:
        h = round(w * BAND[1] / BAND[0])
        im.resize((w, h), Image.LANCZOS).save(f"{ud_stem}-{w}.webp", "WEBP", quality=80, method=6)

if __name__ == "__main__":
    lav(sys.argv[1], sys.argv[2])
