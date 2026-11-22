// The blog's posts, oldest first. Add each new post at the end of this list
// (and a card for it in the home page's blog section): the previous / next
// links at the bottom of every post are filled from here.
var BLOG_POSTS = [
  { href: "blog-dira-mekablan.html", title: "קונים דירה מקבלן? 5 סעיפים קריטיים שחייבים לבדוק לפני שחותמים" }
];

(function () {
  var nav = document.querySelector(".post-nav");
  if (!nav) return;
  var here = location.pathname.split("/").pop() || "index.html";
  var i = BLOG_POSTS.findIndex(function (p) { return p.href === here; });
  if (i < 0) return;

  var shown = 0;
  [["prev", BLOG_POSTS[i - 1]], ["next", BLOG_POSTS[i + 1]]].forEach(function (pair) {
    var link = nav.querySelector('[data-post-nav="' + pair[0] + '"]');
    if (!pair[1]) {
      // Keep the empty side's slot so a lone "next" still sits on its own side
      link.replaceWith(document.createElement("span"));
      return;
    }
    link.href = pair[1].href;
    link.querySelector("[data-post-title]").textContent = pair[1].title;
    shown++;
  });
  if (shown) nav.hidden = false;
})();
