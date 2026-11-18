# One More Piece

**One More Piece** is an unofficial library of puzzles and games inspired by **The Devil’s Plan**, with Secret Code, Loop Fence Puzzle and Hexagon as playable entries. These browser-only solo games adapt puzzles from the show. All boards and clues are originally generated; no show artwork or puzzle boards are copied. This is a solo adaptation, not an exact reconstruction of the televised competition.

Open `index.html` directly in a browser to browse the library, then choose **Play Secret Code**. Secret Code lives at `games/secret-code/index.html`; its **Back to library** link confirms before leaving an unfinished puzzle. Cancel preserves the current game. There are no dependencies, build steps, accounts, external playback services. The included Beans sprite sheet is loaded from the local assets directory. Select four cards satisfying every clue, then submit. A new puzzle changes the board and conditions. The generator enumerates all 14,950 four-card combinations and only returns a puzzle with exactly one solution. A bounded generation failure shows a retry message rather than serving an ambiguous puzzle.

## Project layout

```text
index.html                    Library homepage
library/                      Homepage styles, behavior and launch sequence
shared/
  style.css                   Shared theme and interface styles
  beans.js                    Shared mascot behavior
  audio.js / music.js         Effects and background music controls
  entry.js / transitions.css  Shared TV entrance and launch styles
  tutorial*.js / tutorial.css Worked examples and onboarding controls
  audio-credits.html          Music source and license credits
  assets/                     Shared Beans sprite sheet
games/
  secret-code/
    index.html                Game page
    app.js                    Game interactions and audio
    engine.js                 Puzzle generation and validation
    tests/engine.test.cjs     Game engine tests
  hexagon/                    Hexagon page, styles, engine, app, example and tests
  loop-fence/
    index.html                Game page
    style.css                 Loop Fence board styles
    app.js                    Game interactions and audio
    engine.js                 Puzzle generation and validation
    tests/engine.test.cjs     Game engine tests
tests/tutorial.test.cjs       Shared worked-example checks
secret-code.html              Compatibility redirect for existing links
loop-fence.html               Compatibility redirect for existing links
```

Keep game-specific files in their game folder; use `shared/` for common interface styles and Beans. Add future games under `games/<game-name>/`, and link them from the library. All paths remain relative for GitHub Pages and opening the library from disk. The original root game URLs redirect to their new pages.

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

## Loop Fence Puzzle

