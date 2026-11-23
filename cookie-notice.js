// Cookie notice: a small, non-blocking card that tells visitors the site uses
// analytics cookies and links to privacy.html. Israeli law needs disclosure, not
// opt-in consent, so there's only a "got it" button. Dismissal is remembered in
// localStorage; if storage is blocked the card simply shows again next visit.
(function () {
  var KEY = 'cookieNotice';
  try { if (localStorage.getItem(KEY) === 'seen') return; } catch (e) {}

  var box = document.createElement('section');
  box.className = 'cookie-notice';
  box.setAttribute('aria-label', 'הודעה על שימוש בעוגיות');
  box.innerHTML =
    '<p class="cookie-notice__text">האתר משתמש בעוגיות (Cookies) לניתוח שימוש, כדי לשפר את חוויית הגלישה. ' +
    '<a href="privacy.html">למדיניות הפרטיות</a></p>' +
    '<button type="button" class="cookie-notice__ok">הבנתי</button>';

  // Right after the skip link, so keyboard and screen-reader users meet it early
  var skip = document.querySelector('.skip-link');
  if (skip) skip.after(box); else document.body.prepend(box);

  box.querySelector('.cookie-notice__ok').addEventListener('click', function () {
    try { localStorage.setItem(KEY, 'seen'); } catch (e) {}
    box.remove();
    // Don't strand keyboard focus on a removed element
    var main = document.getElementById('main');
    if (main) main.focus({ preventScroll: true });
  });
})();
