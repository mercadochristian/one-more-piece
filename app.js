(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let puzzle, selected = new Set(), ended = false, puzzleNumber = 0;
  let strict = false, buzzer = false, deadline = null, interval = null, pendingAction = null;
  let soundEnabled = true, audio = null, audioMaster = null, startedAt = Date.now();
  function sound(kind) {
    if (!soundEnabled) return;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audio ||= new Context();
      if (!audioMaster) { audioMaster = audio.createGain(); audioMaster.connect(audio.destination); }
      audioMaster.gain.setValueAtTime(soundEnabled ? 1 : 0, audio.currentTime);
      const notes = { select: [440], deselect: [330], wrong: [220, 164.81], buzz: [523, 659], timeout: [220, 165], win: [523.25, 659.25, 783.99, 1046.5] }[kind] || [];
      const success = kind === 'win', failure = kind === 'wrong' || kind === 'timeout';
      const spacing = success ? 0.12 : failure ? 0.16 : 0.09;
      const duration = success ? 0.32 : failure ? 0.24 : 0.15;
      const volume = success ? 0.12 : failure ? 0.08 : 0.045;
      const play = () => { if (!soundEnabled) return; notes.forEach((frequency, i) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        const at = audio.currentTime + i * spacing;
        oscillator.type = success || failure ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, at + duration - 0.01);
        oscillator.connect(gain); gain.connect(audioMaster);
        oscillator.start(at); oscillator.stop(at + duration);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      }); };
      if (audio.state === 'suspended') audio.resume().then(play).catch(() => {}); else play();
    } catch (_) { /* Audio is optional; unavailable audio never blocks a game. */ }
  }
  function celebrate() {
    $('win-code').replaceChildren(...[...puzzle.answer].map(letter => {
      const slot = document.createElement('span'); slot.textContent = letter; return slot;
    }));
    const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    $('win-level').textContent = SecretCode.difficulties[puzzle.difficulty].label;
    $('win-time').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    $('win-clues').textContent = String(puzzle.clues.length);
    $('win-dialog').showModal(); $('win-again').focus(); sound('win'); Beans.react('win');
  }
  const symbolPaths = {
    Circle: '<circle cx="10" cy="10" r="7"/>',
    Triangle: '<path d="M10 2 18 17H2Z"/>',
    Square: '<rect x="3" y="3" width="14" height="14"/>',
    Diamond: '<path d="m10 1 9 9-9 9-9-9Z"/>'
  };
  function tell(message, kind = '') {
    $('feedback').textContent = message;
    $('feedback').dataset.kind = kind;
  }
  function stopTimer() {
    clearInterval(interval); interval = null; deadline = null;
    $('countdown').textContent = '';
  }
  function updateSelection() {
    const code = [...selected].sort();
    $('answer-slots').replaceChildren(...Array.from({ length: 4 }, (_, i) => {
      const slot = document.createElement('span');
      const letter = code[i];
      slot.className = `slot${letter ? '' : ' empty'}`;
      slot.textContent = letter || '—';
      return slot;
    }));
    $('answer-slots').setAttribute('aria-label', `Selected code: ${code.join(', ') || 'empty'}`);
    $('selection-count').textContent = `${code.length} of 4 selected · A–Z order`;
    document.querySelectorAll('.card').forEach(card => {
      card.setAttribute('aria-pressed', String(selected.has(card.dataset.letter)));
      card.disabled = ended;
    });
    $('submit').disabled = ended || ((!buzzer || deadline !== null) && code.length !== 4);
    $('submit').textContent = buzzer && deadline === null ? 'Buzz in · 10 seconds' : 'Submit code →';
    $('clear').disabled = ended || selected.size === 0;
  }
  function finish(message, kind) {
    ended = true; stopTimer(); updateSelection(); tell(message, kind);
  }
  function reveal(solved) {
    if (!ended) finish('Puzzle revealed. Try a fresh one whenever you’re ready.', '');
    $('solution').hidden = false;
    $('solution-title').textContent = solved ? `Code cracked: ${puzzle.answer}` : `The code was ${puzzle.answer}`;
    const answerCards = [...puzzle.answer].map(letter => puzzle.board.find(card => card.letter === letter));
    $('explanation').replaceChildren(...puzzle.clues.map(clue => {
      const row = document.createElement('li'), title = document.createElement('strong');
      title.textContent = clue.text;
      row.append(title, document.createElement('br'), document.createTextNode(clue.explain(answerCards)));
      return row;
    }));
    document.querySelectorAll('.card').forEach(card => card.classList.toggle('answer-card', puzzle.answer.includes(card.dataset.letter)));
    $('give-up').disabled = true;
    $('next-game').focus({ preventScroll: true });
  }
  function showWrong() {
    $('wrong-title').textContent = ended ? 'Attempt used.' : 'Not quite.';
    $('wrong-copy').textContent = ended
      ? 'That code does not satisfy every clue. This puzzle is locked. Start a fresh one, or return to reveal the answer.'
      : 'That code does not satisfy every clue. Take another look and give it another try. The answer is still hidden.';
    $('wrong-primary').textContent = ended ? 'New puzzle' : 'Try again';
    $('wrong-review').textContent = ended ? 'Back to puzzle' : 'Review clues';
    $('wrong-dialog').showModal(); $('wrong-primary').focus(); Beans.react('fail');
  }
  function dismissWrong(reviewClues = false) {
    $('wrong-dialog').close();
    if (ended) $('give-up').focus({ preventScroll: true });
    else if (reviewClues) {
      $('clues').scrollIntoView({ block: 'start' });
      $('clues').querySelector('input').focus({ preventScroll: true });
    } else $('board').querySelector('button').focus({ preventScroll: true });
  }
  function toggle(letter) {
    if (ended || checkTimeout()) return;
    Beans.react('select');
    if (selected.has(letter)) { selected.delete(letter); sound('deselect'); }
    else if (selected.size < 4) { selected.add(letter); sound('select'); }
    else { tell('Four cards are selected. Deselect one before choosing another.'); return; }
    updateSelection();
    tell(deadline ? 'Buzzer running. Submit your code before time runs out.' : 'Your selection is private. Submit when you’re ready.');
  }
  function checkTimeout() {
    if (deadline !== null && Date.now() >= deadline) {
      sound('timeout'); Beans.react('fail');
      finish('Time’s up. This puzzle is locked. Reveal the answer or start a new puzzle.', 'error');
      $('give-up').focus({ preventScroll: true }); return true;
    }
    return false;
  }
  function tick() {
    if (checkTimeout() || deadline === null) return;
    $('countdown').textContent = `${Math.ceil((deadline - Date.now()) / 1000)}s`;
  }
  function submit() {
    if (ended || checkTimeout()) return;
    Beans.react('submit');
    if (buzzer && deadline === null) {
      sound('buzz');
      deadline = Date.now() + 10000; interval = setInterval(tick, 200);
      updateSelection(); tick();
      tell('Buzzer started. You have 10 seconds to select four cards and submit.');
      return;
    }
    if (selected.size !== 4) return;
    if (SecretCode.check(puzzle, [...selected].join(''))) {
      finish('Correct. Every condition is satisfied. Well played.', 'success'); reveal(true); celebrate();
    } else if (strict || buzzer) {
      sound('wrong');
      finish('Incorrect. This puzzle is locked. Reveal the answer or try a fresh puzzle.', 'error');
      showWrong();
    } else {
      sound('wrong');
      tell('That code doesn’t satisfy every condition. You can keep trying; the solution is still hidden.', 'error');
      showWrong();
    }
  }
  function newGame(difficulty = document.querySelector('input[name="difficulty"]:checked').value) {
    let candidate;
    try { candidate = SecretCode.generate(Math.random, difficulty); }
    catch (error) { tell(error.message, 'error'); return false; }
    stopTimer();
    puzzle = candidate;
    document.querySelector(`input[name="difficulty"][value="${puzzle.difficulty}"]`).checked = true;
    if ($('win-dialog').open) $('win-dialog').close();
    if ($('wrong-dialog').open) $('wrong-dialog').close();
    startedAt = Date.now();
    puzzleNumber++; selected = new Set(); ended = false;
    strict = $('strict').checked; buzzer = $('buzzer-mode').checked;
    $('puzzle-label').textContent = `Puzzle ${String(puzzleNumber).padStart(2, '0')} · ${SecretCode.difficulties[puzzle.difficulty].label}`;
    $('solution').hidden = true; $('explanation').replaceChildren(); $('solution-title').textContent = '';
    $('give-up').disabled = false;
    $('board').replaceChildren(...puzzle.board.map(card => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'card';
      button.dataset.letter = card.letter; button.dataset.color = card.color;
      button.setAttribute('aria-label', `${card.letter}, ${card.number}, ${card.color}, ${card.shape}`);
      button.innerHTML = `<span class="card-top"><span class="card-letter">${card.letter}</span><svg viewBox="0 0 20 20" aria-hidden="true">${symbolPaths[card.shape]}</svg></span><span class="card-number">${card.number}</span><span class="card-color">${card.color}</span>`;
      button.addEventListener('click', () => toggle(card.letter));
      return button;
    }));
    $('clues').replaceChildren(...puzzle.clues.map((clue, i) => {
      const li = document.createElement('li'), label = document.createElement('label');
      const input = document.createElement('input'), text = document.createElement('span');
      input.type = 'checkbox'; input.id = `clue-${i}`; text.textContent = clue.text;
      label.append(input, text); li.append(label); return li;
    }));
    $('clue-count').textContent = `${puzzle.clues.length} clues`;
    updateSelection();
    tell(`Take your time.${strict ? ' One attempt only.' : ' Retries allowed.'}${buzzer ? ' Buzz when ready; then submit within 10 seconds.' : ' Your answer stays hidden until you solve it or give up.'}`);
    Beans.react('new');
    return true;
  }
  function confirm(title, copy, actionLabel, action) {
    pendingAction = action;
    $('confirm-title').textContent = title; $('confirm-copy').textContent = copy;
    $('confirm-ok').textContent = actionLabel;
    $('confirm-dialog').showModal(); $('confirm-cancel').focus(); Beans.react('review');
  }
  $('wrong-primary').addEventListener('click', () => {
    if (ended) { if (newGame()) $('board').querySelector('button').focus(); }
    else dismissWrong();
  });
  $('wrong-review').addEventListener('click', () => dismissWrong(true));
  $('wrong-dialog').addEventListener('cancel', event => { event.preventDefault(); dismissWrong(); });
  $('sound-toggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (audioMaster) audioMaster.gain.setValueAtTime(soundEnabled ? 1 : 0, audio.currentTime);
    $('sound-toggle').textContent = soundEnabled ? 'Sound on' : 'Sound off';
    $('sound-toggle').setAttribute('aria-pressed', String(soundEnabled));
    if (soundEnabled) sound('select');
  });
  $('win-again').addEventListener('click', () => { newGame(); $('board').querySelector('button').focus(); });
  function reviewWin() { $('win-dialog').close(); $('solution').scrollIntoView({ block: 'start' }); $('next-game').focus({ preventScroll: true }); }
  $('win-review').addEventListener('click', reviewWin);
  $('win-dialog').addEventListener('cancel', event => { event.preventDefault(); reviewWin(); });
  $('submit').addEventListener('click', submit);
  $('clear').addEventListener('click', () => {
    if (ended || checkTimeout()) return;
    selected.clear(); updateSelection(); tell('Selection cleared. Your clues are unchanged.');
  });
  $('back-library').addEventListener('click', event => {
    if (ended || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const destination = event.currentTarget.href;
    confirm('Back to library?', 'Leaving clears your current selection and notes. A fresh puzzle starts when you return.',
      'Back to library', () => window.location.assign(destination));
  });
  $('new-game').addEventListener('click', () => {
    if (ended) { newGame(); return; }
    confirm('Start a fresh puzzle?', 'This replaces your current board and notes. Its answer will stay hidden.', 'New puzzle', newGame);
  });
  $('next-game').addEventListener('click', () => { newGame(); $('board').querySelector('button').focus(); });
  $('give-up').addEventListener('click', () => confirm('Reveal the code?', 'This ends the current puzzle and explains how the four cards satisfy every clue.', 'Reveal code', () => reveal(false)));
  $('confirm-ok').addEventListener('click', () => { const action = pendingAction; pendingAction = null; $('confirm-dialog').close(); action?.(); });
  $('confirm-cancel').addEventListener('click', () => { pendingAction = null; $('confirm-dialog').close(); });
  $('confirm-dialog').addEventListener('cancel', () => { pendingAction = null; });
  $('help-button').addEventListener('click', () => { $('help-dialog').showModal(); $('help-title').focus({ preventScroll: true }); $('help-dialog').scrollTop = 0; Beans.react('review'); });
  $('help-close').addEventListener('click', () => $('help-dialog').close());
  $('settings-button').addEventListener('click', () => { $('settings-dialog').showModal(); $('settings-title').focus({ preventScroll: true }); $('settings-dialog').scrollTop = 0; Beans.react('review'); });
  $('settings-close').addEventListener('click', () => $('settings-dialog').close());
  for (const id of ['strict', 'buzzer-mode']) $(id).addEventListener('change', () => {
    $('settings-feedback').textContent = 'Updated for your next puzzle.';
    tell('Settings updated for your next puzzle. Start a new puzzle to apply them.');
  });
  $('difficulty').addEventListener('change', event => {
    const requested = event.target.value;
    if (!SecretCode.difficulties[requested] || requested === puzzle.difficulty) return;
    // Keep the current choice authoritative until the replacement is confirmed.
    document.querySelector(`input[name="difficulty"][value="${puzzle.difficulty}"]`).checked = true;
    confirm(`Switch to ${SecretCode.difficulties[requested].label}?`,
      'This starts a new puzzle and clears your current selection and clue notes. Your current answer will stay hidden.',
      'Change difficulty', () => {
        if (newGame(requested)) $('board').querySelector('button').focus();
      });
  });
  document.addEventListener('visibilitychange', tick);
  const answerBar = document.querySelector('.answer-panel');
  function syncAnswerClearance() {
    const bottom = parseFloat(getComputedStyle(answerBar).bottom) || 0;
    const mainPadding = parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom) || 0;
    const clearance = Math.max(0, Math.ceil(answerBar.getBoundingClientRect().height + bottom + 12 - mainPadding));
    document.body.style.setProperty('--answer-clearance', `${clearance}px`);
  }
  new ResizeObserver(syncAnswerClearance).observe(answerBar);
  window.addEventListener('resize', syncAnswerClearance);
  newGame();
  syncAnswerClearance();
})();
