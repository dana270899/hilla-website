// Scroll-scrubbed hero building. The drawing follows the scroll position while the
// hero is pinned: scrolling down draws, scrolling back up erases.
//   fill    — a darker copy of the house is drawn band by band from the ground up
//   details — the plants are drawn in blue, all at once, from the first bit of scroll
(function () {
  const hero = document.getElementById('hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PLANTS_END = 1; // plants finish as the pin releases (the hero is shorter in this mode, see styles.css)
  const LINES_END = 0.9; // lines are complete after 90%
  const BAND_WINDOW = 0.22; // how long one band takes, as a share of the lines' run

  const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
  // Deterministic 0–1 scatter so strokes don't all start on the same frame
  const scatter = (i) => Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);

  const plants = [...hero.querySelectorAll('.detail path')].map((el, i) => ({
    el, start: scatter(i) * 0.4, last: -1,
  }));

  const bands = hero.querySelectorAll('.b-lines .band');
  const lines = [];
  bands.forEach((band, k) => {
    const bandStart = (k / bands.length) * (1 - BAND_WINDOW);
    band.querySelectorAll('path').forEach((el, i) => {
      lines.push({ el, start: bandStart + (scatter(lines.length + i) - 0.5) * 0.04, last: -1 });
    });
  });

  // t: 0 → 1 for one path. Outline is drawn first, then it fills in solid.
  function paint(item, t) {
    const q = Math.round(t * 200) / 200;
    if (q === item.last) return;
    item.last = q;
    const fill = clamp01((q - 0.6) / 0.4);
    item.el.style.strokeDashoffset = 1 - clamp01(q / 0.7);
    item.el.style.fillOpacity = fill;
    item.el.style.strokeOpacity = 1 - fill;
  }

  function render(progress) {
    if (hero.dataset.effect === 'details') {
      const p = clamp01(progress / PLANTS_END);
      plants.forEach((it) => paint(it, clamp01((p - it.start) / 0.6)));
    } else {
      const p = clamp01(progress / LINES_END);
      lines.forEach((it) => paint(it, clamp01((p - it.start) / BAND_WINDOW)));
    }
  }

  let target = 0;
  let current = 0;
  let rafId = 0;

  function tick() {
    current += (target - current) * (reduceMotion ? 1 : 0.18);
    if (Math.abs(target - current) < 0.0005) current = target;
    render(current);
    rafId = current === target ? 0 : requestAnimationFrame(tick);
  }

  function onScroll() {
    const rect = hero.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    target = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  // Effect toggle
  const buttons = document.querySelectorAll('.effect-toggle [data-effect]');

  function setEffect(effect) {
    buttons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.effect === effect)));
    hero.dataset.effect = effect;
    [...plants, ...lines].forEach((it) => (it.last = -1));
    // Outside the plants effect, plants are just part of the static house
    if (effect !== 'details') plants.forEach((it) => it.el.removeAttribute('style'));
    render(current);
    try { localStorage.setItem('hero-effect', effect); } catch (e) {}
  }

  buttons.forEach((b) => b.addEventListener('click', () => setEffect(b.dataset.effect)));

  let saved = null;
  try { saved = localStorage.getItem('hero-effect'); } catch (e) {}
  setEffect(saved === 'details' ? 'details' : 'fill');

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();

// Header gets a solid backdrop once the page scrolls.
(function () {
  const header = document.getElementById('site-header');
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
