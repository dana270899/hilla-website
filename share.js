// Share buttons on blog posts: build each link from the page address and title,
// and copy the address for the "copy link" button.
(function () {
  var url = location.href.split("#")[0];
  var title = document.querySelector(".post__title");
  // innerText keeps the title's <br> as a line break, which becomes a space here
  var text = title ? title.innerText.replace(/\s+/g, " ").trim() : document.title;
  var u = encodeURIComponent(url);
  var t = encodeURIComponent(text);

  var hrefs = {
    whatsapp: "https://wa.me/?text=" + t + "%20" + u,
    facebook: "https://www.facebook.com/sharer/sharer.php?u=" + u,
    // Opens LinkedIn's post box with the title and link already typed in
    linkedin: "https://www.linkedin.com/feed/?shareActive=true&text=" + t + "%20" + u,
    email: "mailto:?subject=" + t + "&body=" + u
  };

  document.querySelectorAll("[data-share]").forEach(function (el) {
    var key = el.getAttribute("data-share");
    if (hrefs[key]) el.href = hrefs[key];
  });

  var copy = document.querySelector('[data-share="copy"]');
  var status = document.querySelector(".share__status");
  if (!copy) return;

  copy.addEventListener("click", function () {
    var done = function () {
      status.textContent = "הקישור הועתק";
      setTimeout(function () { status.textContent = ""; }, 3000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { status.textContent = url; });
    } else {
      status.textContent = url;
    }
  });
})();
