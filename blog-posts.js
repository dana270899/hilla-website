// The blog's posts, oldest first. Add each new post at the end of this list
// (and a card for it in the home page's blog section): the previous / next
// links at the bottom of every post are filled from here.
var BLOG_POSTS = [
  { href: "blog-dira-mekablan.html", title: "קונים דירה מקבלן? 5 סעיפים קריטיים שחייבים לבדוק לפני שחותמים" },
  { href: "blog-mechira-verechisha-bemakbil.html", title: "מוכרים וקונים דירה במקביל: איך מתאמים לוחות זמנים ותשלומים בלי ליפול בין הכיסאות?" },
  { href: "blog-michraz-yazamim.html", title: "התחדשות עירונית בבניין: איך יוצאים למכרז יזמים נכון – שלב אחר שלב לפני שחותמים על כלום" },
  { href: "blog-haskamot-dayarim.html", title: "מתארגנים להתחדשות עירונית בבניין: איך מגיעים להסכמות בין הדיירים ובוחרים יזם בלי מלחמות שכנים?" },
  { href: "blog-acharei-tama-38.html", title: "אחרי ביטול תמ\"א 38: איך מקדמים היום התחדשות עירונית בבניין או במתחם בצורה בטוחה?" },
  { href: "blog-schirut-iskit.html", title: "חוזה שכירות עסקית: למה הוא שונה לגמרי משכירות דירה – ומה חייבים לעגן בו מראש?" },
  { href: "blog-rishum-bait-meshutaf.html", title: "למה רישום בית משותף או פרצלציה זה לא רק \"בירוקרטיה בסוף\" – ואיך זה משפיע על שווי הנכס?" },
  { href: "blog-gishur.html", title: "סכסוך נדל\"ני או עסקי: מתי גישור חוסך שנים של בתי משפט – ואיך נראה תהליך שמגיע להסכמה?" }
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
