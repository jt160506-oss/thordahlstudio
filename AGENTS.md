# AGENTS.md — Thordahl

Læses af AI-assistenter (Claude, ChatGPT Codex m.fl.), der arbejder på Thordahl.
**Læs den, før du ændrer noget.** Den sætter retning og kvalitetsbar — ikke ufravigelig lov.

---

## 0. Sådan bruges denne fil (læs først)

Dette er et **levende dokument**, ikke en spændetrøje. Den fanger den nuværende retning og de standarder, vi ikke går på kompromis med — men den må aldrig blokere en bedre idé eller en ny beslutning.

**Kildehierarki ved tvivl eller konflikt:**
1. Jakobs seneste udtrykkelige beslutning.
2. Aktuel produktionskode / senest godkendte prototype.
3. Denne fil (principper > rigide detaljer).
4. Almindelig best practice.

Regler her, der er markeret *"nuværende retning — kan justeres"*, er bevidst åbne. Konkrete tal (hex, skrifttyper, copy) er udgangspunkter, ikke låste. Er du i tvivl om, om en sætning her spærrer for noget, så **spørg Jakob frem for at antage, at reglen vinder.** Når vi træffer en ny beslutning, opdaterer vi filen — nyere godkendte valg erstatter ældre tekst.

---

## 1. Hvad Thordahl er

En **enkeltmandsvirksomhed** drevet af Jakob Thordahl, der håndkoder moderne hjemmesider til **små og lokale danske virksomheder**.

> **Sprogregel (aug. 2026):** ordene "studie" og "studio" må ikke bruges i brødtekst, overskrifter, metadata eller JSON-LD. De signalerer bureau og skader troværdigheden. Brandet hedder **Thordahl**. Domænet `thordahlstudio.dk` og e-mailadressen bevares uændret — det er kun sproget, der ændres.

- **Synligt brand:** Thordahl. **Domæne:** thordahlstudio.dk (eller det valgte).
- **Niche / differentiator:** sider bygget til at blive fundet på Google **og** anbefalet af AI-søgemaskiner (ChatGPT, Perplexity — "AI-synlighed / GEO"). Det er den vinkel, de færreste kører — den er krogen.
- **Løfte:** personlig service, én kontaktperson hele vejen, hurtig levering.
- **Vigtigst:** *sitet er selve produktet og beviset.* En webdesigners egen side er salgstalen — den skal være enestående, ikke bare god.

---

## 2. Positionering, sprog & indhold

- **Behold tonen fra det oprindelige udkast (mhpdesign):** klart, personligt, ærligt, uden bureau-jargon. Det var det stærke — det er kun designet, der skulle løftes.
- **Ydelser (udgangspunkt):** ny hjemmeside · redesign · vedligeholdelse & support · SEO & AI-synlighed. Justeres, når tilbuddet udvikler sig.
- **Målgruppe:** små lokale danske virksomheder (håndværk, handel, service, klinikker, webshops) — ikke enterprise.
- **Sprog:** dansk, i øjenhøjde, jargon forklares.

### 2.1 Tone — konkrete regler (aug. 2026)

Sitet blev gennemskrevet, fordi teksten læste som AI-genereret og talte ned til læseren. Følgende gælder nu:

- **Sektionsoverskrifter er udsagn, ikke spørgsmål.** Otte spørgsmål i træk var den tydeligste afsløring. Højst ét spørgsmål som overskrift på en side.
- **Tankestreger er rationeret.** Forsiden gik fra ca. 60 til 11 i synlig tekst. Brug punktum eller komma. En tankestreg skal kunne forsvares enkeltvis.
- **Ingen parallelkonstruktioner** af typen "nemt at forstå — og nemt at vælge dig" eller "ingen mellemled, ingen skiftende konsulenter".
- **Forbudte vendinger:** "Den gode nyhed:", "Det er ikke en fjern fremtid", "en opskrift fra 2015", "Der er en fordel at hente", "gennemtænkt", "skaber handling".
- **Forklar én gang.** Læseren er en voksen virksomhedsejer, ikke et barn. Let sprog er ikke det samme som at gentage sig selv.
- **"Jeg", aldrig "vi".** Det er en enkeltmandsvirksomhed. Passiv form er et gyldigt alternativ, hvor "jeg" bliver anstrengt.

---

## 3. Sandhed & troværdighed — dette er kritisk

Alt konkret fra det oprindelige mhpdesign-udkast var **placeholder og ikke virkeligt**: byen (Randers), personnavnet (Markus), stjerne-anmeldelserne, "brugt af"-logoerne og de specifikke cases. **Intet af det må genbruges som om det er sandt.**