Open `games/loop-fence/index.html`, or choose **Play Loop Fence** in the library. This solo adaptation uses Slitherlink rules: connect adjacent dots into one closed loop, with no branches or crossings. Every numbered cell must have exactly that many fence edges. Blank cells impose no count constraint. Unused edges need not be crossed out. Original puzzle generation uses no copied show boards or external data. Rules reference: [Nikoli’s Slitherlink rules](https://www.nikoli.co.jp/en/puzzles/slitherlink/).

- **Easy:** 4×4, targeting 85% clue coverage. **Medium:** 5×5, 72%. **Hard:** 6×6, 60%. **Advanced:** 7×7, 50%. Clues are removed only while uniqueness is proven, so actual coverage can be higher. Difficulty describes structure rather than measured human solve time.
- A generated cell region produces one closed boundary. A bounded constraint solver checks uniqueness before serving the board and after each proposed clue removal. Search exhaustion never counts as a proof. Generation failure offers New puzzle to retry.
- Pointer input snaps to the nearest drawn edge across all difficulty levels; taps directly on dots or ambiguous corner diagonals are ignored. This prevents overlapping phone hitboxes from selecting a neighboring edge. Keyboard selection still uses the focused edge.
- Fence, Cross and Erase tools act on individual edges. Tap an existing matching mark to remove it. Right-click toggles a cross. Undo/Redo includes clearing the board; a new edit discards redo history.
- Tab enters/leaves the board; arrow keys move between edges; Enter/Space uses the selected tool, X toggles a cross, Delete/Backspace erases. Each clue and edge has its row and column announced.
- Submission checks the drawn loop and all clues. Incorrect attempts preserve the drawing and offer retry, with no automatic correctness hints. Optional One attempt locks after a wrong submission; the result offers a new puzzle or solution reveal. This setting applies to the next puzzle.
- Give up & reveal preserves the original attempt and compares it with the solution. Changed cells (including blank ones) pulse three times, then remain highlighted; reduced motion uses a static highlight. Your attempt/Correct loop switches views. Missing edges are jade in the solution; extra edges are coral in the attempt. A correct attempt is explicitly reported as correct without error highlights. Puzzle reference is shown for reporting problems.
- Success opens a celebration with Play again and Review solution. Sounds reuse Secret Code’s locally synthesized clicks and result chimes, with immediate mute. Beans uses the same dedicated wandering lane and dialog docks, reacts to player actions, and respects its animation toggle and system reduced motion.
- New puzzle, difficulty changes, clearing, solution reveal and leaving an unfinished game ask for confirmation. Cancel/Escape preserves the drawing, cross marks and history. A confirmed difficulty change starts the selected level immediately.
- No new dependencies, build step, backend, accounts or network services are required to play. There is no automatic saving across reloads.

## Library motion and audio

- Each entire game card is a native link, with a resting shadow, pointer hover lift, and visible keyboard focus. Modified clicks keep native new-tab behavior.
- Pointer activation pulls visible library elements into a black hole, closes a TV line, then reveals the chosen playable game with a TV entrance. Escape skips. Keyboard activation opens immediately; system reduced motion and Simple fade avoid the suction sequence.
- Interrupted launches are canceled on pagehide/pageshow, so browser Back/Forward cannot resume a stale navigation.
- Library effects show **Enable sound** until a click activates audio, then **Effects on**. Effects have their own mute control, shared with the selected game's Game sounds setting. Hover cannot unlock browser audio on its own.
- Background music defaults on at **10%**, with a separate Music toggle and Settings volume slider in each game. Browser autoplay restrictions may require one click. Explicit pause is remembered for the session. Hidden tabs pause music, and navigation stops playback.
- **Dark Fog** by Kevin MacLeod is bundled unchanged under **CC BY 4.0**, with the creator/source/license and playback-loop notice in `shared/audio-credits.html` and `shared/assets/audio/ATTRIBUTION.md`. All other effects are original local synthesis. No external streaming service is required.

## Worked-example onboarding

Each game opens How to play on its first visit, then remembers dismissal on that browser. How to play always remains available. Separate tiny worked examples offer Play/Pause, Next step and Restart; they never read or reveal the live puzzle. Closing the dialog or hiding the tab stops playback. Reduced motion keeps the static steps and narration while removing moving letters and cursor tracing.

Secret Code’s six-card example uses two actual conditions: exactly two Blue cards, and numbers totaling 36. It explains why A and C are required, then calculates the remaining 25 and selects D and F. It selects A first, animates A→C→D→F into the letter boxes, and crosses out satisfied example conditions. Letters are the output format, not another clue. The numbered example cards can also be clicked to follow the guided solution. The actual board and fixed answer bar now explicitly label letters as the submitted code. Loop Fence’s 2×2 example traces a complete outer loop, checks all four clues, and shows optional cross notes. The full game rules remain in a disclosure inside the same dialog.

## Hexagon

Open `games/hexagon/index.html`, or select its entire library card. This is a solo memory adaptation: memorize 19 numbered positions, hide the numbers, then find three consecutive adjacent tiles on one straight line whose hidden values sum to the revealed target. Horizontal and both diagonal directions count. A radius-two hexagonal grid has 27 legal triples; gaps and turns are invalid. Round generation enumerates every legal triple and chooses a target with 2–5 matching lines. Multiple answers are intentional.

- **Easy:** numbers1–5,60-second memory,untimed recall. **Medium:** numbers1–9,30-second memory,untimed recall. **Hard:** numbers1–9,20-second memory,90-second recall. **Advanced:** numbers1–12,12-second memory,60-second recall. These are practice settings, not measured solve-time guarantees or an exact television timing reconstruction.
- Each new round starts Ready. Start memorizing explicitly; Hide numbers starts recall early. The target stays hidden during study. After hiding, the UI and accessible tile labels contain letters rather than the hidden values.
- Find all matching lines. New correct answers +1; wrong or repeated answers −1. The selection order does not matter. Wrong submissions preserve selections without revealing values. Found-letter combinations stay listed. Completing the round celebrates; ending or timing out reveals every value and matching arithmetic line.
- All study/recall timers pause while a dialog is open or the tab is hidden. Paused study values are covered. New rounds, difficulty changes, reveal and leaving unfinished rounds use confirmations.
- Reuses the shared black-hole launch/TV entrance, Beans safe lane/dialog docks, effects mute, default10% credited music, native blurred dialogs, keyboard support and reduced-motion handling. No new dependencies or external playback services.
- Seven-tile animated onboarding demonstrates memorization, letter replacement, target12, A→D→G and the second matching line CDE. Conditions are crossed off as the demonstration is solved; the live round is untouched. First-visit dismissal is remembered, and How to play always reopens it.
- Source references for the show’s memory/target format and the consecutive-line interpretation: [S1 game explainer](https://www.dexerto.com/tv-movies/the-devils-plan-games-explained-2310672/) and [published solo adaptation rules](https://www.heeyeonlee.com/playground/hexagon). All generated boards and the onboarding example are original.

## Checks

Node.js 18 or newer is required only for the automated checks. Playing the games needs a modern browser and no build step.

```sh
node --test games/*/tests/*.test.cjs tests/*.test.cjs
```

The Secret Code suite verifies uniqueness across all four difficulty levels, valid and invalid submissions, and independent interpretation of clue wording. Loop Fence checks 80 seeds per level (320 boards), independently validates their loops and clues, checks solver counts against exhaustive enumeration on small boards, and rejects open, branching, disconnected and clue-breaking drawings. Hexagon checks 150 seeds per level (600 rounds), independently enumerates its 27 legal straight triples, verifies every target answer, rejects invalid/repeated selections and checks the worked example. Browser verification additionally covers library navigation, game interactions, dialogs and responsive layouts. Local checks do not establish deployed behavior.

## GitHub Pages

This repository is the self-contained library root. `index.html` is the homepage and the games live under `games/secret-code/`, `games/loop-fence/` and `games/hexagon/`. All links and assets use relative paths, including under the repository's Pages subpath.

Publish from the `main` branch at the repository root (`/`). The `.nojekyll` file tells Pages to serve the static files directly. There are no packages to install or application servers to deploy.
