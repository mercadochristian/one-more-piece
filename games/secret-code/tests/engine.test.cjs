'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const game = require('../engine.js');
function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
test('120 fresh puzzles each have exactly one solution across all 14,950 combinations', () => {
  const signatures = new Set();
  for (let seed = 1; seed <= 120; seed++) {
    const puzzle = game.generate(seeded(seed));
    assert.equal(puzzle.board.length, 26);
    assert.equal(new Set(puzzle.board.map(c => c.letter)).size, 26);
    assert.equal(new Set(puzzle.board.map(c => c.number)).size, 26);
    assert.ok(puzzle.clues.length >= 4 && puzzle.clues.length <= 7);
    const valid = game.combinations(puzzle.board).filter(cards => puzzle.clues.every(clue => clue.test(cards)));
    assert.equal(valid.length, 1, `seed ${seed}`);
    assert.equal(valid[0].map(c => c.letter).join(''), puzzle.answer);
    assert.ok(game.check(puzzle, puzzle.answer));
    assert.ok(game.check(puzzle, [...puzzle.answer].reverse().join('').toLowerCase()));
    const signature = puzzle.clues.map(c => c.text).join('|');
    assert.ok(!signatures.has(signature)); signatures.add(signature);
    for (const clue of puzzle.clues) assert.ok(clue.explain(valid[0]).length > 0);
  }
});
test('rejects malformed, repeated, missing and incorrect cards', () => {
  const p = game.generate(seeded(123));
  for (const code of ['', 'ABC', 'ABCDE', 'AAAA', 'AB12', 'AB C', '❤️AB']) assert.equal(game.check(p, code), false);
  const wrong = game.combinations(p.board).find(cards => cards.map(c => c.letter).join('') !== p.answer);
  assert.equal(game.check(p, wrong.map(c => c.letter).join('')), false);
});
test('clue text describes the numeric and attribute predicates independently', () => {
  const p = game.generate(seeded(345));
  const cases = game.combinations(p.board);
  const ranks = { first: 0, second: 1, third: 2, fourth: 3 };
  const checks = {
    sum: (text, c) => c.reduce((s, x) => s + x.number, 0) === +text.match(/to (\d+)/)[1],
    parity: (text, c) => c.filter(x => x.number % 2 === 1).length === +text.match(/Exactly (\d+)/)[1],
    color: (text, c) => new Set(c.map(x => x.color)).size === +text.match(/exactly (\d+)/)[1],
    shape: (text, c) => new Set(c.map(x => x.shape)).size === +text.match(/exactly (\d+)/)[1],
    range: (text, c) => {
      const n = c.map(x => x.number).sort((a,b) => a-b), expected = +text.match(/(\d+)\./)[1];
      return (text.includes('differ') ? n[3]-n[0] : n[3]+n[0]) === expected;
    },
    position: (text, c) => {
      const [, a, b] = text.match(/the (first|second|third|fourth) and (first|second|third|fourth) cards/);
      const x=c[ranks[a]].number, y=c[ranks[b]].number, expected=+text.match(/(\d+)\./)[1];
      return (text.includes('differ') ? Math.abs(x-y) : x+y) === expected;
    },
    product: (text, c) => {
      const [, a, b] = text.match(/the (first|second|third|fourth) and (first|second|third|fourth) cards/);
      return c[ranks[a]].number*c[ranks[b]].number <= +text.match(/most (\d+)/)[1];
    },
    frequency: (text, c) => {
      const key=text.includes('color')?'color':'shape';
      const rank=text.includes('second-smallest')?1:text.includes('third-smallest')?2:text.includes('largest')?3:0;
      const chosen=[...c].sort((a,b)=>a.number-b.number)[rank];
      return p.board.filter(x=>x[key]===chosen[key]).length === +text.match(/exactly (\d+)/)[1];
    }
  };
  // Several seeds ensure all generated clue families are evaluated against non-solutions too.
  const seen=new Set();
  for(let seed=10;seed<30;seed++) {
    const puzzle=game.generate(seeded(seed), 'hard');
    // Use this puzzle's whole board for frequency comparisons.
    p.board=puzzle.board;
    for(const clue of puzzle.clues) {
      seen.add(clue.family);
      for(const c of game.combinations(puzzle.board)) assert.equal(clue.test(c),checks[clue.family](clue.text,c),clue.text);
    }
  }
  assert.equal(seen.size, 8);
});

test('all four levels keep unique solutions and their required clue types across 120 seeds each', () => {
  for (const [level, profile] of Object.entries(game.difficulties)) {
    for (let seed = 1; seed <= 120; seed++) {
      const p = game.generate(seeded(seed), level);
      assert.equal(p.difficulty, level);
      const valid = game.combinations(p.board).filter(cards => p.clues.every(clue => clue.test(cards)));
      assert.equal(valid.length, 1, `${level} ${seed}`);
      assert.equal(valid[0].map(c => c.letter).join(''), p.answer);
      for (const family of new Set(profile.required)) {
        assert.ok(p.clues.filter(c => c.family === family).length >= profile.required.filter(x => x === family).length);
      }
      assert.ok(p.clues.every(c => !profile.excluded.includes(c.family)));
      for (const clue of p.clues.filter(c => ['anchor', 'logic'].includes(c.family))) {
        for (const cards of game.combinations(p.board)) {
          let expected;
          if (clue.family === 'anchor') {
            const rank = clue.text.includes('second-smallest') ? 1 : clue.text.includes('third-smallest') ? 2 : clue.text.includes('largest') ? 3 : 0;
            expected = cards.map(c => c.number).sort((a,b) => a-b)[rank] === +clue.text.match(/is (\d+)/)[1];
          } else {
            const indices = {first:0, second:1, third:2, fourth:3};
            const words = [...clue.text.matchAll(/the (first|second|third|fourth) and (first|second|third|fourth) cards/g)];
            const color = cards[indices[words[0][1]]].color === cards[indices[words[0][2]]].color;
            const shape = cards[indices[words[1][1]]].shape === cards[indices[words[1][2]]].shape;
            expected = clue.text.startsWith('Exactly one') ? color !== shape : color === shape;
          }
          assert.equal(clue.test(cards), expected, clue.text);
        }
      }
    }
  }
  assert.throws(() => game.generate(seeded(1), 'unknown'), /Unknown difficulty/);
});
