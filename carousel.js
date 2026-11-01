// Review carousel: arrows scroll by one card and disable at either end.
(function () {
  const carousel = document.getElementById('reviews-carousel');
  const track = carousel.querySelector('.carousel__track');
  const arrows = carousel.querySelectorAll('.carousel__arrow');

  // One card plus the gap between cards
  const step = () => track.firstElementChild.offsetWidth + parseFloat(getComputedStyle(track).columnGap);

  function update() {
    // RTL: scrollLeft runs from 0 (start, right edge) down to -max
    const max = track.scrollWidth - track.clientWidth;
    const pos = Math.abs(track.scrollLeft);
    arrows.forEach((btn) => {
      btn.disabled = btn.dataset.dir === '1' ? pos <= 1 : pos >= max - 1;
    });
  }

  arrows.forEach((btn) => {
    btn.addEventListener('click', () => {
      track.scrollBy({ left: Number(btn.dataset.dir) * step() });
    });
  });

  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
