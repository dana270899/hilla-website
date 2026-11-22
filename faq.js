// FAQ accordion on blog posts: native <details>, with the open / close
// animated (height) instead of the browser's instant snap.
(function () {
  var EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  var still = function () {
    return matchMedia("(prefers-reduced-motion: reduce)").matches
      || document.documentElement.classList.contains("a11y-no-motion");
  };

  document.querySelectorAll(".faq__item").forEach(function (item) {
    var body = item.querySelector(".faq__a");
    item.querySelector(".faq__head").addEventListener("click", function (e) {
      if (still() || !body.animate) return; // native toggle
      e.preventDefault();
      if (item._anim) item._anim.cancel();
      var opening = !item.classList.contains("is-open");
      var from = item.open ? body.getBoundingClientRect().height : 0;
      item.open = true;
      var to = opening ? body.scrollHeight : 0;
      item.classList.toggle("is-open", opening);
      // The bottom padding shrinks with the height: a border-box answer can't
      // get shorter than its padding, so animating height alone stalled at 8px
      // and then the content below jumped when the item finally closed.
      var pad = parseFloat(getComputedStyle(body).paddingBottom);
      var frame = function (h) { return { height: h + "px", paddingBottom: Math.min(h, pad) + "px" }; };
      var anim = body.animate([frame(from), frame(to)], { duration: 350, easing: EASE });
      item._anim = anim;
      anim.finished.then(function () {
        item._anim = null;
        if (!opening) item.open = false;
      }, function () {});
    });
    // Keep the class in sync when opened another way (find-in-page, reduced motion)
    item.addEventListener("toggle", function () {
      if (!item._anim) item.classList.toggle("is-open", item.open);
    });
  });
})();
