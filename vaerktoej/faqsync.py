# -*- coding: utf-8 -*-
"""Genskriver FAQPage-JSON-LD ud fra de FAQ-blokke, der faktisk staar paa siden.
   Koer den efter enhver aendring i FAQ-teksten. Brug: python3 faqsync.py <fil>"""
import io, re, json, sys, html
p = sys.argv[1]
s = io.open(p, encoding="utf-8").read()

qa = re.findall(r'<div class="qa[^"]*">\s*<button[^>]*>(.*?)</button>\s*<div class="a">(.*?)</div>\s*</div>', s, re.S)
if not qa:
    print("ingen FAQ fundet i", p); sys.exit(1)

def ren(x):
    x = re.sub(r'<[^>]+>', '', x)
    x = html.unescape(x)
    return re.sub(r'\s+', ' ', x).strip()

data = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": ren(q),
     "acceptedAnswer": {"@type": "Answer", "text": ren(a)}}
    for q, a in qa
  ]
}
ny = json.dumps(data, ensure_ascii=False, indent=2)

blocks = list(re.finditer(r'<script type="application/ld\+json">(.*?)</script>', s, re.S))
mal = [b for b in blocks if '"FAQPage"' in b.group(1)]
if len(mal) != 1:
    print("forventede praecis 1 FAQPage-blok, fandt", len(mal)); sys.exit(1)
b = mal[0]
s = s[:b.start()] + '<script type="application/ld+json">\n' + ny + '\n</script>' + s[b.end():]
io.open(p, "w", encoding="utf-8").write(s)
print("%s: %d spoergsmaal synkroniseret" % (p, len(qa)))