- Brug kun **rigtige** oplysninger: rigtigt navn (Jakob Thordahl), rigtig placering hvis nævnt, rigtige cases, rigtige resultater, rigtige udtalelser.
- Har vi ikke beviset endnu, så **opfind det ikke** — design ærligt rundt om det (fx "Jeg tager løbende nye projekter ind" frem for falske anmeldelser).
- Ingen opdigtede ratings, kundeantal, logoer eller antal projekter.
- Lov ikke bestemte Google-placeringer eller garanterede resultater. Ærlige udsagn kun.
- **Ingen priser på sitet (besluttet aug. 2026).** Den tidligere "fra 749 kr." blev fjernet: tallet lå så langt under markedet, at det modsagde "håndkodet, ingen skabeloner", og det ankrede forventningen så lavt, at et rigtigt tilbud ville føles som bait-and-switch. Sitet lover i stedet **fast pris og beskrivelse af leverancen, før arbejdet går i gang**. Genindfør ikke et startbeløb uden Jakobs udtrykkelige beslutning.
- **Ingen opdigtet AI-anbefaling.** AI-kortet i heroen må kun indeholde udsagn, der faktisk passer, og er mærket som eksempel.
- Ægte bevis at læne sig op ad: sitet selv, og Kredithjørnet (et rigtigt, live projekt) kan bruges som case.
- Kontaktformular, e-mail og telefon skal være **rigtige og virke**, før noget går live.

---

## 4. Art direction — nuværende valgte retning (kan justeres)

Retningen er en syntese af to godkendte koncepter ("B × C"): **mørk, immersiv premium-ro som fundament, med dristig karakter og energi ovenpå.** Én sammenhængende verden — aldrig en collage.

