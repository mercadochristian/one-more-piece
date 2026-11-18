(function () {
  'use strict';
  const dialog = document.getElementById('about-dialog');
  document.getElementById('about-button').addEventListener('click', () => {
    dialog.showModal();
    document.getElementById('about-title').focus({ preventScroll: true });
    dialog.scrollTop = 0;
    Beans.react('review');
  });
  document.getElementById('about-close').addEventListener('click', () => dialog.close());
})();
