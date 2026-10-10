# -*- coding: utf-8 -*-
"""Saetter <lastmod> i sitemap.xml til hver sides faktiske sidste aendring,
   hentet fra git. Koer den efter enhver aendring, foer du pusher.
   Brug: python3 vaerktoej/sitemapdato.py"""
import io, re, subprocess, sys

sm = io.open("sitemap.xml", encoding="utf-8").read()

def fil_for(url):
    sti = url.replace("https://thordahlstudio.dk/", "").rstrip("/")
    return (sti + "/index.html") if sti else "index.html"

def sidst_aendret(f):
    r = subprocess.run(["git", "log", "-1", "--format=%ad", "--date=short", "--", f],
                       capture_output=True, text=True)
    return r.stdout.strip() or None

aendret = 0
def erstat(m):
    global aendret
    blok, url = m.group(0), m.group(1)
    f = fil_for(url)
    d = sidst_aendret(f)
    if not d:
        print("  ! ingen git-historik for", f); return blok
    ny, n = re.subn(r"<lastmod>[^<]*</lastmod>", "<lastmod>%s</lastmod>" % d, blok)
    if n == 0:
        ny = blok.replace("</url>", "  <lastmod>%s</lastmod>\n  </url>" % d)
    if ny != blok:
        aendret += 1
        print("  %-52s -> %s" % (url.replace("https://thordahlstudio.dk", ""), d))
    return ny

sm = re.sub(r"<url>.*?<loc>(.*?)</loc>.*?</url>", erstat, sm, flags=re.S)
io.open("sitemap.xml", "w", encoding="utf-8").write(sm)
print("%d datoer opdateret" % aendret)
