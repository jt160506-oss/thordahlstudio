/* ============================================================
   Kontrolpanel-demo · /kontrolpanel/
   Et ægte, lille kontrolpanel koblet til en mock-side. Alt kører
   lokalt i browseren — der sendes ingenting nogen steder hen.
   Samme felter og samme ordlyd som i det rigtige admin-panel.
   ============================================================ */
(function(){
  var root = document.getElementById('kpDemo');
  if(!root) return;

  /* ---------- Eksempeldata pr. branche ---------- */
  var BRANCHER = {
    frisor:{
      kicker:'Frisørsalon i Viborg',
      overskrift:'Klip der sidder, *hver gang*',
      lead:'Book online, eller kig forbi. Vi tager os god tid til hvert klip.',
      priser:[
        {navn:'Herreklip',note:'',pris:'350 kr.'},
        {navn:'Dameklip',note:'Inkl. vask',pris:'450 kr.'},
        {navn:'Børneklip',note:'Under 12 år',pris:'250 kr.'}
      ],
      dage:[
        {dag:'Man–fre',lukket:false,fra:'09:00',til:'17:30'},
        {dag:'Lørdag',lukket:false,fra:'09:00',til:'14:00'},
        {dag:'Søndag',lukket:true,fra:'',til:''}
      ],
      rev:{tekst:'Altid et godt klip, og man føler sig velkommen fra man træder ind.',navn:'Maja K.'},
      adresse:'Gadenavn 12',by:'8800 Viborg',tlf:'12 34 56 78'
    },
    tomrer:{
      kicker:'Tømrer i Herning',
      overskrift:'Håndværk der *holder*',
      lead:'Tilbygninger, tage og vinduer. Fast pris, før vi går i gang.',
      priser:[
        {navn:'Timepris',note:'Ekskl. materialer',pris:'475 kr.'},
        {navn:'Tilsyn og tilbud',note:'Uforpligtende',pris:'Gratis'},
        {navn:'Mindre reparationer',note:'',pris:'fra 1.200 kr.'}
      ],
      dage:[
        {dag:'Man–tors',lukket:false,fra:'07:00',til:'16:00'},
        {dag:'Fredag',lukket:false,fra:'07:00',til:'14:00'},
        {dag:'Weekend',lukket:true,fra:'',til:''}
      ],
      rev:{tekst:'Kom til tiden, ryddede op efter sig, og prisen holdt hele vejen.',navn:'Søren B.'},
      adresse:'Værkstedsvej 7',by:'7400 Herning',tlf:'12 34 56 78'
    },
    klinik:{
      kicker:'Fysioterapi i Skanderborg',
      overskrift:'Tilbage til *hverdagen*',
      lead:'Behandling af ryg, skuldre og knæ. Du behøver ingen henvisning.',
      priser:[
        {navn:'Første konsultation',note:'45 minutter',pris:'520 kr.'},
        {navn:'Opfølgning',note:'30 minutter',pris:'420 kr.'},
        {navn:'Træningshold',note:'10 gange',pris:'900 kr.'}
      ],
      dage:[
        {dag:'Man–tors',lukket:false,fra:'08:00',til:'18:00'},
        {dag:'Fredag',lukket:false,fra:'08:00',til:'15:00'},
        {dag:'Weekend',lukket:true,fra:'',til:''}
      ],
      rev:{tekst:'Grundig undersøgelse og en plan, jeg faktisk kunne følge derhjemme.',navn:'Anne M.'},
      adresse:'Klinikvej 3',by:'8660 Skanderborg',tlf:'12 34 56 78'
    }
  };

  var navn = 'Din virksomhed';
  var billede = 1;
  var d = clone(BRANCHER.frisor);

  function clone(o){return JSON.parse(JSON.stringify(o));}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  /* *ord* bliver fremhævet — præcis som i det rigtige system */
  function emify(s){return esc(s).replace(/\*([^*]+)\*/g,'<span class="em">$1</span>');}

  /* ---------- Elementer ---------- */
  var q = function(s){return root.querySelector(s);};
  var qa = function(s){return Array.prototype.slice.call(root.querySelectorAll(s));};
  var screen = q('#kpScreen');
  var chip = q('#kpChip');
  var bar = q('#kpBar');
  var pubBtn = q('#kpPublish');
  var liveTxt = q('#kpLive');
  var diffBox = q('#kpDiff');
  var dirty = false;

  /* ---------- Tegn mock-siden ---------- */
  function paintStatic(){
    q('#s-navn').textContent = navn;
    q('#s-foot-navn').textContent = navn;
    q('#s-kicker').textContent = d.kicker;
    q('#s-h').innerHTML = emify(d.overskrift);
    q('#s-lead').textContent = d.lead;
    q('#s-img').className = 'kp-g' + billede;
    q('#s-rev-tekst').textContent = '„' + d.rev.tekst + '“';
    q('#s-rev-navn').textContent = d.rev.navn;
    q('#s-adr').textContent = d.adresse;
    q('#s-by').textContent = d.by;
    q('#s-tlf').textContent = d.tlf;
  }
  function paintPriser(){
    q('#s-priser').innerHTML = d.priser.map(function(p,i){
      return '<div class="kp-pr" data-i="'+i+'"><span>'+esc(p.navn)+
        (p.note?'<em>'+esc(p.note)+'</em>':'')+'</span><b>'+esc(p.pris)+'</b></div>';
    }).join('');
  }
  function paintDage(){
    q('#s-dage').innerHTML = d.dage.map(function(x,i){
      return '<div class="kp-oh'+(x.lukket?' lukket':'')+'" data-i="'+i+'"><span>'+esc(x.dag)+
        '</span><b>'+(x.lukket?'Lukket':esc(x.fra)+'–'+esc(x.til))+'</b></div>';
    }).join('');
  }
  function paintAll(){paintStatic();paintPriser();paintDage();}

  /* ---------- Markér det, der lige blev ændret ---------- */
  function hit(sel){
    var el = typeof sel === 'string' ? q(sel) : sel;
    if(!el) return;
    el.classList.remove('kp-hit');
    void el.offsetWidth;              /* fremtving reflow, ellers springer den over i baggrundsfaner */
    el.classList.add('kp-hit');
  }

  /* ---------- Ikke-gemt-tilstand + diff ---------- */
  function touch(file, gammel, ny){
    dirty = true;
    chip.className = 'kp-chip dirty';
    chip.innerHTML = '<i></i>Ikke gemt';
    liveTxt.className = 'kp-live';
    liveTxt.textContent = 'Du har rettet noget — tryk Publish.';
    if(diffBox){
      diffBox.innerHTML = '<span class="f">'+esc(file)+'</span>'+
        '<span class="o">- '+esc(gammel||'(tom)')+'</span><br>'+
        '<span class="n">+ '+esc(ny||'(tom)')+'</span>';
    }
  }

  /* ---------- Publish ---------- */
  pubBtn.addEventListener('click', function(){
    if(pubBtn.disabled) return;
    pubBtn.disabled = true;
    pubBtn.innerHTML = '<span class="kp-spin"></span>Publicerer…';
    chip.className = 'kp-chip';
    chip.innerHTML = '';
    bar.classList.add('go');
    liveTxt.className = 'kp-live';
    liveTxt.textContent = 'Siden bygges…';
    setTimeout(function(){
      var t = new Date();
      var kl = ('0'+t.getHours()).slice(-2) + '.' + ('0'+t.getMinutes()).slice(-2);
      pubBtn.disabled = false;
      pubBtn.textContent = 'Publish';
      bar.classList.remove('go');
      chip.className = 'kp-chip live';
      chip.innerHTML = '<i></i>Live kl. ' + kl;
      liveTxt.className = 'kp-live on';
      liveTxt.textContent = 'Ændringen er på siden · kl. ' + kl;
      dirty = false;
    }, 1400);
  });

  /* ---------- Sidemenu: skift felter, og rul telefonen derhen ---------- */
  qa('.kp-side button').forEach(function(b){
    b.addEventListener('click', function(){
      qa('.kp-side button').forEach(function(x){x.classList.remove('on');
        x.setAttribute('aria-selected','false');});
      b.classList.add('on'); b.setAttribute('aria-selected','true');
      qa('.kp-pane').forEach(function(p){p.classList.remove('on');});
      var pane = q('#pane-' + b.dataset.s);
      if(pane) pane.classList.add('on');
      var sec = q('#sec-' + b.dataset.s);
      if(sec && screen){
        screen.scrollTo({top: Math.max(0, sec.offsetTop - 46),
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
        hit(sec.querySelector('.kp-st') || sec);
      }
    });
  });

  /* ---------- Faner på mobil ---------- */
  qa('.kp-tabs button').forEach(function(b){
    b.addEventListener('click', function(){
      qa('.kp-tabs button').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on');
      qa('[data-pane]').forEach(function(p){
        p.classList.toggle('show', p.dataset.pane === b.dataset.t);
      });
    });
  });
  function syncTabs(){
    if(matchMedia('(max-width:1040px)').matches){
      if(!root.querySelector('[data-pane].show')) q('[data-pane="panel"]').classList.add('show');
    }
  }
  syncTabs(); addEventListener('resize', syncTabs);

  /* ---------- Simple felter ---------- */
  function bindText(id, file, get, set, target, paint){
    var el = q(id);
    if(!el) return;
    el.addEventListener('input', function(){
      var gammel = get();
      set(el.value);
      (paint || paintStatic)();
      hit(target);
      touch(file, gammel, el.value);
    });
  }

  bindText('#f-navn','content/kontakt.json',function(){return navn;},
    function(v){navn = v || 'Din virksomhed';},'#s-navn');
  bindText('#f-kicker','content/tekster.json',function(){return d.kicker;},
    function(v){d.kicker = v;},'#s-kicker');
  bindText('#f-overskrift','content/tekster.json',function(){return d.overskrift;},
    function(v){d.overskrift = v;},'#s-h');
  bindText('#f-lead','content/tekster.json',function(){return d.lead;},
    function(v){d.lead = v;},'#s-lead');
  bindText('#f-rev-tekst','content/anmeldelser.json',function(){return d.rev.tekst;},
    function(v){d.rev.tekst = v;},'#s-rev-tekst');
  bindText('#f-rev-navn','content/anmeldelser.json',function(){return d.rev.navn;},
    function(v){d.rev.navn = v;},'#s-rev-navn');
  bindText('#f-adresse','content/kontakt.json',function(){return d.adresse;},
    function(v){d.adresse = v;},'#s-adr');
  bindText('#f-by','content/kontakt.json',function(){return d.by;},
    function(v){d.by = v;},'#s-by');
  bindText('#f-tlf','content/kontakt.json',function(){return d.tlf;},
    function(v){d.tlf = v;},'#s-tlf');

  /* ---------- Priser ---------- */
  function bindPriser(){
    qa('#pane-priser [data-p]').forEach(function(el){
      el.addEventListener('input', function(){
        var i = +el.dataset.p, k = el.dataset.k, gammel = d.priser[i][k];
        d.priser[i][k] = el.value;
        paintPriser();
        hit(q('#s-priser [data-i="'+i+'"]'));
        touch('content/priser.json', gammel, el.value);
      });
    });
  }

  /* ---------- Åbningstider ---------- */
  function bindDage(){
    qa('#pane-aabningstider [data-d]').forEach(function(el){
      var ev = el.type === 'checkbox' ? 'change' : 'input';
      el.addEventListener(ev, function(){
        var i = +el.dataset.d, k = el.dataset.k;
        var gammel = d.dage[i].lukket ? 'Lukket' : d.dage[i].fra + '–' + d.dage[i].til;
        if(k === 'lukket'){
          d.dage[i].lukket = el.checked;
          el.closest('.kp-day').classList.toggle('closed', el.checked);
        } else { d.dage[i][k] = el.value; }
        paintDage();
        hit(q('#s-dage [data-i="'+i+'"]'));
        var ny = d.dage[i].lukket ? 'Lukket' : d.dage[i].fra + '–' + d.dage[i].til;
        touch('content/aabningstider.json', gammel, ny);
      });
    });
  }

  /* ---------- Billeder ---------- */
  qa('.kp-pic input').forEach(function(el){
    el.addEventListener('change', function(){
      var gammel = 'billede-' + billede + '.webp';
      billede = +el.value;
      qa('.kp-pic').forEach(function(p){
        p.classList.toggle('on', p.querySelector('input').checked);
      });
      paintStatic();
      hit('#s-img');
      touch('content/billeder.json', 'assets/uploads/' + gammel,
        'assets/uploads/billede-' + billede + '.webp');
    });
  });

  /* ---------- Udfyld formularfelterne fra data ---------- */
  function fillForm(){
    q('#f-navn').value = navn;
    q('#f-kicker').value = d.kicker;
    q('#f-overskrift').value = d.overskrift;
    q('#f-lead').value = d.lead;
    q('#f-rev-tekst').value = d.rev.tekst;
    q('#f-rev-navn').value = d.rev.navn;
    q('#f-adresse').value = d.adresse;
    q('#f-by').value = d.by;
    q('#f-tlf').value = d.tlf;

    q('#pane-priser .kp-list').innerHTML = d.priser.map(function(p,i){
      return '<div class="kp-row"><div class="kp-cap">Ydelse '+(i+1)+'</div>'+
        '<div class="kp-grid">'+
        '<input type="text" data-p="'+i+'" data-k="navn" value="'+esc(p.navn)+
          '" aria-label="Navn på ydelsen">'+
        '<input type="text" data-p="'+i+'" data-k="pris" value="'+esc(p.pris)+
          '" aria-label="Pris">'+
        '</div>'+
        '<input type="text" data-p="'+i+'" data-k="note" value="'+esc(p.note)+
          '" placeholder="Lille note (må være tom)" aria-label="Lille note" '+
          'style="margin-top:8px">'+
        '</div>';
    }).join('');

    q('#pane-aabningstider .kp-list').innerHTML =
      '<div class="kp-dayhead"><span></span><span>Åbner</span><span>Lukker</span>'+
      '<b>Lukket</b></div>' +
      d.dage.map(function(x,i){
      return '<div class="kp-day'+(x.lukket?' closed':'')+'"><b>'+esc(x.dag)+'</b>'+
        '<input type="text" data-d="'+i+'" data-k="fra" value="'+esc(x.fra)+
          '" placeholder="09:00" aria-label="'+esc(x.dag)+' åbner">'+
        '<input type="text" data-d="'+i+'" data-k="til" value="'+esc(x.til)+
          '" placeholder="17:00" aria-label="'+esc(x.dag)+' lukker">'+
        '<label class="kp-sw" title="Lukket"><input type="checkbox" data-d="'+i+
          '" data-k="lukket"'+(x.lukket?' checked':'')+
          ' aria-label="'+esc(x.dag)+' lukket"><i></i></label>'+
        '</div>';
    }).join('');

    bindPriser(); bindDage();
  }

  /* ---------- Brancheskift ---------- */
  qa('.kp-branche button').forEach(function(b){
    b.addEventListener('click', function(){
      qa('.kp-branche button').forEach(function(x){
        x.classList.remove('on'); x.setAttribute('aria-pressed','false');});
      b.classList.add('on'); b.setAttribute('aria-pressed','true');
      d = clone(BRANCHER[b.dataset.b]);
      fillForm(); paintAll();
      if(screen) screen.scrollTo({top:0, behavior:'auto'});
      chip.className = 'kp-chip'; chip.innerHTML = '';
      liveTxt.className = 'kp-live'; liveTxt.textContent = '';
      dirty = false;
    });
  });

  fillForm();
  paintAll();
})();
