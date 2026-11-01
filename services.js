// Services accordion: hovering a heading opens it, and the open item lights
// its own window in the building (the window ↔ item pairs are fixed in the
// markup via data-light, deliberately not in floor order).
(function () {
  const items = [...document.querySelectorAll('.services .service')];
  const windows = document.querySelectorAll('.services__window');

  // Hover-to-open only where hover exists; on touch a tap would open then close it
  if (matchMedia('(hover: hover)').matches) {
    items.forEach((item) => {
      item.querySelector('.service__head').addEventListener('mouseenter', () => {
        items.forEach((other) => { other.open = other === item; });
      });
      // Leaving the card (heading or its text) closes it and turns the window off
      item.addEventListener('mouseleave', () => { item.open = false; });
    });
  }

  function update() {
    const index = items.findIndex((item) => item.open);
    windows.forEach((w) => w.classList.toggle('is-lit', Number(w.dataset.light) === index));
  }

  items.forEach((item) => item.addEventListener('toggle', update));
})();
