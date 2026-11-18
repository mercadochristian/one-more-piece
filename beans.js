/* Beans uses the existing v2 sprite art. It never reads puzzle answers or clues. */
(function () {
  'use strict';
  const home = document.getElementById('beans-home');
  const traveller = document.getElementById('beans');
  const actor = traveller.querySelector('.beans-actor');
  const sprite = traveller.querySelector('.beans-sprite');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const motionToggle = document.getElementById('beans-motion');
  const canMove = () => !reduce.matches && motionToggle.checked;
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const poses = {
    idle: [0, [280, 110, 110, 140, 140, 320]],
    right: [1, [120, 120, 120, 120, 120, 120, 120, 220]],
    left: [2, [120, 120, 120, 120, 120, 120, 120, 220]],
    wave: [3, [140, 140, 140, 280]],
    jump: [4, [140, 140, 140, 140, 280]],
    failed: [5, [140, 140, 140, 140, 140, 140, 140, 240]],
    waiting: [6, [150, 150, 150, 150, 150, 260]],
    review: [8, [150, 150, 150, 150, 150, 280]]
  };
  let host = home, side = 'left', frames = null, movement = null, sequence = 0;
  let idleTimer = null, reactionTimer = null, heldUntil = 0, priority = 0;
  const position = () => host === home ? (side === 'left' ? 0 : Math.max(0, home.clientWidth - 84)) : Math.max(0, (host.clientWidth - 84) / 2);
  function syncHost() {
    const dialogs = [...document.querySelectorAll('dialog[open]')];
    const next = dialogs.at(-1)?.querySelector('.beans-dialog-dock') || home;
    if (host !== next) {
      cancelMovement(); host = next; host.append(traveller);
    }
    traveller.style.left = `${position()}px`;
  }
  function pose(name) {
    frames?.cancel(); frames = null;
    traveller.dataset.pose = name;
    const [row, durations] = poses[name];
    const stillColumn = !canMove() ? ({ failed: 4, jump: 3, wave: 1, review: 3 }[name] || 0) : 0;
    sprite.style.backgroundPosition = `${stillColumn / 7 * 100}% ${row / 10 * 100}%`;
    if (!canMove() || document.hidden) return;
    let elapsed = 0;
    const total = durations.reduce((a, b) => a + b, 0);
    const keys = durations.map((duration, column) => {
      const key = { backgroundPosition: `${column / 7 * 100}% ${row / 10 * 100}%`, offset: elapsed / total, easing: 'steps(1, end)' };
      elapsed += duration; return key;
    });
    keys.push({ backgroundPosition: `0% ${row / 10 * 100}%`, offset: 1 });
    frames = sprite.animate(keys, { duration: total, iterations: Infinity });
  }
  function cancelMovement() {
    sequence++; movement?.cancel(); movement = null;
    traveller.dataset.phase = 'idle';
  }
  function schedule() {
    clearTimeout(idleTimer);
    if (canMove() && !document.hidden) idleTimer = setTimeout(wander, 7000 + Math.random() * 4000);
  }
  async function travel() {
    syncHost();
    if (host !== home || !canMove() || document.hidden || Date.now() < heldUntil) { schedule(); return; }
    cancelMovement(); const token = sequence;
    traveller.dataset.phase = 'digging'; pose('review');
    try {
      movement = actor.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: 'translateY(68px) rotate(12deg)', opacity: 0 }
      ], { duration: 250, easing: ease, fill: 'both' });
      await movement.finished;
      if (token !== sequence) return;
      // Only move horizontally while completely beneath the clipped surface.
      side = side === 'left' ? 'right' : 'left';
      traveller.style.left = `${position()}px`;
      traveller.dataset.phase = 'surfacing'; movement.cancel(); pose('wave');
      movement = actor.animate([
        { transform: 'translateY(68px) rotate(-12deg)', opacity: 0 },
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 }
      ], { duration: 250, easing: ease, fill: 'both' });
      await movement.finished;
      if (token !== sequence) return;
      movement.cancel(); movement = null; traveller.dataset.phase = 'idle'; pose('idle');
    } catch (_) { /* A click, resize or motion preference can safely interrupt digging. */ }
    schedule();
  }
  async function wander() {
    syncHost();
    if (host !== home || !canMove() || document.hidden || Date.now() < heldUntil) { schedule(); return; }
    if (Math.random() < 0.6) { travel(); return; }
    cancelMovement(); const token = sequence;
    pose(side === 'left' ? 'right' : 'left');
    const distance = side === 'left' ? 8 : -8;
    try {
      movement = actor.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${distance}px)` }, { transform: 'translateX(0)' }], { duration: 1000, easing: 'linear' });
      await movement.finished;
      if (token === sequence) { movement = null; pose('idle'); }
    } catch (_) { /* Reactions take precedence over wandering. */ }
    schedule();
  }
  function react(kind = 'click') {
    syncHost();
    const reactions = { click: ['wave', 1, 600], select: ['jump', 2, 700], submit: ['waiting', 3, 900], review: ['review', 2, 800], win: ['jump', 5, 1800], fail: ['failed', 4, 1600], new: ['wave', 2, 800] };
    const [name, importance, duration] = reactions[kind] || reactions.click;
    if (kind !== 'new' && importance < priority && Date.now() < heldUntil) return;
    cancelMovement(); clearTimeout(reactionTimer);
    priority = importance; heldUntil = Date.now() + duration; pose(name);
    reactionTimer = setTimeout(() => { priority = 0; syncHost(); pose('idle'); schedule(); }, duration);
    schedule();
  }
  document.addEventListener('click', () => react('click'));
  document.addEventListener('change', () => react('click'));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', () => { syncHost(); react('click'); }));
  window.addEventListener('resize', () => { cancelMovement(); syncHost(); pose('idle'); schedule(); });
  function motionChanged() { cancelMovement(); clearTimeout(reactionTimer); heldUntil = 0; priority = 0; syncHost(); pose('idle'); schedule(); }
  reduce.addEventListener('change', motionChanged);
  motionToggle.addEventListener('change', motionChanged);
  document.addEventListener('visibilitychange', motionChanged);
  window.Beans = Object.freeze({ react, travel });
  syncHost(); pose('idle'); schedule();
})();
