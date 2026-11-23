// Services accordion: hovering a heading opens it, and the open item lights
// its own window in the building (the window ↔ item pairs are fixed in the
// markup via data-light, deliberately not in floor order).
// Opening and closing animate the body's height so moving between cards
// glides instead of snapping the list around.
(function () {
  const list = document.querySelector('.services__list');
  const items = [...document.querySelectorAll('.services .service')];
  const windows = document.querySelectorAll('.services__window');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 350;
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  // Exclusivity is handled here; the native `name` grouping would close the
  // other items instantly, without the animation.
  items.forEach((item) => item.removeAttribute('name'));

  const target = new Map(items.map((item) => [item, item.open]));

  function update() {
    const index = items.findIndex((item) => target.get(item));
    windows.forEach((w) => w.classList.toggle('is-lit', Number(w.dataset.light) === index));
  }

  function setOpen(item, open) {
    if (target.get(item) === open) return;
    target.set(item, open);
    update();

    const body = item.querySelector('.service__body');
    const from = item.open ? body.getBoundingClientRect().height : 0;
    if (item._anim) item._anim.cancel();

    item.open = true;
    const to = open ? body.getBoundingClientRect().height : 0;

    if (reduceMotion.matches) {
      item.open = open;
      return;
    }

    // Padding is animated along with the height: a body squeezed to height 0
    // still keeps its padding, which then vanished in one step at the end
    // and made everything below snap by that much.
    const pad = parseFloat(getComputedStyle(body).paddingTop);
    const frame = (h) => ({ height: h + 'px', paddingTop: Math.min(h, pad) + 'px' });
    const anim = body.animate(
      [frame(from), frame(to)],
      { duration: DURATION, easing: EASE }
    );
    item._anim = anim;
    // A newer animation cancels this one, which rejects `finished`
    anim.finished.then(() => {
      item._anim = null;
      if (!target.get(item)) item.open = false;
    }, () => {});
  }

  function openOnly(item) {
    items.forEach((other) => setOpen(other, other === item));
  }

  items.forEach((item) => {
    // Click / Enter / Space on the heading: animate instead of the native snap
    item.querySelector('.service__head').addEventListener('click', (e) => {
      e.preventDefault();
      if (target.get(item)) setOpen(item, false);
      else openOnly(item);
    });

    // Keep in sync if something else opens it (e.g. find-in-page)
    item.addEventListener('toggle', () => {
      if (item.open && !target.get(item) && !item._anim) openOnly(item);
    });
  });

  // The list sits vertically centred beside the building, so it would move
  // whenever its height changed (none open vs. one open). Reserve room for
  // the tallest open state so it stays put.
  function reserveHeight() {
    list.style.minHeight = '';
    const saved = items.map((item) => item.open);
    items.forEach((item) => { item.open = false; });
    const closed = list.getBoundingClientRect().height;
    let tallest = 0;
    items.forEach((item) => {
      item.open = true;
      tallest = Math.max(tallest, item.querySelector('.service__body').getBoundingClientRect().height);
      item.open = false;
    });
    items.forEach((item, i) => { item.open = saved[i]; });
    list.style.minHeight = closed + tallest + 'px';
    // Centre the building on the rows as they sit at rest (all closed), not on
    // the reserved box, which has extra room at the bottom for an open item
    list.parentElement.style.setProperty('--services-rows', closed + 'px');
  }
  reserveHeight();
  new ResizeObserver(() => {
    if (!items.some((item) => item._anim)) reserveHeight();
  }).observe(list.parentElement);

  // Hover-to-open only where hover exists; on touch a tap would open then close it
  if (matchMedia('(hover: hover)').matches) {
    // The whole item (heading and open text) is the hover area. pointermove,
    // not mouseenter: items sliding under a still cursor mid-animation must
    // not open anything; only a real cursor move picks the item under it.
    list.addEventListener('pointermove', (e) => {
      const item = e.target.closest('.service');
      if (item && !target.get(item)) openOnly(item);
    });
    // An item stays open while the cursor crosses the gap to the next one;
    // leaving the whole list closes it and turns the window off
    list.addEventListener('mouseleave', () => items.forEach((item) => setOpen(item, false)));
  }

  update();
})();
