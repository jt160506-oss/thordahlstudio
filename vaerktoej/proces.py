# -*- coding: utf-8 -*-
"""Skriver faserne fra data/proces.json ind i proces/index.html.

   Indholdet bliver til rigtig HTML i filen — det hentes IKKE med fetch(),
   for saa ser Google en tom side. Koer den efter enhver aendring i JSON'en:

       python3 vaerktoej/proces.py

   Den roerer kun det, der staar mellem markoererne i HTML-filen:
       <!-- PROCES:START --> ... <!-- PROCES:END -->
       <!-- HOWTO:START --> ... <!-- HOWTO:END -->
"""
import io, json, re, sys, html

KILDE = "data/proces.json"
SIDE  = "proces/index.html"

def esc(s):
    return html.escape(str(s), quote=False)

def maerker(f):
    """Smaa etiketter: valgfri, pakke, branche."""
    ud = []
    if f.get("valgfri"):
        ud.append('<span class="pr-tag valgfri">Kun hvis du har brug for det</span>')
    if f.get("pakke") == ["komplet"]:
        ud.append('<span class="pr-tag">Følger med Komplet</span>')
    if f.get("branche"):
        ud.append('<span class="pr-tag">Fx %s</span>' % esc(", ".join(f["branche"])))
    return ('<div class="pr-tags">%s</div>' % "".join(ud)) if ud else ""

def system(s):
    raekker = []
    for naavn, vaerdi in (("Hvorfor", s.get("hvorfor")),
                          ("Pris", s.get("pris")),
                          ("I stedet for", s.get("alternativer"))):
        if vaerdi:
            raekker.append("<dt>%s</dt><dd>%s</dd>" % (naavn, esc(vaerdi)))
    return (
        '<article class="pr-sys">'
        '<h4>%s</h4>'
        '<p class="pr-sys-hvad">%s</p>'
        '<dl>%s</dl>'
        '</article>'
    ) % (esc(s["navn"]), esc(s.get("hvad_det_er", "")), "".join(raekker))

def fase(f, sidst):
    sys_html = ""
    if f.get("systemer"):
        sys_html = (
            '<h5 class="pr-sys-h">Det bruger jeg her</h5>'
            '<div class="pr-sys-grid">%s</div>'
        ) % "".join(system(s) for s in f["systemer"])

    brug = ""
    if f.get("jeg_skal_bruge"):
        brug = '<p class="pr-brug"><b>Jeg skal bruge fra dig:</b> %s</p>' % esc(f["jeg_skal_bruge"])

    mere = (
        '<details class="pr-mere">'
        '<summary>Hvad der helt præcis sker</summary>'
        '<div class="pr-in"><p>%s</p>%s%s</div>'
        '</details>'
    ) % (esc(f.get("hvad_der_sker", "")), brug, sys_html)

    return (
        '<li class="pr-node reveal%s" id="trin-%s">'
        '<span class="pr-dot" aria-hidden="true"></span>'
        '<div class="pr-card">'
        '<div class="pr-top"><span class="pr-nr">%s</span>'
        '<h3>%s</h3><span class="pr-tid">%s</span></div>'
        '%s'
        '<p class="pr-lead">%s</p>'
        '<p class="pr-dig"><b>Du skal:</b> %s</p>'
        '%s'
        '</div></li>'
    ) % (" sidst" if sidst else "", esc(f["id"]), esc(f["nr"]), esc(f["navn"]),
         esc(f.get("tid", "")), maerker(f), esc(f.get("lead", "")),
         esc(f.get("dig", "")), mere)

def howto(faser):
    return json.dumps({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "Sådan foregår det at få lavet en hjemmeside hos Thordahl",
        "description": "Hele forløbet fra første besked til at du selv vedligeholder "
                       "siden, med de systemer der bruges undervejs.",
        "inLanguage": "da-DK",
        "totalTime": "P21D",
        "step": [
            {"@type": "HowToStep", "position": i + 1, "name": f["navn"],
             "text": f.get("hvad_der_sker") or f.get("lead", ""),
             "url": "https://thordahlstudio.dk/proces/#trin-" + f["id"]}
            for i, f in enumerate(faser)
        ]
    }, ensure_ascii=False, indent=2)

def saet_ind(s, navn, nyt):
    m = re.search(r"(<!-- %s:START -->)(.*?)(<!-- %s:END -->)" % (navn, navn), s, re.S)
    if not m:
        print("  ! markoeren %s mangler i %s" % (navn, SIDE)); sys.exit(1)
    if m.group(2).strip() == nyt.strip():
        return s, False
    return s[:m.end(1)] + "\n" + nyt + "\n" + s[m.start(3):], True

def main():
    d = json.load(io.open(KILDE, encoding="utf-8"))
    faser = d["faser"]
    s = io.open(SIDE, encoding="utf-8").read()

    trin = "\n".join(fase(f, i == len(faser) - 1) for i, f in enumerate(faser))
    s, a = saet_ind(s, "PROCES", '<ol class="pr-line">\n%s\n</ol>' % trin)
    s, b = saet_ind(s, "HOWTO", '<script type="application/ld+json">\n%s\n</script>' % howto(faser))

    if a or b:
        io.open(SIDE, "w", encoding="utf-8").write(s)
        print("  %s opdateret · %d faser, %d systemer"
              % (SIDE, len(faser), sum(len(f.get("systemer", [])) for f in faser)))
    else:
        print("  ingen aendringer")

if __name__ == "__main__":
    main()
