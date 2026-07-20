/* ── Thordahl AI-synlighedstjek — frontend ───────────────────────────────────
   Motoren (Cloudflare Worker) returnerer kun check-ID'er, status og måltal.
   Al brugervendt tekst står her, jf. TEKSTER.md. Ingen afhængigheder.        */
(function () {
  'use strict';

  var API = 'https://thordahl-ai-tjek.thordahl.workers.dev/scan';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ——— Tekster ————————————————————————————————————————————————— */

  var CHECKS = {
    A1: {
      t: 'Strukturerede data (JSON-LD)',
      pass: 'Din side har strukturerede data, som Google og AI kan læse direkte. Det er fundamentet for at blive vist rigtigt i søgeresultater og AI-svar.',
      warn: 'Din side har strukturerede data, men de indeholder fejl og kan ikke læses korrekt. En AI springer typisk bare over dem — så de hjælper dig ikke, som de står nu.',
      fail: 'Din side har ingen strukturerede data. Det er den mest direkte måde at fortælle Google og AI, hvem du er, hvad du laver, og hvor du holder til — uden dem skal maskinerne gætte.'
    },
    A2: {
      t: 'Virksomhedsoplysninger i de strukturerede data',
      pass: 'Dine strukturerede data fortæller tydeligt, at der er tale om en virksomhed ({types}).',
      warn: 'Dine strukturerede data beskriver kun siden teknisk — ikke din virksomhed. En AI kan se, at der findes en hjemmeside, men ikke hvem der står bag, eller hvad I tilbyder.',
      fail: 'Der mangler oplysninger om din virksomhed i maskinlæsbart format. Navn, branche og beliggenhed er præcis dét, en AI leder efter, når den skal anbefale en lokal virksomhed.'
    },
    A3: {
      t: 'Adgang for AI-robotter',
      pass: 'AI-tjenesternes robotter (ChatGPT, Claude, Perplexity m.fl.) har adgang til din side.',
      warn: 'Din side blokerer {blockedBots}. De AI-tjenester kan hverken læse eller citere din side — du er usynlig præcis dér.',
      fail: 'Din side blokerer AI-robotterne i sin robots.txt. Det betyder i praksis, at ChatGPT, Perplexity og lignende ikke må læse din side — de kan umuligt anbefale en virksomhed, de ikke kan se. Det er ofte en standardindstilling, ingen har taget stilling til.'
    },
    A4: {
      t: 'llms.txt',
      pass: 'Din side har en llms.txt — en lille fil, der giver AI-tjenester et rent overblik over dit indhold.',
      fail: 'Din side har ingen llms.txt. Det er en ny standard, som få har endnu — netop derfor er den en nem måde at komme foran på.'
    },
    A5: {
      t: 'Sidens struktur (semantisk HTML)',
      pass: 'Siden er bygget med en klar struktur, så maskiner kan skelne indhold fra menu og pynt.',
      warn: 'Sidens struktur er delvist på plads, men rodet nogle steder ({headingIssues}). Det gør det sværere for en AI at forstå, hvad der er vigtigst på siden.',
      fail: 'Siden mangler grundlæggende struktur. For en maskine ligner det én stor grød af tekst og kode — den kan ikke se, hvad der er overskrift, indhold og menu.'
    },
    A6: {
      t: 'Kan indholdet overhovedet læses?',
      pass: 'Dit indhold kan trækkes rent ud af siden ({wordCount} ord læsbar tekst). Det er dét råmateriale, en AI arbejder med.',
      warn: 'Der kan kun trækkes {wordCount} ord ud af din forside. Det er tyndt — en AI har ikke ret meget at citere dig for.',
      fail: 'Din side viser muligvis indhold til mennesker, men maskiner kan næsten intet læse ({wordCount} ord). Det sker typisk, når indholdet først dannes af scripts i browseren. For AI-søgemaskiner er siden i praksis tom.',
      /* Checket kan dumpe på to måder: for få ord, eller nok ord der drukner i
         kode. Den oprindelige tekst passer kun på det første — derfor denne. */
      failRatio: 'Din side har {wordCount} ord tekst, men de drukner i kode — kun {ratioPct} % af det, en robot henter, er læsbart indhold. Det sker typisk, når siden bygges af scripts i browseren, og en AI-crawler får meget lidt ud af besøget.'
    },
    B1: {
      t: 'Sidetitel',
      pass: 'Din sidetitel har en god længde ({length} tegn) og bliver vist i fuld længde i søgeresultater.',
      warn: 'Din sidetitel er {length} tegn — den bliver enten klippet af eller udnytter ikke pladsen i søgeresultaterne.',
      fail: 'Din sidetitel mangler eller er uden reel værdi. Titlen er den enkeltvigtigste linje for både Google og AI — det er den, der afgør, om nogen klikker.'
    },
    B2: {
      t: 'Meta-beskrivelse',
      pass: 'Din meta-beskrivelse har en god længde og giver Google en færdig tekst at vise under dit link.',
      warn: 'Din meta-beskrivelse er {length} tegn — for kort til at sælge eller for lang til at blive vist helt.',
      fail: 'Din side mangler en meta-beskrivelse. Så skriver Google selv én for dig — og den bliver sjældent så god, som den du selv kunne have valgt.'
    },
    B3: {
      t: 'Canonical-adresse',
      pass: 'Din side fortæller entydigt, hvilken adresse der er den rigtige. Det samler din synlighed ét sted.',
      warn: 'Din canonical peger på en anden adresse end den, vi scannede. Det kan splitte eller fejllede din synlighed — det bør tjekkes.',
      fail: 'Din side mangler en canonical-adresse. Findes din side på flere adresser (med/uden www, med/uden skråstreg), risikerer du at konkurrere med dig selv i Google.'
    },
    B4: {
      t: 'Overskriftsstruktur (H1)',
      pass: 'Siden har præcis én hovedoverskrift — som den skal.',
      warn: 'Siden har {count} hovedoverskrifter. Maskiner foretrækker én tydelig hovedoverskrift, der siger, hvad siden handler om.',
      fail: 'Siden har {count} hovedoverskrifter. Uden en klar H1 ved hverken Google eller en AI, hvad sidens vigtigste budskab er.'
    },
    B5: {
      t: 'Sprogangivelse',
      pass: 'Siden fortæller korrekt, at den er på dansk. Det hjælper søgemaskiner med at vise den til de rigtige.',
      warn: 'Siden angiver et andet sprog end dansk. Det kan forvirre søgemaskiner om, hvem siden er til.',
      fail: 'Siden angiver ikke sit sprog. En lille teknisk detalje — men en nem gevinst.'
    },
    B6: {
      t: 'Delingsvisning (Open Graph)',
      pass: 'Din side har titel, beskrivelse og billede klar til, når den deles på sociale medier og i beskeder.',
      warn: 'Din delingsvisning mangler {missing}. Deles dit link, ser det halvfærdigt ud — og halvfærdigt bliver sjældent klikket på.',
      fail: 'Din side har ingen delingsoplysninger. Deler nogen dit link på Facebook eller LinkedIn, vises det uden billede og ordentlig tekst.'
    },
    B7: {
      t: 'Mobilvisning',
      pass: 'Siden er sat op til at blive vist korrekt på mobil.',
      fail: 'Siden mangler den grundindstilling, der får den til at virke på mobil. Over halvdelen af dine besøgende kommer fra en telefon — og Google bedømmer din side ud fra mobilversionen.'
    },
    B8: {
      t: 'Sitemap',
      pass: 'Din side har et sitemap, så søgemaskiner nemt finder alle dine sider.',
      fail: 'Din side har intet sitemap. Søgemaskiner kan stadig finde rundt, men du gør det unødigt svært for dem — og risikerer, at undersider bliver overset.'
    },
    B9: {
      t: 'Sikker forbindelse (HTTPS)',
      pass: 'Din side kører sikkert på https, og den usikre adresse sendes korrekt videre.',
      warn: 'Din side kører på https, men den gamle http-adresse sendes ikke videre. Nogle besøgende og maskiner kan lande på den usikre udgave.',
      fail: 'Din side har problemer med sikker forbindelse. Browsere advarer mod usikre sider, og både Google og besøgende straffer det hårdt.'
    },
    B10: {
      t: 'Favicon',
      pass: 'Din side har et ikon, der vises i faner og søgeresultater.',
      fail: 'Din side mangler et ikon. En detalje — men i Googles mobilresultater vises dit ikon ved siden af dit navn, og et manglende ikon ser ufærdigt ud.'
    },
    B11: {
      t: 'robots.txt',
      pass: 'Din side har en robots.txt, der guider søgemaskinernes robotter.',
      fail: 'Din side har ingen robots.txt. Det er ikke kritisk, men den hører til et komplet teknisk fundament.'
    },
    C1: {
      t: 'Samlet hastighed på mobil',
      pass: 'Din side scorer {score}/100 i Googles hastighedsmåling på mobil. Det er niveauet, hvor hastighed arbejder for dig.',
      warn: 'Din side scorer {score}/100 på mobil. Det er midterfeltet — hverken en straf eller en fordel, men hurtigere konkurrenter vinder på det.',
      fail: 'Din side scorer {score}/100 på mobil. Langsomme sider taber besøgende, før indholdet overhovedet vises — og hastighed indgår direkte i Googles rangering.'
    },
    C2: {
      t: 'Indlæsning af hovedindhold (LCP)',
      pass: 'Dit hovedindhold vises på {lcpMs} ms — inden for Googles anbefaling.',
      warn: 'Dit hovedindhold er {lcpMs} ms om at blive vist. Googles grænse for "god" er 2,5 sekunder — du er i gult felt.',
      fail: 'Dit hovedindhold er {lcpMs} ms om at blive vist. Mange besøgende er væk igen, før de har set noget som helst.'
    },
    C3: {
      t: 'Stabilitet under indlæsning (CLS)',
      pass: 'Din side ligger stabilt, mens den indlæses — intet hopper rundt.',
      warn: 'Elementer flytter sig en smule, mens siden indlæses. Det irriterer og koster fejlklik på mobil.',
      fail: 'Din side hopper mærkbart rundt under indlæsning. Det er en af de mest irriterende oplevelser på mobil — og Google måler det.'
    },
    C4: {
      t: 'Svartid ved brug (interaktivitet)',
      pass: 'Siden reagerer hurtigt, når man trykker og skriver ({ms} ms).',
      warn: 'Siden er lidt træg at bruge ({ms} ms). Mærkbart på ældre telefoner.',
      fail: 'Siden reagerer langsomt på tryk ({ms} ms). Det føles som om, siden "hænger" — og det koster handlinger.'
    },
    C5: {
      t: 'Sidevægt',
      pass: 'Din forside vejer {mb} MB — let nok til hurtig indlæsning, også på mobilnetværk.',
      warn: 'Din forside vejer {mb} MB. Det kan mærkes på mobildata og langsomme forbindelser.',
      fail: 'Din forside vejer {mb} MB. Det er tungt — typisk store billeder eller unødvendige scripts, der bremser alt andet.'
    },
    D1: {
      t: 'Spørgsmål og svar',
      pass: 'Din side svarer på konkrete spørgsmål — præcis det format, AI-søgemaskiner citerer fra.',
      warn: 'Din side har enkelte spørgsmål-svar, men ikke nok til at blive et oplagt citat. En AI leder efter sider, der svarer direkte på det, folk spørger om.',
      fail: 'Din side stiller og besvarer ingen spørgsmål. Når nogen spørger en AI "hvem kan hjælpe med …", citerer den sider, der allerede har formuleret svaret. Din side stiller ikke op til det.'
    },
    D2: {
      t: 'Kontaktoplysninger',
      pass: 'Telefonnummer og beliggenhed fremgår tydeligt. En AI kan se, hvem du er, og hvor du er — afgørende for lokale anbefalinger.',
      warn: 'Kun {phone_or_address} fremgår tydeligt. For lokale søgninger vejer både telefonnummer og by tungt — en AI anbefaler nødigt en virksomhed, den ikke kan stedfæste.',
      fail: 'Hverken telefonnummer eller beliggenhed kan findes entydigt på forsiden. For en lokal virksomhed er det alvorligt: "nær mig"-søgninger og AI-anbefalinger bygger netop på de oplysninger.'
    },
    D3: {
      t: 'Citérbar tekst',
      pass: 'Din tekst er delt op i korte, klare bidder — nemme for en AI at løfte ud og citere.',
      warn: 'Din tekst kan citeres, men mangler lister og punktopstillinger, som både mennesker og maskiner elsker at trække ud.',
      fail: 'Din tekst står som lange massive blokke. En AI citerer korte, præcise afsnit — tekstmure bliver sprunget over.'
    },
    D4: {
      t: 'Billedbeskrivelser (alt-tekster)',
      pass: '{pct} % af dine billeder har beskrivelser. Godt for både tilgængelighed og maskinforståelse.',
      warn: 'Kun {pct} % af dine billeder har beskrivelser. Maskiner kan ikke se billeder — kun læse deres beskrivelser.',
      fail: 'De fleste af dine billeder ({pct} % har beskrivelse) er usynlige for maskiner. Det koster både på tilgængelighed og forståelse af, hvad din side handler om.'
    },
    D5: {
      t: 'Entydigt virksomhedsnavn',
      pass: 'Dit virksomhedsnavn optræder konsistent på tværs af siden. Maskiner er ikke i tvivl om, hvem afsenderen er.',
      warn: 'Dit virksomhedsnavn bruges ikke konsistent overalt. Små uoverensstemmelser gør det sværere at koble siden til din virksomhed.',
      fail: 'Det kan ikke fastslås entydigt, hvad virksomheden bag siden hedder. Hvis en maskine er i tvivl om afsenderen, anbefaler den en anden.'
    }
  };

  var ERROR_TEXT = 'Dette punkt kunne ikke måles i denne scanning og tæller ikke med i din score.';

  var ERRORS = {
    INVALID_URL: 'Det ligner ikke en hjemmesideadresse. Prøv formatet dinvirksomhed.dk.',
    PRIVATE_TARGET: 'Den adresse kan ikke scannes. Indtast en offentlig hjemmesideadresse, fx dinvirksomhed.dk.',
    UNREACHABLE: 'Vi kunne ikke få fat i siden. Tjek, at adressen er stavet rigtigt, og at siden er online.',
    TIMEOUT: 'Siden svarede for langsomt til, at vi kunne analysere den. Det er i sig selv et vink om hastighedsproblemer — prøv igen om lidt.',
    NOT_HTML: 'Adressen svarer, men ikke med en almindelig hjemmeside. Prøv sidens forside i stedet.',
    BLOCKED: 'Siden blokerer automatiske besøg, så vi kan ikke analysere den udefra. Bemærk: det kan også ramme AI-søgemaskiner, der prøver at læse siden.',
    RATE_LIMITED: 'Du har brugt dagens scanninger fra denne forbindelse. Prøv igen i morgen — eller skriv til os, hvis du vil have kigget på flere sider.',
    INTERNAL: 'Noget gik galt hos os — ikke hos dig. Prøv igen om et øjeblik.'
  };

  var VERDICTS = {
    strong: {
      h: 'Stærkt fundament.',
      p: 'Din side er bygget til at blive fundet — af både Google og AI. Detaljerne nedenfor viser, hvad der kan finpudses.',
      cta: 'Din side står stærkt — og de sidste detaljer er ofte dem, der gør forskellen mellem at blive fundet og at blive valgt. Jeg tager gerne et kig sammen med dig.'
    },
    gaps: {
      h: 'Godt på vej — men med huller.',
      p: 'Fundamentet er der, men der er konkrete ting, som holder din side tilbage i både Google og AI-svar.',
      cta: 'Alt på listen ovenfor er ting, jeg arbejder med til daglig. Send mig dit resultat, så vender jeg tilbage inden for 24 timer med en ærlig vurdering af, hvad der vil rykke mest — uforpligtende.'
    },
    vulnerable: {
      h: 'Sårbar.',
      p: 'Din side kan findes, men den taber terræn til konkurrenter, der er bedre forberedt — især i AI-søgning, hvor kun få kilder bliver citeret.',
      cta: 'Alt på listen ovenfor er ting, jeg arbejder med til daglig. Send mig dit resultat, så vender jeg tilbage inden for 24 timer med en ærlig vurdering af, hvad der vil rykke mest — uforpligtende.'
    },
    invisible: {
      h: 'Reelt usynlig for AI.',
      p: 'Som siden står nu, har en AI meget svært ved at læse, forstå og anbefale den. Den gode nyhed: det kan rettes, og de vigtigste ting står øverst nedenfor.',
      cta: 'Det ser voldsomt ud, men det meste er fundament, der kan lægges én gang og holde. Send mig dit resultat, så fortæller jeg ærligt, hvad der skal til — og hvad det ikke behøver at koste.'
    }
  };

  var CATEGORIES = {
    A: 'AI-læsbarhed',
    B: 'Google-fundament',
    C: 'Hastighed & mobil',
    D: 'AI-citérbarhed'
  };

  var TICKER = [
    'Henter din forside …',
    'Læser dine strukturerede data …',
    'Tjekker om AI-robotter er lukket inde eller ude …',
    'Måler hastighed på mobil — det her tager op til et halvt minut …',
    'Vurderer om en AI kan citere din side …',
    'Tjekker dit Google-fundament …',
    'Regner din samlede score ud …',
    'Næsten færdig …'
  ];

  var BADGES = { kritisk: 'Kritisk', vigtig: 'Vigtigt', forbedring: 'Forbedring' };

  var HEADING_ISSUES = {
    'no-headings': 'ingen overskrifter',
    'no-h1': 'ingen hovedoverskrift',
    'first-heading-not-h1': 'første overskrift er ikke hovedoverskriften'
  };

  var OG_NAMES = { 'og:title': 'titel', 'og:description': 'beskrivelse', 'og:image': 'billede' };

  /* ——— Hjælpere ————————————————————————————————————————————————— */

  function $(sel, root) { return (root || document).querySelector(sel); }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function daTal(n) { return String(n).replace('.', ','); }

  function liste(arr, sidsteOrd) {
    if (!arr || !arr.length) return '';
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(', ') + ' ' + (sidsteOrd || 'og') + ' ' + arr[arr.length - 1];
  }

  function headingIssueText(code) {
    if (HEADING_ISSUES[code]) return HEADING_ISSUES[code];
    var m = /^jump-h(\d)-to-h(\d)$/.exec(code);
    if (m) return 'spring fra overskrift ' + m[1] + ' til ' + m[2];
    return code;
  }

  /* Indsætter måltal fra API'ets data-felt i teksten. */
  function fmt(text, data) {
    return text.replace(/\{(\w+)\}/g, function (hel, key) {
      var v = data ? data[key] : undefined;
      switch (key) {
        case 'types':
          return liste((v || []).slice(0, 3));
        case 'blockedBots':
          return liste((v || []).map(function (b) { return b === '*' ? 'alle robotter' : b; }));
        case 'headingIssues':
          return liste((v || []).map(headingIssueText));
        case 'missing':
          return liste((v || []).map(function (m) { return OG_NAMES[m] || m; }));
        case 'phone_or_address':
          return data && data.phone ? 'telefonnummer' : 'beliggenhed';
        case 'mb':
          return daTal(v);
        case 'ratioPct':
          return daTal(Math.round((data && data.ratio ? data.ratio : 0) * 1000) / 10);
        default:
          return v == null ? '' : String(v);
      }
    });
  }

  /* Rækkefølge jf. SPEC §7: kritiske fejl først, beståede sidst. */
  function rank(f) {
    if (f.status === 'pass') return 5;
    if (f.status === 'error') return 4;
    if (f.status === 'fail') {
      if (f.priority === 'kritisk') return 0;
      if (f.priority === 'vigtig') return 1;
      return 3;
    }
    return 2; // warn
  }

  function sorted(findings) {
    return findings.slice().sort(function (a, b) {
      var d = rank(a) - rank(b);
      return d !== 0 ? d : b.maxPoints - a.maxPoints;
    });
  }

  function findingText(f) {
    var def = CHECKS[f.id];
    if (!def) return '';
    if (f.status === 'error') return ERROR_TEXT;
    var data = f.data || {};
    var raw = def[f.status] || def.fail || '';
    /* A6 dumper enten på for få ord eller på for lidt tekst i forhold til kode.
       Er der ord nok, er det kodemængden, der er problemet — sig dét i stedet. */
    if (f.id === 'A6' && f.status === 'fail' && def.failRatio && data.wordCount >= 100) {
      raw = def.failRatio;
    }
    return fmt(raw, data);
  }

  function findingNode(f) {
    var wrap = el('div', 'finding');
    var badgeText, badgeCls;
    if (f.status === 'pass') { badgeText = 'I orden'; badgeCls = 'badge maalt'; }
    else if (f.status === 'error') { badgeText = 'Ikke målt'; badgeCls = 'badge maalt'; }
    else { badgeText = BADGES[f.priority] || 'Forbedring'; badgeCls = 'badge ' + f.priority; }

    wrap.appendChild(el('span', badgeCls, badgeText));
    var body = el('div');
    body.appendChild(el('h3', null, (CHECKS[f.id] || {}).t || f.id));
    body.appendChild(el('p', null, findingText(f)));
    wrap.appendChild(body);
    return wrap;
  }

  /* ——— Tilstande ————————————————————————————————————————————————— */

  var stages = {
    idle: $('#stage-idle'),
    scanning: $('#stage-scanning'),
    result: $('#stage-result'),
    error: $('#stage-error')
  };

  function show(name) {
    Object.keys(stages).forEach(function (k) {
      stages[k].classList.toggle('on', k === name);
    });
  }

  /* ——— Ticker ————————————————————————————————————————————————— */

  var tickerTimer = null;

  function startTicker() {
    var host = $('#ticker');
    if (!host || reduce) return;
    host.innerHTML = '';
    var nodes = TICKER.map(function (line, i) {
      var s = el('span', i === 0 ? 'on' : null, line);
      host.appendChild(s);
      return s;
    });
    var i = 0;
    tickerTimer = setInterval(function () {
      nodes[i].classList.remove('on');
      i = i + 1 >= nodes.length ? 3 : i + 1; // looper fra linje 4
      nodes[i].classList.add('on');
    }, 2500);
  }

  function stopTicker() {
    if (tickerTimer) { clearInterval(tickerTimer); tickerTimer = null; }
  }

  /* ——— Resultat ————————————————————————————————————————————————— */

  var RADIUS = 78;
  var CIRC = 2 * Math.PI * RADIUS;

  function bandClass(pct) {
    if (pct >= 0.85) return '';
    if (pct >= 0.6) return '';
    if (pct >= 0.35) return 'lvl-mid';
    return 'lvl-bad';
  }

  function paintRing(score) {
    var bar = $('#ringBar');
    var num = $('#ringNum');
    bar.style.strokeDasharray = CIRC + ' ' + CIRC;
    bar.style.strokeDashoffset = CIRC;
    bar.style.stroke = score >= 60 ? 'var(--acc)' : score >= 35 ? 'var(--mid)' : 'var(--bad)';

    var target = CIRC * (1 - score / 100);

    if (reduce) {
      bar.style.strokeDashoffset = target;
      num.textContent = score;
      return;
    }

    num.textContent = '0';
    /* setTimeout frem for requestAnimationFrame: rAF står stille i en skjult
       fane, og så ville scoren blive stående på 0, hvis man skiftede fane
       undervejs. Med timeren lander slutværdien altid. */
    var done = false;
    setTimeout(function () { bar.style.strokeDashoffset = target; }, 40);

    var start = null, dur = 1400;
    function step(ts) {
      if (done) return;
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      num.textContent = Math.round(score * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
      else done = true;
    }
    requestAnimationFrame(step);
    setTimeout(function () {
      if (!done) { done = true; num.textContent = score; }
    }, dur + 400);
  }

  function renderCategories(categories) {
    var host = $('#cats');
    host.innerHTML = '';
    categories.forEach(function (c) {
      var card = el('div', 'cat');
      card.appendChild(el('span', 'n', c.id));
      card.appendChild(el('h3', null, CATEGORIES[c.id] || c.id));

      if (!c.measurable) {
        card.classList.add('unmeasured');
        card.appendChild(el('div', 'sc', 'Kunne ikke måles'));
      } else {
        var pct = c.max ? c.score / c.max : 0;
        var lvl = bandClass(pct);
        if (lvl) card.classList.add(lvl);
        var sc = el('div', 'sc');
        sc.appendChild(document.createTextNode(String(c.score)));
        sc.appendChild(el('small', null, ' af ' + c.max));
        card.appendChild(sc);
        var bar = el('div', 'bar');
        var fill = el('i');
        bar.appendChild(fill);
        card.appendChild(bar);
        setTimeout(function () { fill.style.width = (pct * 100) + '%'; }, 40);
      }
      host.appendChild(card);
    });
  }

  function renderFindings(all) {
    var list = sorted(all);
    var open = list.filter(function (f) { return f.status !== 'pass'; });
    var passes = list.filter(function (f) { return f.status === 'pass'; });

    var host = $('#findingList');
    host.innerHTML = '';
    open.forEach(function (f) { host.appendChild(findingNode(f)); });

    var intro = $('#findingIntro');
    if (open.length === 0) {
      intro.textContent = 'Der er ingen åbne punkter — alt, vi kunne måle, er i orden.';
    } else {
      intro.textContent = 'Sorteret efter, hvad der betyder mest. Øverst er det, der koster dig mest synlighed lige nu.';
    }

    var box = $('#passes');
    var passHost = $('#passList');
    passHost.innerHTML = '';
    if (passes.length === 0) {
      box.hidden = true;
    } else {
      box.hidden = false;
      box.classList.remove('open');
      $('#passesBody').style.maxHeight = null;
      $('#passesBtn').setAttribute('aria-expanded', 'false');
      $('#passesLabel').textContent = 'Det, der allerede er i orden (' + passes.length + ') ✓';
      passes.forEach(function (f) { passHost.appendChild(findingNode(f)); });
    }
    return open;
  }

  function prefillMessage(data, open) {
    var host = '';
    try { host = new URL(data.finalUrl || data.scannedUrl).hostname.replace(/^www\./, ''); }
    catch (e) { host = data.scannedUrl || ''; }

    var top = open.slice(0, 3).map(function (f) { return (CHECKS[f.id] || {}).t || f.id; });
    var msg = 'Hej Jakob. Jeg har kørt AI-tjekket på ' + host + ' og fik ' + data.totalScore + '/100.';
    if (top.length) msg += ' De vigtigste punkter var: ' + top.join(', ') + '.';
    msg += ' Jeg vil gerne høre, hvad det vil kræve at få det ordnet.';
    try { sessionStorage.setItem('aitjek_prefill', msg); } catch (e) { /* privat browsing */ }
  }

  /* Klokkeslæt for selve scanningen. Uden det ligner et cachet resultat
     et friskt, og brugeren tvivler på sin egen rettelse i stedet for på
     tallet — netop dét skete for os selv på kredithjornet.dk. */
  function klokken(iso) {
    var d = new Date(iso);
    if (!iso || isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
  }

  function renderNotes(data) {
    var host = $('#notes');
    host.innerHTML = '';
    var t = klokken(data.scannedAt);
    if (data.cached) {
      host.appendChild(el('p', 'note vigtig', t
        ? 'Dette resultat er fra kl. ' + t + ' — ikke fra lige nu. Hver side gemmes et døgn, så har du rettet noget siden da, er det ikke med her.'
        : 'Resultat fra tidligere — ikke fra lige nu. Hver side gemmes et døgn.'));
    } else if (t) {
      host.appendChild(el('p', 'note', 'Analyseret nu, kl. ' + t + '.'));
    }
    if (forrigeScannedAt && data.scannedAt === forrigeScannedAt) {
      /* Vi bad om en ny scanning, men fik samme tidsstempel igen. Sig det
         ligeud i stedet for at lade brugeren tro, at siden blev målt påny. */
      host.appendChild(el('p', 'note vigtig',
        'Vi bad om en ny måling, men fik det samme gemte resultat tilbage. Prøv igen senere på dagen.'));
    }
    forrigeScannedAt = '';
    var c = data.categories.filter(function (x) { return x.id === 'C'; })[0];
    if (c && !c.measurable) {
      host.appendChild(el('p', 'note', 'Hastigheden kunne ikke måles lige nu (Googles måletjeneste svarede ikke). Din score er beregnet ud fra resten — prøv igen senere for det fulde billede.'));
    }
  }

  function renderResult(data) {
    var verdict = VERDICTS[data.verdictBand] || VERDICTS.gaps;
    $('#verdictH').textContent = verdict.h;
    $('#verdictP').textContent = verdict.p;

    var shown = data.finalUrl || data.scannedUrl;
    $('#scannedUrl').innerHTML = '';
    $('#scannedUrl').appendChild(document.createTextNode('Analyseret forside: '));
    $('#scannedUrl').appendChild(el('b', null, shown));

    renderNotes(data);
    sidsteScannedAt = data.scannedAt || '';
    // Kun et gemt resultat er værd at måle om.
    $('#rescan').hidden = !data.cached;
    renderCategories(data.categories);

    var all = data.categories.reduce(function (acc, c) { return acc.concat(c.findings); }, []);
    var open = renderFindings(all);

    $('#ctaBody').textContent = verdict.cta;
    prefillMessage(data, open);

    show('result');
    paintRing(data.totalScore);

    var h = $('#verdictH');
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  /* ——— Fejl ————————————————————————————————————————————————— */

  function showError(code) {
    $('#errorText').textContent = ERRORS[code] || ERRORS.INTERNAL;
    $('#errorRetry').hidden = code === 'RATE_LIMITED';
    show('error');
    var h = $('#errorH');
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  /* ——— Flow ————————————————————————————————————————————————— */

  var input = $('#tjekUrl');
  var inlineError = $('#inlineError');
  var busy = false;
  var sidsteUrl = '';          // så "Scan igen" ved, hvad den skal måle om
  var sidsteScannedAt = '';    // tidsstemplet på det resultat, der vises nu
  var forrigeScannedAt = '';   // sat kun når vi beder om en frisk måling

  function looksLikeUrl(value) {
    var v = value.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (!v) return false;
    if (!/\./.test(v)) return false;
    return /^[a-z0-9æøå]([a-z0-9æøå-]*[a-z0-9æøå])?(\.[a-z0-9æøå-]+)+$/i.test(v);
  }

  function scan(value, paany) {
    if (busy) return;
    busy = true;
    sidsteUrl = value;
    inlineError.textContent = '';
    show('scanning');
    startTicker();

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: value, force: paany === true })
    }).then(function (res) {
      return res.json().catch(function () { return { ok: false, error: 'INTERNAL' }; });
    }).then(function (data) {
      stopTicker();
      busy = false;
      if (data && data.ok) renderResult(data);
      else showError((data && data.error) || 'INTERNAL');
    }).catch(function () {
      stopTicker();
      busy = false;
      showError('UNREACHABLE');
    });
  }

  function reset() {
    stopTicker();
    busy = false;
    inlineError.textContent = '';
    show('idle');
    window.scrollTo(0, 0);
    input.focus();
  }

  $('#tjekForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var value = input.value.trim();
    if (!looksLikeUrl(value)) {
      inlineError.textContent = ERRORS.INVALID_URL;
      input.focus();
      return;
    }
    scan(value);
  });

  input.addEventListener('input', function () { inlineError.textContent = ''; });

  $('#again').addEventListener('click', reset);
  $('#errorRetry').addEventListener('click', reset);

  $('#rescan').addEventListener('click', function () {
    if (!sidsteUrl) return;
    forrigeScannedAt = sidsteScannedAt;
    scan(sidsteUrl, true);
  });

  $('#passesBtn').addEventListener('click', function () {
    var box = $('#passes');
    var body = $('#passesBody');
    var open = box.classList.toggle('open');
    body.style.maxHeight = open ? body.scrollHeight + 'px' : null;
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();
