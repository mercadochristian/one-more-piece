# One More Piece

**One More Piece** is an unofficial library of puzzles and games inspired by **The Devil’s Plan**, with Secret Code as the first playable entry. This browser-only solo game adapts the show’s Secret Code elimination match. All boards and clues are originally generated; no show artwork or puzzle boards are copied. This is a solo adaptation, not an exact reconstruction of the televised competition.

Open `index.html` directly in a browser to browse the library, then choose **Play Secret Code**. The game lives at `secret-code.html`; its **Back to library** link confirms before leaving an unfinished puzzle. Cancel preserves the current game. There are no dependencies, build steps, accounts, external network requests or services. The included Beans sprite sheet is loaded from the local assets directory. Select four cards satisfying every clue, then submit. A new puzzle changes the board and conditions. The generator enumerates all 14,950 four-card combinations and only returns a puzzle with exactly one solution. A bounded generation failure shows a retry message rather than serving an ambiguous puzzle.

## Difficulty

Every level has 26 cards and exactly one verified solution. These are structural challenge levels, not measured human solve-time guarantees:

- **Easy:** direct numerical anchors, color/symbol counts and basic arithmetic.
- **Medium:** basic clues plus relationships between alphabetical card positions.
- **Hard:** whole-board frequency counting and product bounds are required.
- **Advanced:** at least two linked logic clues plus whole-board counting; a linked clue says either exactly one of two statements is true, or both have the same truth value.

Changing difficulty asks for confirmation and immediately generates a fresh puzzle when confirmed. Canceling or pressing Escape preserves the current board, selection, notes and difficulty. The current puzzle’s level is shown beside its number.

## Controls and Beans

- **Settings** contains One attempt, the 10-second buzzer, Game sounds and Beans animation. Attempt/buzzer changes apply to the next puzzle; audio and animation controls apply immediately.
- **How to play** opens a separate modal. Both dialogs support Escape and return focus to their trigger.
- Beans reuses the existing v2 character artwork and sprite timings. It stays in a dedicated lane above the puzzle, or a reserved dock in dialogs. Left/right crossings dig down, relocate while hidden, and resurface. Cards and conditions are never a movement surface.
- Player clicks and changes trigger expressions; selections jump, submissions look attentive, wins celebrate and failures look disappointed. Reactions never use the hidden answer or evaluate clue correctness.
- Turning off Beans animation or enabling system reduced motion stops wandering and animated sprite frames. Static expressions still respond. The page pauses mascot motion while hidden.

## Practice rules

- Numbers 1–26 each occur once. Every card has a letter, color and symbol.
- “First”, “second”, “third”, “fourth” mean alphabetical order of the chosen letters. Numerical ranks explicitly say “smallest” or “largest”.
- Your selected letters fill from the left, staying alphabetically ordered. The answer bar stays visible while you scroll.
- An incorrect submission opens a brief feedback splash without revealing the answer. Practice offers Try again and Review clues; locked attempts offer New puzzle or Back to puzzle.
- A correct solve opens a congratulations splash with Play again and Review solution. Escape also opens the solution review.
- Short game sounds are synthesized locally using Web Audio, including a rising success chime and a descending failure cue; Sound off immediately mutes scheduled tones. Audio support is optional. Reduced motion uses a gentle success fade without moving particles.
- Clue checkboxes are manual notes. They never reveal whether a selection satisfies a clue.
- Untimed practice permits retries. One-attempt mode locks after a wrong answer. The optional buzzer allows unlimited thinking time, followed by ten seconds to submit; an incorrect buzzer submission or timeout locks the puzzle.
- Modes are captured when a new puzzle starts. Answer explanations appear only after success or confirmed surrender. A new puzzle and a page reload discard the current game.
- The answer is hidden in the interface, not protected from someone inspecting client-side JavaScript. This is personal practice, not a trusted competition platform.

## Checks

Node.js 18 or newer is required only for the automated checks. Playing the games needs a modern browser and no build step.

```sh
node --test tests/engine.test.cjs
```

The suite verifies puzzle uniqueness across all four difficulty levels, valid and invalid submissions, and independent interpretation of clue wording. Browser verification additionally covers library navigation, game interactions, dialogs and responsive layouts. Local checks do not establish deployed behavior.

## GitHub Pages

This repository is the self-contained library root. `index.html` is the homepage and `secret-code.html` is the first game. All links and assets use relative paths, including under the repository's Pages subpath.

Publish from the `main` branch at the repository root (`/`). The `.nojekyll` file tells Pages to serve the static files directly. There are no packages to install or application servers to deploy.
