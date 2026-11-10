// Scroll-scrubbed hero building. The drawing follows the scroll position while the
// hero is pinned: scrolling down draws, scrolling back up erases. A darker copy of
// the house is drawn band by band from the ground up.
// With reduced motion (OS setting or the accessibility toolbar) the house is shown
// complete and does not move.
(function () {
  const hero = document.getElementById('hero');
  const root = document.documentElement;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => reduceMotionQuery.matches || root.classList.contains('a11y-no-motion');

  const LINES_END = 0.9; // lines are complete after 90%
  const BAND_WINDOW = 0.22; // how long one band takes, as a share of the lines' run

  const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
  // Deterministic 0–1 scatter so strokes don't all start on the same frame
  const scatter = (i) => Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);

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
    const p = motionOff() ? 1 : clamp01(progress / LINES_END);
    lines.forEach((it) => paint(it, clamp01((p - it.start) / BAND_WINDOW)));
  }

  let target = 0;
  let current = 0;
  let rafId = 0;

  function tick() {
    current += (target - current) * (motionOff() ? 1 : 0.18);
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

  // Re-render when the toolbar or the OS setting turns motion on/off
  document.addEventListener('a11y:change', () => render(current));
  reduceMotionQuery.addEventListener('change', () => render(current));

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  render(0);
  onScroll();
})();

// Header gets a solid backdrop once the page scrolls.
(function () {
  const header = document.getElementById('site-header');
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
