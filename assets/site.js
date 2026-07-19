/* Thordahl — fælles adfærd for undersider (blog, privatlivspolitik, tak).
   Forsiden og Silkeborg-siden har deres egen udvidede version inline.
   Grafik-kvalitetstrin styres af assets/perf.js (window.Thordahl):
   i reduceret trin droppes blød scroll og custom cursor, og nav-blur
   erstattes af en solid tone via CSS. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const T = window.Thordahl || { tier: () => 'high', isReduced: () => false, onReduce: () => {} };

  /* Blød scroll — ikke i reduceret trin */
  let lenis = null;
  if (!reduce && !T.isReduced() && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, touchMultiplier: 1.6 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* Ankerlinks */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const h = a.getAttribute('href');
      if (h.length <= 1) return;
      const el = document.querySelector(h);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -70 });
      else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* Sticky nav — rAF-throttlet scroll */
  const nav = document.getElementById('nav');
  if (nav) {
    let queued = false;
    const frame = () => { queued = false; nav.classList.toggle('scrolled', scrollY > 20); };
    const on = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
    addEventListener('scroll', on, { passive: true });
    if (lenis) lenis.on('scroll', on);
    frame();
  }

  /* Custom cursor — samme som på forsiden, kun i høj grafiktrin med mus/fin peger */
  let cursorOn = false, cursorRAF = 0;
  function initCursor() {
    if (cursorOn || !fine || reduce || T.isReduced()) return;
    cursorOn = true;
    const make = cls => {
      const d = document.createElement('div');
      d.className = cls;
      d.setAttribute('aria-hidden', 'true');
      document.body.appendChild(d);
      return d;
    };
    const orb = make('cursor-orb'), dot = make('cursor-dot'), ring = make('cursor-ring');
    document.body.classList.add('has-cursor');

    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, ox = mx, oy = my;
    // mousemove gemmer kun koordinater — al DOM-skrivning sker i rAF-løkken
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

    (function loop() {
      if (!cursorOn) return;
      dot.style.transform = `translate(${mx - 3}px,${my - 3}px)`;
      rx += (mx - rx) * .18; ry += (my - ry) * .18;
      ring.style.transform = `translate(${rx - 17}px,${ry - 17}px)`;
      ox += (mx - ox) * .08; oy += (my - oy) * .08;
      orb.style.transform = `translate(${ox - 150}px,${oy - 150}px)`;
      cursorRAF = requestAnimationFrame(loop);
    })();

    document.querySelectorAll('a,button').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('big'));
      el.addEventListener('mouseleave', () => ring.classList.remove('big'));
    });
  }
  initCursor();

  /* Skru ned til reduceret trin: stop cursor-løkke og blød scroll */
  T.onReduce(() => {
    if (cursorOn) {
      cursorOn = false;
      cancelAnimationFrame(cursorRAF);
      document.body.classList.remove('has-cursor');
    }
    if (lenis) { try { lenis.destroy(); } catch (e) {} lenis = null; }
  });
})();
