// Colour theme switch: "turquoise" (default) or "blue". The choice is a data-theme
// attribute on <html>, remembered in localStorage (a small inline script in <head>
// re-applies it before first paint).
(function () {
  const root = document.documentElement;
  const buttons = document.querySelectorAll('[data-theme-set]');

  function apply(theme) {
    if (theme !== 'blue') theme = 'turquoise';
    // Swap colours in one step: no element fades between the two themes
    root.classList.add('theme-switching');
    if (theme === 'blue') root.dataset.theme = 'blue';
    else delete root.dataset.theme;
    void root.offsetWidth;
    setTimeout(() => root.classList.remove('theme-switching'), 50);
    buttons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.themeSet === theme));
    });
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  buttons.forEach((btn) => btn.addEventListener('click', () => apply(btn.dataset.themeSet)));
  apply(root.dataset.theme);
})();
