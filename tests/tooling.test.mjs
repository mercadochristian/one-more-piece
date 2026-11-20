import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import stylelint from 'stylelint';

const root = fileURLToPath(new URL('../', import.meta.url));
const eslint = new ESLint({ cwd: root });

async function lintJS(code, file = 'shared/audio.js') {
  const [result] = await eslint.lintText(code, { filePath: path.join(root, file) });
  return result.messages;
}

function lintCSS(code, file = 'shared/style.css') {
  return stylelint.lint({
    code,
    codeFilename: path.join(root, file),
    configFile: path.join(root, 'stylelint.config.mjs'),
  });
}

test('JavaScript lint rejects undeclared names and unused values in browser files', async () => {
  const messages = await lintJS('unknownControl.click(); const unusedBoard = [];');
  assert.ok(messages.some(message => message.ruleId === 'no-undef'));
  assert.ok(messages.some(message => message.ruleId === 'no-unused-vars'));
  assert.deepEqual(await lintJS('document.body.dataset.theme = window.location.hash;'), []);
});

test('browser, portable engine and Node globals stay scoped to their actual callers', async () => {
  assert.deepEqual(await lintJS('module.exports = process.version;', 'tests/audio.test.cjs'), []);
  assert.ok((await lintJS('window.location.reload();', 'tests/audio.test.cjs'))
    .some(message => message.ruleId === 'no-undef'));
  assert.ok((await lintJS('process.exit(0);')).some(message => message.ruleId === 'no-undef'));
  assert.deepEqual(await lintJS('SecretCode.generate(); Beans.react("new");', 'games/secret-code/app.js'), []);
  assert.ok((await lintJS('LoopFence.generate();', 'games/secret-code/app.js'))
    .some(message => message.ruleId === 'no-undef'));
  assert.deepEqual(await lintJS(
    'if (typeof module !== "undefined") module.exports = {}; else window.SecretCode = {};',
    'games/secret-code/engine.js',
  ), []);
});

test('CSS lint rejects duplicate selectors, properties and custom properties', async () => {
  for (const [code, rule] of [
    ['.piece { color: red; } .piece { color: blue; }', 'no-duplicate-selectors'],
    ['.piece { color: red; color: blue; }', 'declaration-block-no-duplicate-properties'],
    ['.piece { --tone: red; --tone: blue; }', 'declaration-block-no-duplicate-custom-properties'],
  ]) {
    const result = await lintCSS(code);
    assert.equal(result.errored, true);
    assert.ok(result.results[0].warnings.some(warning => warning.rule === rule));
  }
});

test('responsive selectors remain valid and necessary scoped exceptions require a reason', async () => {
  assert.equal((await lintCSS(
    '.piece { color: red; } @media (max-width: 390px) { .piece { color: blue; } }',
  )).errored, false);
  assert.equal((await lintCSS('.piece { color: red !important; }')).errored, true);
  assert.equal((await lintCSS(
    '.piece {\n/* stylelint-disable-next-line declaration-no-important -- Hidden content must defeat a display utility. */\ndisplay: none !important;\n}',
  )).errored, false);
  assert.equal((await lintCSS(
    '.piece {\n/* stylelint-disable-next-line declaration-no-important */\ndisplay: none !important;\n}',
  )).errored, true);
});

test('unused suppressions fail and documented browser fallbacks stay explicit', async () => {
  assert.equal((await lintCSS(
    '.piece {\n/* stylelint-disable-next-line declaration-no-important -- This must not hide an unnecessary suppression. */\ncolor: red;\n}',
  )).errored, true);
  assert.equal((await lintCSS(
    '.piece {\n/* stylelint-disable declaration-block-no-duplicate-properties -- Older browsers need the sRGB fallback before display-p3. */\ncolor: red;\ncolor: color(display-p3 1 0 0);\n/* stylelint-enable declaration-block-no-duplicate-properties */\n}',
  )).errored, false);
});

test('only the canonical Beans snapshots are excluded from host CSS lint', async () => {
  const code = '.piece { color: red; color: blue; }';
  for (const file of ['shared/beans-tokens.css', 'shared/beans-components.css']) {
    const result = await lintCSS(code, file);
    assert.equal(result.errored, false);
    assert.equal(result.results[0].ignored, true);
  }
  assert.equal((await lintCSS(code, 'shared/beans-ui.css')).errored, true);
});