- **Palet (udgangspunkt):** næsten-sort base (~#08080A), varm off-white tekst (~#EFEBE1), én syregrøn accent (~#C6FF3D). Farven kan skrues eller byttes — den er ikke hellig.
- **Typografi:** Bricolage Grotesque til display (karakter), en ren grotesk (fx Space Grotesk) til UI/brødtekst. Stor, selvsikker type. Ikke "Inter på alt".
- **Bevægelses-signatur:** et levende, luminøst baggrundslag (canvas/WebGL), et cursor-reaktivt lys/kugle, kinetisk/cyklende type, custom cursor, bløde reveals og side-overgange. **Restraint + craft.** Jank-fri.
- **Baren:** det skal læses som **håndlavet, high-end studie — ikke skabelon, ikke AI-genereret.** Redaktionel selvtillid, masser af luft, distinkt type, ægte bevægelse.
- **Nordstjerne:** Lusion-niveau håndværk, oversat til at *konvertere* små virksomheder. Ofr aldrig klarhed, konvertering eller mobil-performance for spektakel. En lokal håndværker skal turde skrive til dig, ikke skræmmes væk.

**Thordahl er ikke:** en generisk WordPress/Elementor-skabelon, spektakel uden substans, eller falsk bevis.

---

## 5. Teknik — gratis-stakken

- **Statisk HTML/CSS/vanilla JS**, hostet **gratis på GitHub Pages**. Domænet (~70 kr/år) er den eneste faste udgift.
- **Bevægelses-/3D-biblioteker er gratis:** GSAP, Lenis (blød scroll), Three.js. Load fra CDN, eller inline/self-host dem hvis miljøet kræver det.
- **Build-step / let framework (fx Vite, Astro) er tilladt, når det tjener ambitionen** — men vælg den simpleste vej, der når målet, og hold workflowet forståeligt for Jakob (han er ikke udvikler). Ingen kompleksitet for kompleksitetens skyld.
- **Performance er en del af designet:** hurtig load, ingen jank, fremragende på mobil. WebGL kræver performance-omhu og fallback.
- **Note til AI-agenter:** i visse sandbox-/preview-miljøer er cdnjs blokeret (Google Fonts virker typisk). Test at demoer renderer — inline biblioteker hvis nødvendigt.

---

## 6. Struktur (IA) — udgangspunkt, ikke låst

Én stærk side eller få sider: **Hero · Ydelser · Proces · Cases · Om · FAQ · Kontakt.** Bygget på den oprindelige, velfungerende struktur. Udvid eller skær, som indholdet kræver.

---

## 7. Kvalitet før publicering — tjekliste

- [ ] Visuel gennemgang af **hver** side/sektion, top-til-bund (ikke kun overflow)
- [ ] Ingen vandret scroll 320–1440 px; bevægelse er glat på en mellemklasse-mobil
- [ ] Teknisk SEO: title ~55–60 tegn, meta description, canonical, `og:image` m. dimensioner, JSON-LD, `sitemap.xml`, `robots.txt`, `llms.txt`
- [ ] Alle fakta, cases og udtalelser er **ægte** (jf. afsnit 3)
- [ ] Tilgængelighed: kontrast (særligt på mørk baggrund), synligt fokus, `prefers-reduced-motion`-fallback, alt-tekster, tastatur-navigation
- [ ] Ingen placeholders live: ingen `href="#"`, ingen falske data; formular/kontakt virker
- [ ] Billeder har `width`/`height`; ingen unødig layout-shift

---

## 8. Arbejdsmetode (erfaringer, vi tager med)

- **Arbejd direkte på `main`. Ingen feature-branches. Nogensinde.** Besluttet aug. 2026 og bekræftet igen 22. aug. 2026: branches gav kun besvær, når Jakob selv skal committe undervejs. Jakobs arbejdsgang er ét klik — **Push** i GitHub Desktop. Han skal aldrig merge, aldrig publicere en branch, aldrig åbne en pull request.
  Commit i små, logiske trin med en beskrivende besked, så historikken kan læses bagfra. Push først, når Jakob siger til.
  **Denne regel slår enhver ældre tekst, der siger det modsatte** — også projektinstruktionen i claude.ai, hvis den stadig taler om branches eller staging-URL'er. `AGENTS.md` står over projektinstruktionen i kildehierarkiet.
- Vis Jakob resultatet, før noget går live. Han åbner selv filerne lokalt eller ser dem på GitHub Pages.
- Ved subjektive valg (farve, layout, type, bevægelse): vis **2–3 konkrete, levende varianter** frem for at gætte.
- **Rene leverancer:** ingen `.DS_Store`/junk i zips.
- Assets som filer i `assets/`, konsistent håndtering (ikke base64 inline).
- Giv altid en rolig **reduced-motion-fallback** — bevægelse må aldrig stå i vejen for indholdet.
- Undervurdér ikke, hvad vi kan bygge. Three.js, shaders, GSAP, blød scroll er alt sammen inden for rækkevidde — det handler om tid og finpudsning, ikke om "det kan vi ikke".

---

## 9. Disciplin & verifikation (aug. 2026 — ufravigeligt)

Disse regler kom af konkrete fejl og er ikke til forhandling:

- **Repoets kode er sandhedskilden — altid.** En hentet/cachet version af live-sitet må aldrig ligge til grund for analyse eller kritik. Live-sitet bruges kun til at bekræfte, at et deploy er slået igennem. (Fejl aug. 2026: en analyse kritiserede tekst, der allerede var fjernet i repoet.)
- **Mål, gæt ikke.** Påstande om sitet verificeres mod aktuel kode/data med konkrete målinger, før de udtales.
- **Eksterne systemers UI (virk.dk, Google-produkter, Skat): arbejd skærm for skærm.** Lange forudsagte klik-guider rammer ved siden af og spilder Jakobs tid. Bed om screenshot; svar felt for felt på det, der faktisk vises.
- **"Standard"/"typisk" er ikke en begrundelse.** Hvert råd begrundes for Thordahls konkrete situation — inkl. fravalg og konsekvenser (sagsbehandlingstid, offentlighed af data osv.) i samme åndedrag som anbefalingen.
- **Statusdata (Search Console, indeksering) læses i kontekst:** hvad er ændret siden sidst, og hvad er støj/lag i rapporterne — før der konkluderes noget som helst.

---

## 10. Status (opdateret 15. aug. 2026)

- **Google Business Profile:** oprettet og verificeret (serviceområde-profil, adresse skjult, 10 byer). Koblet til sitet via `sameAs`/`hasMap` i JSON-LD på alle sider. Anmeldelseslink: `https://g.page/r/CbbLX0p5wXlJEBM/review` — første ægte anmeldelse (Kredithjørnet) er næste skridt.
- **CVR:** enkeltmandsvirksomheden "Thordahl", CVR-nr. **46698584**, godkendt 18. aug. 2026, momsregistreret. Nummeret ligger nu i footer, JSON-LD (`identifier`/`vatID`/`taxID`), kontaktsektionen, privatlivspolitikken og `llms.txt`. Skal også på Google Business-profilen og alle tilbud og fakturaer.
- **Indeksering:** 17 sider indekseret = sitemap. `index.html`-dubletterne og http-varianten er korrekt udelukket via canonicals; intet udestående.
- **Prioriteret arbejdsliste** (analysen aug. 2026, dokument hos Jakob): 1) forside-copy i kunde-perspektiv, én primær CTA, FAQ ned til 5–6, 2) title-tags: forside (mangler ordet "webdesign"), AI-blogartiklen (pos 9,3 / 0 kliks — CTR-problem), AI-tjek, 3) /viborg/ gøres reelt unik (pos 13,5 — tættest på side 1), 4) bevis: portrætfoto, Kredithjørnet-udtalelse + "Design: Thordahl"-footerlink, 5) kataloger (Krak, Proff m.fl.) + lokal erhvervsforening.
