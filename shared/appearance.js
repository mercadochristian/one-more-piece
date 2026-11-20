/* Beans appearance and input mode, with System as the first-visit default. */
(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  let choice = 'system';
  function readChoice() {
    try {
      const saved = localStorage.getItem('omp-appearance');
      choice = ['system', 'light', 'dark'].includes(saved) ? saved : 'system';
    } catch (_) { /* Keep the current choice when browser storage is unavailable. */ }
  }
  readChoice();
  function syncAppearance() {
    const dark = choice === 'dark' || (choice === 'system' && preference.matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    document.querySelectorAll('[data-appearance]').forEach(select => { select.value = choice; });
    const chrome = document.querySelector('meta[name="theme-color"]');
    if (chrome) chrome.content = dark ? '#171a20' : '#f6f7f9';
  }
  syncAppearance();
  preference.addEventListener('change', syncAppearance);
  window.addEventListener('pageshow', event => {
    if (event.persisted) { readChoice(); syncAppearance(); }
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-appearance]').forEach(select => {
      select.value = choice;
      select.addEventListener('change', () => {
        choice = select.value;
        try { localStorage.setItem('omp-appearance', choice); } catch (_) {}
        syncAppearance();
      });
    });
    syncAppearance();
  }, { once: true });
  document.addEventListener('keydown', () => { root.dataset.input = 'keyboard'; });
  document.addEventListener('pointerdown', () => { root.dataset.input = 'pointer'; });
  document.addEventListener('pointermove', () => { root.dataset.input = 'pointer'; }, { passive: true });
})();
