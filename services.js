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

    const anim = body.animate(
      [{ height: from + 'px' }, { height: to + 'px' }],
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

  // Hover-to-open only where hover exists; on touch a tap would open then close it
  if (matchMedia('(hover: hover)').matches) {
    items.forEach((item) => {
      item.querySelector('.service__head').addEventListener('mouseenter', () => openOnly(item));
    });
    // An item stays open while the cursor crosses the gap to the next one;
    // leaving the whole list closes it and turns the window off
    list.addEventListener('mouseleave', () => items.forEach((item) => setOpen(item, false)));
  }

  update();
})();
