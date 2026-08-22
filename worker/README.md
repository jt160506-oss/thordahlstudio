# thordahl-ai-tjek — scoringsmotoren bag AI-tjekket

Denne mappe er en **sikkerhedskopi og dokumentation** af den Cloudflare Worker,
der driver https://thordahlstudio.dk/ai-tjek/.

## Hvor koden bor

| | |
|---|---|
| Worker | `thordahl-ai-tjek` |
| Endpoint | `https://thordahl-ai-tjek.thordahl.workers.dev/scan` |
| Cloudflare-konto | jt160506@icloud.com |
| Sidst deployet | 20. juli 2026 (version `4c818e1e`) |

`dist/index.js` er **bygget output**, hentet ud af Cloudflare-dashboardet
22. august 2026. Den oprindelige TypeScript-kildekode (se modullisten
nedenfor) findes hverken i dette repo eller på Jakobs maskine. Filen her er
derfor indtil videre den eneste kopi af motoren uden for Cloudflare.

## Moduler i bundtet

```
src/index.ts              router og orkestrering
src/fetchPage.ts          henter siden
src/parse.ts              HTML-parsing, detectPlatform, mainText, countWords
src/score.ts              buildCategory, verdictFor, totalScoreFor
src/types.ts
src/checks/aiReadability.ts    A1-A6
src/checks/googleFoundation.ts B1-B9
src/checks/speed.ts            C1-C5
src/checks/aiCitability.ts     D1-D5
```

## Bindings

| Navn | Type | Rolle |
|---|---|---|
| `SCAN_CACHE` | KV | cache af scanninger |
| `RATE_LIMIT` | KV | begrænsning pr. besøgende |
| `PSI_API_KEY` | secret | nøgle til PageSpeed Insights |
| `ALLOWED_ORIGIN` | var | CORS |
| `ENV` | var | miljø |

Der ligger **ingen hemmeligheder i koden** — nøglen hentes fra `env`.
Filen kan derfor trygt committes.

## Scoringen

```
Kategorimaks:  A 30 · B 25 · C 25 · D 20   (i alt 100)
Samlet score:  optjente point / målbare maksimumpoint, skaleret til 0-100
               (punkter med status "error" tælles hverken op eller ned)
Domme:         >= 85 strong · >= 60 gaps · >= 35 vulnerable · derunder invisible
```

## Kendte begrænsninger, august 2026

1. **Kun forsiden.** Der crawles én URL. Undersider vurderes aldrig.
2. **Kun performance fra PageSpeed.** Kaldet i `dist/index.js` linje 1071 er
   `...&category=performance&key=...`. PageSpeed-API'et returnerer også
   `accessibility`, `best-practices` og `seo` i samme kald uden ekstra kvote.
   Tre fjerdedele af svaret smides væk i dag.
3. **Ingen virksomhedssignaler.** Google Business-profil, anmeldelser,
   åbningstider og NAP-konsistens indgår ikke, selvom det for en lokal
   virksomhed vejer tungere end selve hjemmesiden.
4. **Ingen konverteringsvurdering.** Der måles om maskiner kan læse siden,
   ikke om et menneske kan finde telefonnummeret.
5. **Ingen sammenligning.** En score på 62 står alene. `SCAN_CACHE` gemmer
   allerede scanninger — grundlaget for et branche- og bybenchmark findes
   altså i forvejen og bruges bare ikke.
6. **llms.txt (A4) vægter i scoren.** Dokumentationen på sitet siger nu selv,
   at punktet reelt ikke betyder noget. Vægten bør fjernes her.

## Før der deployes igen

Motoren kører i produktion. Enhver ændring skal testes mod en kendt URL og
sammenlignes med den nuværende score, før den går live.
