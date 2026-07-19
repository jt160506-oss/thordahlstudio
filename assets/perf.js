/* Thordahl — grafik-kvalitetstrin.
   Ét formål: hold oplevelsen glat på svage enheder uden at røre designet på stærke.

   Trin:
   - "high"     : uændret, fuld oplevelse (standard).
   - "reduced"  : svage enheder, vedvarende lav FPS, Save-Data eller
                  prefers-reduced-motion. Tunge lag trappes ned via CSS
                  (html[data-tier="reduced"]) og via JS gennem onReduce().

   API (window.Thordahl):
     tier()        -> "high" | "reduced"
     isReduced()   -> bool
     onReduce(fn)  -> kør fn når/hvis vi skruer ned (også straks hvis allerede reduced)
     reduceNow()   -> tving reduceret trin (bruges sjældent)
*/
(function () {
  var root = document.documentElement;
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var saveData = !!conn.saveData;
  var lowCPU = (navigator.hardwareConcurrency || 8) <= 2;
  var lowMem = (navigator.deviceMemory || 8) <= 2;

  var tier = 'high';
  var cbs = [];

  function apply(t) {
    if (t === tier) return;
    tier = t;
    root.setAttribute('data-tier', t);
    if (t === 'reduced') {
      for (var i = 0; i < cbs.length; i++) { try { cbs[i](); } catch (e) {} }
    }
  }

  root.setAttribute('data-tier', 'high');

  /* Statisk førstevurdering — klare lav-ende-signaler skruer ned med det samme. */
  if (reduceMotion || saveData || lowCPU || lowMem) apply('reduced');

  /* Live FPS-vagt: skru ned hvis billedraten falder vedvarende under ~45.
     Starter først når siden er faldet til ro, så load-hak ikke tæller med.
     Store spring (faneskift, alt-tab) ignoreres, og en enkelt hikke tæller ikke —
     der kræves ~1,5 s vedvarende lav FPS. Så et stærkt system skruer aldrig ned. */
  function startMeter() {
    if (tier === 'reduced') return;
    var last = performance.now(), acc = 0, frames = 0, slow = 0;
    function tick(now) {
      var dt = now - last; last = now;
      if (dt > 0 && dt < 1000) {
        frames++; acc += dt;
        if (acc >= 500) {
          var fps = frames * 1000 / acc;
          slow = fps < 45 ? slow + acc : 0;
          frames = 0; acc = 0;
          if (slow >= 1500) { apply('reduced'); return; }
        }
      }
      if (tier !== 'reduced') requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (tier === 'high') {
    if (document.readyState === 'complete') setTimeout(startMeter, 1800);
    else addEventListener('load', function () { setTimeout(startMeter, 1800); });
  }

  window.Thordahl = {
    tier: function () { return tier; },
    isReduced: function () { return tier === 'reduced'; },
    onReduce: function (fn) {
      if (typeof fn !== 'function') return;
      cbs.push(fn);
      if (tier === 'reduced') { try { fn(); } catch (e) {} }
    },
    reduceNow: function () { apply('reduced'); }
  };
})();
