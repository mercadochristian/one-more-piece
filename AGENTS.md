# One More Piece

This is a static HTML/CSS/JavaScript puzzle library. Read README.md for the game
rules, source map and CSS ownership table. Playing the games needs no install or
build. npm dependencies support development checks only.

## Changes and ownership

- Preserve pending work and the global Git/identity rules. A request to edit or
  verify does not authorize a commit, push or publication.
- Keep game rules and generated puzzle data in each game's engine. Keep browser
  interactions in its app.js. Shared modules must not read hidden puzzle answers.
- Follow the README's CSS ownership table. Change the owning definition and
  remove obsolete declarations instead of adding specificity to defeat them.
- Keep the two canonical Beans stylesheets as upstream snapshots. Do not trim or
  reformat them during host cleanup. A deliberate design-system update includes
  both the source/provenance check and affected UI verification.

## Components and the cascade

- Load canonical tokens and components before host styles. Use the existing
  r-button variants for button appearance. Keep the variant and aria-pressed or
  aria-selected state synchronized when a control changes role.
- Keep normal controls at least 44px high. Secret Code's documented compact Clear
  control changes its type and horizontal inset, not its minimum hit height.
- Keep base layout rules before responsive rules. This project uses max-width
  breakpoints, with wider breakpoints before narrower ones. State rules that must
  win over hover, such as launching, retain their explicit final priority.
- Treat rule movement, selector grouping and shorthand changes as behavior
  changes. Sorting or deduplicating CSS is not automatically semantics-preserving.
- Stylelint rejects duplicate selectors/properties and undocumented !important.
  Use a rule-specific disable-next-line with a concrete reason for a necessary
  exception or browser fallback. A small scoped disable/enable block is acceptable
  for related declarations. Do not disable a whole owned file or rule globally to
  pass a check. Unused or descriptionless suppressions fail the check.

## Comments and tests

- Keep a comment when it explains a constraint, invariant, intentional fallback or
  attribution that the nearby code does not explain. Verify that its claim holds
  in the actual function. Remove stale patch history and restatements of selectors
  or function names. Keep license notices.
- Explain swallowed exceptions when their fallback is not evident from the
  surrounding code. An interruption, unavailable storage or optional audio must
  not be mislabeled as proof that every failure is harmless.
- Pass a puzzle's board and other fixture context explicitly to test helpers.
  Do not mutate a shared fixture to make a checker use another puzzle's state.
- A regression test must fail for the original defect. Control time and other
  preconditions so throttling, mocks or unrelated guards cannot hide it.
- Configure browser globals and Node test globals separately. Declare a shared
  engine API only for its actual callers; do not bypass no-undef with a blanket
  collection of application globals.

## Required checks

- Run npm run check after a completed change. It runs ESLint, Stylelint, the Node
  tests, and git diff --check. Fix relevant failures; do not weaken a rule or test
  just to make the command pass.
- Read package.json before setup. Reuse installed dependencies. When setup is
  authorized, use the lockfile with npm ci --ignore-scripts. Do not add packages,
  browsers, services or containers by implication.
- For CSS or interaction changes, compare the relevant before/after rendered
  states. Cover desktop 1440px, mobile 390px and narrow 320px where affected, plus
  any changed breakpoint. Common UI changes cover the library and all three games.
  Record the actual CSS viewport dimensions and check browser zoom; a requested
  viewport override alone does not prove the rendered breakpoint.
  Include keyboard/focus, selected/hover/disabled states, dialog cancellation and
  recovery, light/dark appearance and reduced motion where the change affects it.
- Refresh affected runtime asset content versions in entry HTML after changing
  CSS/JS. Verify ordinary navigation on the actual served checkout. A one-off
  cache-busted URL does not establish that normal navigation loads the candidate.
- Keep screenshot/log evidence outside Git. Report tests, source review and
  browser results separately, with exact targets and any unrun cases. Linters do
  not establish contrast, responsive layout, provider behavior or deployment.
