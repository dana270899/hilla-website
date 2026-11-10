// Accessibility toolbar: text size, high contrast, link highlighting, stop motion,
// readable font. Settings are classes on <html> and are remembered in localStorage
// (a small inline script in <head> re-applies them before first paint).
(function () {
  const root = document.documentElement;
  const toggle = document.getElementById('a11y-toggle');
  const panel = document.getElementById('a11y-panel');
  if (!toggle || !panel) return;

  const flagButtons = panel.querySelectorAll('[data-a11y]');
  const textButtons = panel.querySelectorAll('[data-a11y-text]');
  const resetButton = panel.querySelector('[data-a11y-reset]');
  const textStatus = document.getElementById('a11y-text-status');
  const TEXT_LABELS = ['רגיל', 'גדול', 'גדול מאוד'];
  const MAX_TEXT = 2;

  let state = { text: 0, flags: [] };
  try {
    const saved = JSON.parse(localStorage.getItem('a11y') || '{}');
    state.text = Math.min(Math.max(Number(saved.text) || 0, 0), MAX_TEXT);
    state.flags = Array.isArray(saved.flags) ? saved.flags : [];
  } catch (e) {}

  function apply() {
    root.classList.remove('a11y-text-1', 'a11y-text-2');
    if (state.text > 0) root.classList.add('a11y-text-' + state.text);

    flagButtons.forEach((btn) => {
      const on = state.flags.includes(btn.dataset.a11y);
      root.classList.toggle('a11y-' + btn.dataset.a11y, on);
      btn.setAttribute('aria-pressed', String(on));
    });

    textButtons.forEach((btn) => {
      const next = state.text + Number(btn.dataset.a11yText);
      btn.disabled = next < 0 || next > MAX_TEXT;
    });
    textStatus.textContent = 'גודל טקסט: ' + TEXT_LABELS[state.text];

    try { localStorage.setItem('a11y', JSON.stringify(state)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('a11y:change'));
  }

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', () => {
    const open = panel.hidden;
    setOpen(open);
    if (open) panel.querySelector('button:not(:disabled)').focus();
  });

  // Esc closes the panel and returns focus to its button
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Clicking outside closes it (focus is never trapped inside)
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });

  textButtons.forEach((btn) => btn.addEventListener('click', () => {
    state.text = Math.min(Math.max(state.text + Number(btn.dataset.a11yText), 0), MAX_TEXT);
    apply();
    // Keep focus inside the panel if the pressed button just became disabled
    if (btn.disabled) panel.querySelector('[data-a11y-text]:not(:disabled)').focus();
  }));

  flagButtons.forEach((btn) => btn.addEventListener('click', () => {
    const flag = btn.dataset.a11y;
    state.flags = state.flags.includes(flag)
      ? state.flags.filter((f) => f !== flag)
      : [...state.flags, flag];
    apply();
  }));

  resetButton.addEventListener('click', () => {
    state = { text: 0, flags: [] };
    apply();
  });

  apply();
})();
