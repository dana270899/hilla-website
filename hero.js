// Scroll-scrubbed hero building. The drawing follows the scroll position while the
// hero is pinned: scrolling down draws, scrolling back up erases. A darker copy of
// the house is drawn from the ground up.
// With reduced motion (OS setting or the accessibility toolbar) the house is shown
// complete and does not move.
(function () {
  const hero = document.getElementById('hero');
  const root = document.documentElement;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => reduceMotionQuery.matches || root.classList.contains('a11y-no-motion');

  const LINES_END = 0.9; // lines are complete after 90%
  // How far (in path units, 1/20 of a building pixel) the rising front travels
  // while one horizontal line fills across
  const ACROSS = 1600;

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const clamp01 = (v) => clamp(v, 0, 1);

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = hero.querySelector('svg.building');
  const defs = svg.insertBefore(document.createElementNS(SVG_NS, 'defs'), svg.firstChild);

  // The traced lines are cut into horizontal bands, so one long vertical line is
  // several stacked pieces. To keep it continuous, every piece follows a single
  // front that rises from the ground: a vertical piece is filled up to the front,
  // and a horizontal piece fills across (right to left, the page's reading
  // direction) once the front reaches it.
  const lines = [];
  hero.querySelectorAll('.b-lines .band path').forEach((el) => {
    // Each line is a thin filled shape. It becomes a clip, and a solid rectangle
    // grows inside it.
    const box = el.getBBox();
    const id = 'line-clip-' + lines.length;
    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.id = id;
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    defs.appendChild(clip);
    const wrap = document.createElementNS(SVG_NS, 'g');
    wrap.setAttribute('clip-path', `url(#${id})`);
    el.replaceWith(wrap);
    clip.appendChild(el);
    const rect = document.createElementNS(SVG_NS, 'rect');
    if (box.height > box.width) {
      rect.setAttribute('x', box.x);
      rect.setAttribute('width', box.width);
      rect.setAttribute('y', box.y);
    } else {
      rect.setAttribute('y', box.y);
      rect.setAttribute('height', box.height);
    }
    wrap.appendChild(rect);
    lines.push({ rect, box, vertical: box.height > box.width, last: -1 });
  });

  const bottom = Math.min(...lines.map((l) => l.box.y));
  const top = Math.max(...lines.map((l) => l.box.y + l.box.height));

  // front: the height (path units; the group is flipped, so y grows upward) the
  // drawing has reached.
  function paint(item, front) {
    const { rect, box } = item;
    if (item.vertical) {
      const h = Math.round(clamp(front - box.y, 0, box.height));
      if (h === item.last) return;
      item.last = h;
      rect.setAttribute('height', h);
    } else {
      const q = Math.round(clamp01((front - box.y) / ACROSS) * 200) / 200;
      if (q === item.last) return;
      item.last = q;
      rect.setAttribute('x', box.x + box.width * (1 - q));
      rect.setAttribute('width', box.width * q);
    }
  }

  function render(progress) {
    const p = motionOff() ? 1 : clamp01(progress / LINES_END);
    const front = bottom + (top + ACROSS - bottom) * p;
    lines.forEach((it) => paint(it, front));
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
