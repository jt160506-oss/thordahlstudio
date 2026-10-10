/* ============================================================
   Linjen paa /proces/ tegner sig selv, mens man scroller, og
   knuderne lyser op, efterhaanden som den naar dem.
   Uden JavaScript staar linjen faerdigtegnet — den bliver aldrig
   et tomt spor.
   ============================================================ */
(function(){
  var ol = document.querySelector('.pr-line');
  if(!ol) return;

  var noder = Array.prototype.slice.call(ol.querySelectorAll('.pr-node'));
  var rolig = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Fra nu af styrer vi hoejden. Klassen saettes foerst her, saa linjen
     staar tegnet, hvis denne fil aldrig naar at koere. */
  ol.classList.add('js');

  if(rolig){
    noder.forEach(function(n){n.classList.add('lys')});
    return;
  }

  var venter = false;

  function opdater(){
    venter = false;
    var r = ol.getBoundingClientRect();
    var maksimum = r.height - 62;              /* samme fradrag som i CSS */
    var laeselinje = innerHeight * 0.55;       /* lidt over midten af skaermen */
    var h = Math.min(Math.max(laeselinje - r.top - 16, 0), Math.max(maksimum, 0));
    ol.style.setProperty('--fyld', h + 'px');

    for(var i = 0; i < noder.length; i++){
      var d = noder[i].querySelector('.pr-dot');
      if(!d) continue;
      /* offsetTop paa prikken er relativ til sit eget trin, ikke til hele
         linjen — derfor skal trinnets egen placering laegges til. */
      var midte = noder[i].offsetTop + d.offsetTop + (d.offsetHeight / 2);
      noder[i].classList.toggle('lys', midte <= h + 10);
    }
  }

  function bed(){
    if(!venter){ venter = true; requestAnimationFrame(opdater); }
  }

  addEventListener('scroll', bed, {passive:true});
  addEventListener('resize', bed);
  /* Naar et trin foldes ud, flytter alting sig nedenunder. */
  ol.addEventListener('toggle', bed, true);
  opdater();

  /* Sikkerhedsnet: gaar noget galt, saa lad linjen staa tegnet
     frem for at efterlade et tomt spor. */
  setTimeout(function(){
    if(!ol.style.getPropertyValue('--fyld')){
      ol.classList.remove('js');
      noder.forEach(function(n){n.classList.add('lys')});
    }
  }, 3000);
})();
