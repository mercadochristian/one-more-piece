const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function audioHost() {
  const calls = { created: 0, resumed: 0, tones: 0 };
  let context;
  let now = 1000;
  const parameter = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  class AudioContext {
    constructor() {
      calls.created++;
      context = this;
      this.state = 'running';
      this.currentTime = 0;
      this.destination = {};
    }
    resume() {
      calls.resumed++;
      this.state = 'running';
      return Promise.resolve();
    }
    createGain() {
      return { gain: parameter(), connect() {}, disconnect() {} };
    }
    createOscillator() {
      return {
        frequency: parameter(), connect() {}, disconnect() {},
        start() { calls.tones++; }, stop() {},
      };
    }
  }
  const window = { AudioContext, addEventListener() {} };
  const document = { hidden: false, addEventListener() {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../shared/audio.js'), 'utf8'),
    { window, document, sessionStorage: { getItem() { return null; }, setItem() {} }, performance: { now() { return now; } } },
  );
  return { audio: window.GameAudio, calls, document, context: () => context, advanceTime() { now += 200; } };
}

test('hover does not create an audio context before activation', () => {
  const host = audioHost();
  host.audio.play('hover');
  assert.deepEqual(host.calls, { created: 0, resumed: 0, tones: 0 });
  host.audio.play('click');
  assert.equal(host.calls.created, 1);
  assert.equal(host.calls.tones, 1);
});

test('hover leaves a suspended context alone while activation can resume it', () => {
  const host = audioHost();
  host.audio.play('click');
  host.context().state = 'suspended';
  host.audio.play('hover');
  assert.equal(host.calls.resumed, 0);
  assert.equal(host.calls.tones, 1);
  assert.equal(host.context().state, 'suspended');
  host.audio.play('click');
  assert.equal(host.calls.resumed, 1);
  assert.equal(host.calls.tones, 2);
});

test('hover plays only with a running context, visible page and enabled effects', () => {
  const host = audioHost();
  host.audio.play('click');
  host.audio.play('hover');
  assert.equal(host.calls.tones, 2);
  host.advanceTime();
  host.document.hidden = true;
  host.audio.play('hover');
  assert.equal(host.calls.tones, 2);
  host.document.hidden = false;
  host.advanceTime();
  host.audio.setEnabled(false);
  host.audio.play('hover');
  assert.equal(host.calls.tones, 2);
});

test('hover does not try to use a closed context', () => {
  const host = audioHost();
  host.audio.play('click');
  host.context().state = 'closed';
  host.audio.play('hover');
  assert.equal(host.calls.resumed, 0);
  assert.equal(host.calls.tones, 1);
});
