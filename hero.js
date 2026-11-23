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
    // A plain copy of the line, shown instead of the clip once the line is complete.
    // Only lines that are partly drawn pay for a clip; empty ones aren't painted at all.
    const solid = el.cloneNode(false);
    solid.removeAttribute('id');
    wrap.appendChild(solid);
    const item = { wrap, rect, solid, clip: `url(#${id})`, box, vertical: box.height > box.width, last: -1, state: '' };
    setState(item, 'empty');
    lines.push(item);
  });

  const bottom = Math.min(...lines.map((l) => l.box.y));
  const top = Math.max(...lines.map((l) => l.box.y + l.box.height));

  // front: the height (path units; the group is flipped, so y grows upward) the
  // drawing has reached.
  // empty: nothing painted; partial: the growing rectangle inside the clip;
  // full: the plain line, no clip
  function setState(item, state) {
    if (item.state === state) return;
    item.state = state;
    item.wrap.style.display = state === 'empty' ? 'none' : '';
    if (state === 'partial') item.wrap.setAttribute('clip-path', item.clip);
    else item.wrap.removeAttribute('clip-path');
    item.rect.style.display = state === 'partial' ? '' : 'none';
    item.solid.style.display = state === 'full' ? '' : 'none';
  }

  function paint(item, front) {
    const { rect, box } = item;
    // Fill fraction, kept fine-grained so the drawing moves in sub-pixel steps
    const f = item.vertical
      ? clamp01((front - box.y) / box.height)
      : Math.round(clamp01((front - box.y) / ACROSS) * 1000) / 1000;
    if (f === item.last) return;
    item.last = f;
    setState(item, f <= 0 ? 'empty' : f >= 1 ? 'full' : 'partial');
    if (f <= 0 || f >= 1) return;
    if (item.vertical) {
      rect.setAttribute('height', box.height * f);
    } else {
      rect.setAttribute('x', box.x + box.width * (1 - f));
      rect.setAttribute('width', box.width * f);
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

// Header gets a solid backdrop only once the hero has scrolled out from under it.
(function () {
  const header = document.getElementById('site-header');
  const hero = document.getElementById('hero');
  const update = () => {
    const pastHero = hero
      ? hero.getBoundingClientRect().bottom <= header.offsetHeight
      : window.scrollY > 8;
    header.classList.toggle('is-scrolled', pastHero);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
