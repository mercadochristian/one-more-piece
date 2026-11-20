(function (root) {
  'use strict';
  const colors = ['Coral', 'Blue', 'Gold', 'Jade'];
  const shapes = ['Circle', 'Triangle', 'Square', 'Diamond'];
  function shuffle(items, random = Math.random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function combinations(board) {
    const out = [];
    for (let a = 0; a < board.length - 3; a++)
      for (let b = a + 1; b < board.length - 2; b++)
        for (let c = b + 1; c < board.length - 1; c++)
          for (let d = c + 1; d < board.length; d++) out.push([board[a], board[b], board[c], board[d]]);
    return out;
  }
  const sum = cards => cards.reduce((total, card) => total + card.number, 0);
  const distinct = (cards, key) => new Set(cards.map(card => card[key])).size;
  const sorted = cards => [...cards].sort((a, b) => a.number - b.number);
  function makeClues(answer, board, random) {
    const pool = [];
    function add(text, test, explain, family) { pool.push({ text, test, explain, family }); }
    const total = sum(answer);
    add(`The four numbers add up to ${total}.`, c => sum(c) === total,
      c => `${c.map(x => x.number).join(' + ')} = ${sum(c)}.`, 'sum');
    for (const [key, noun] of [['color', 'colors'], ['shape', 'symbols']]) {
      const count = distinct(answer, key);
      add(`The four cards contain exactly ${count} different ${noun}.`, c => distinct(c, key) === count,
        c => `${[...new Set(c.map(x => x[key]))].join(', ')}: ${distinct(c, key)} different ${noun}.`, key);
    }
    const odds = answer.filter(c => c.number % 2).length;
    add(`Exactly ${odds} of the four numbers ${odds === 1 ? 'is' : 'are'} odd.`, c => c.filter(x => x.number % 2).length === odds,
      c => `Odd numbers: ${c.filter(x => x.number % 2).map(x => x.number).join(', ') || 'none'}.`, 'parity');
    const range = sorted(answer)[3].number - sorted(answer)[0].number;
    add(`The largest and smallest numbers differ by ${range}.`, c => sorted(c)[3].number - sorted(c)[0].number === range,
      c => `${sorted(c)[3].number} − ${sorted(c)[0].number} = ${range}.`, 'range');
    const ends = sorted(answer)[0].number + sorted(answer)[3].number;
    add(`The smallest and largest numbers add up to ${ends}.`, c => sorted(c)[0].number + sorted(c)[3].number === ends,
      c => `${sorted(c)[0].number} + ${sorted(c)[3].number} = ${ends}.`, 'range');
    const ordinals = ['first', 'second', 'third', 'fourth'];
    for (let a = 0; a < 4; a++) {
      for (let b = a + 1; b < 4; b++) {
        const x = answer[a].number, y = answer[b].number;
        const difference = Math.abs(x - y), pairSum = x + y;
        const pair = `${ordinals[a]} and ${ordinals[b]} cards`;
        add(`The numbers on the ${pair} differ by ${difference}.`, c => Math.abs(c[a].number - c[b].number) === difference,
          c => `Cards ${c[a].letter} and ${c[b].letter}: |${c[a].number} − ${c[b].number}| = ${difference}.`, 'position');
        add(`The numbers on the ${pair} add up to ${pairSum}.`, c => c[a].number + c[b].number === pairSum,
          c => `${c[a].letter} + ${c[b].letter}: ${c[a].number} + ${c[b].number} = ${pairSum}.`, 'position');
        const bound = Math.ceil((x * y) / 20) * 20;
        add(`The product of the numbers on the ${pair} is at most ${bound}.`, c => c[a].number * c[b].number <= bound,
          c => `${c[a].letter} × ${c[b].letter}: ${c[a].number} × ${c[b].number} = ${c[a].number * c[b].number} ≤ ${bound}.`, 'product');
      }
      for (const key of ['color', 'shape']) {
        const rankCard = sorted(answer)[a];
        const noun = key === 'color' ? 'color' : 'symbol';
        const rank = ['smallest', 'second-smallest', 'third-smallest', 'largest'][a];
        const count = board.filter(c => c[key] === rankCard[key]).length;
        add(`The ${noun} of the ${rank} number appears on exactly ${count} cards across the whole board.`,
          c => board.filter(x => x[key] === sorted(c)[a][key]).length === count,
          c => `${sorted(c)[a].letter} (${sorted(c)[a].number}) has ${sorted(c)[a][key]}; it appears ${count} times on the board.`, 'frequency');
      }
    }
    for (const rank of [0, 1, 2, 3]) {
      const name = ['smallest', 'second-smallest', 'third-smallest', 'largest'][rank];
      const value = sorted(answer)[rank].number;
      add(`The ${name} number is ${value}.`, c => sorted(c)[rank].number === value,
        () => `The ${name} number is ${value}.`, 'anchor');
    }
    for (const [a, b, x, y] of [[0, 1, 2, 3], [0, 2, 1, 3], [0, 3, 1, 2]]) {
      const sameColor = c => c[a].color === c[b].color;
      const sameShape = c => c[x].shape === c[y].shape;
      const equal = sameColor(answer) === sameShape(answer);
      const first = `the ${ordinals[a]} and ${ordinals[b]} cards share a color`;
      const second = `the ${ordinals[x]} and ${ordinals[y]} cards share a symbol`;
      add(`${equal ? 'Both statements are true or both are false' : 'Exactly one statement is true'}: ${first}; ${second}.`,
        c => (sameColor(c) === sameShape(c)) === equal,
        c => `${first}: ${sameColor(c) ? 'true' : 'false'}; ${second}: ${sameShape(c) ? 'true' : 'false'}.`, 'logic');
    }
    return shuffle(pool, random);
  }
  const difficulties = {
    easy: { label: 'Easy', description: 'Direct clues and simple arithmetic.', required: ['anchor'], excluded: ['frequency', 'product', 'logic'], target: 3 },
    medium: { label: 'Medium', description: 'Arithmetic and card-position relationships.', required: ['position'], excluded: ['anchor', 'frequency', 'product', 'logic'], target: 4 },
    hard: { label: 'Hard', description: 'Whole-board counting and product clues.', required: ['frequency', 'product'], excluded: ['anchor', 'logic'], target: 5 },
    advanced: { label: 'Advanced', description: 'Linked logic, counting and arithmetic.', required: ['logic', 'logic', 'frequency'], excluded: ['anchor'], target: 6 }
  };
  function generate(random = Math.random, difficulty = 'medium') {
    const profile = difficulties[difficulty];
    if (!profile) throw new Error('Unknown difficulty. Choose Easy, Medium, Hard or Advanced.');
    for (let attempt = 0; attempt < 40; attempt++) {
      const numbers = shuffle(Array.from({ length: 26 }, (_, i) => i + 1), random);
      // Unequal frequencies make whole-board counting clues meaningful.
      const colorBag = shuffle(Array.from({ length: 26 }, (_, i) => colors[i < 9 ? 0 : i < 16 ? 1 : i < 22 ? 2 : 3]), random);
      const shapeBag = shuffle(Array.from({ length: 26 }, (_, i) => shapes[i < 8 ? 0 : i < 15 ? 1 : i < 21 ? 2 : 3]), random);
      const board = numbers.map((number, i) => ({ letter: String.fromCharCode(65 + i), number, color: colorBag[i], shape: shapeBag[i] }));
      const answer = shuffle(board, random).slice(0, 4).sort((a, b) => a.letter.localeCompare(b.letter));
      const pool = makeClues(answer, board, random).filter(c => !profile.excluded.includes(c.family));
      let remaining = combinations(board);
      const clues = [], families = new Set();
      // Required families make the levels structurally different.
      for (const family of profile.required) {
        const clue = pool.find(c => c.family === family && !clues.includes(c) && remaining.some(cards => !c.test(cards)));
        if (clue) { clues.push(clue); families.add(family); remaining = remaining.filter(clue.test); }
      }
      if (clues.length !== profile.required.length) continue;
      // Fill the remaining starter slots with unused clue families to avoid repeated pair equations.
      for (const clue of pool) {
        if (clues.length >= 4) break;
        if (families.has(clue.family)) continue;
        const next = remaining.filter(clue.test);
        if (next.length === remaining.length) continue;
        clues.push(clue); families.add(clue.family); remaining = next;
      }
      while (remaining.length > 1 && clues.length < 7) {
        const options = pool.filter(c => !clues.includes(c)).map(clue => ({ clue, next: remaining.filter(clue.test) }))
          .filter(option => option.next.length > 0 && option.next.length < remaining.length);
        if (!options.length) break;
        // Prefer a gradual narrowing rather than one trivially decisive clue.
        const target = Math.max(1, Math.floor(remaining.length / profile.target));
        options.sort((a, b) => Math.abs(a.next.length - target) - Math.abs(b.next.length - target));
        const chosen = options[0]; clues.push(chosen.clue); remaining = chosen.next;
      }
      if (remaining.length === 1 && clues.length >= 4) return { difficulty, board, clues: shuffle(clues, random), answer: answer.map(c => c.letter).join('') };
    }
    throw new Error('Could not create a unique puzzle. Please try again.');
  }
  function check(puzzle, letters) {
    const code = letters.toUpperCase();
    if (!/^[A-Z]{4}$/.test(code) || new Set(code).size !== 4) return false;
    const cards = [...code].sort().map(letter => puzzle.board.find(card => card.letter === letter));
    return cards.every(Boolean) && puzzle.clues.every(clue => clue.test(cards));
  }
  const api = { colors, shapes, difficulties, combinations, generate, check };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SecretCode = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
