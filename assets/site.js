/* Thordahl — fælles adfærd for undersider (blog, privatlivspolitik, tak).
   Forsiden og Silkeborg-siden har deres egen udvidede version inline. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* Blød scroll */
  let lenis = null;
  if (!reduce && window.Lenis) {
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

  /* Sticky nav */
  const nav = document.getElementById('nav');
  if (nav) {
    const on = () => nav.classList.toggle('scrolled', scrollY > 20);
    addEventListener('scroll', on, { passive: true });
    if (lenis) lenis.on('scroll', on);
    on();
  }

  /* Custom cursor — samme som på forsiden */
  if (fine && !reduce) {
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
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx - 3}px,${my - 3}px)`;
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * .18; ry += (my - ry) * .18;
      ring.style.transform = `translate(${rx - 17}px,${ry - 17}px)`;
      ox += (mx - ox) * .08; oy += (my - oy) * .08;
      orb.style.transform = `translate(${ox - 150}px,${oy - 150}px)`;
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('a,button').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('big'));
      el.addEventListener('mouseleave', () => ring.classList.remove('big'));
    });
  }
})();
