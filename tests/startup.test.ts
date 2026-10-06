import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceStartup, canEnterMenu, createStartup, enterMenu, startupLabel, type StartupEvent } from '../src/game/startup.ts';
const run = (...events: StartupEvent[]) => events.reduce((s, e) => enterMenu(advanceStartup(s, e)), createStartup());
test('tap before ready records intent, shows getting ready, then enters once when assets arrive', () => {
  let s = run({ type: 'play' }, { type: 'audio', result: 'active' });
  assert.equal(startupLabel(s), 'getting-ready'); assert.equal(s.entered, false);
  s = enterMenu(advanceStartup(s, { type: 'assetsReady' }));
  assert.equal(s.entered, true); assert.equal(startupLabel(s), 'entered');
  const again = enterMenu(advanceStartup(s, { type: 'play' }));
  assert.equal(again, s, 'Repeated taps after entry change nothing');
});
test('ready before tap waits on the title until an explicit activation', () => {
  let s = run({ type: 'assetsReady' });
  assert.equal(startupLabel(s), 'tap'); assert.equal(s.entered, false, 'Loading completion never enters by itself');
  s = enterMenu(advanceStartup(s, { type: 'play' }));
  assert.equal(s.entered, true);
});
test('repeated taps while loading enter exactly once', () => {
  const s = run({ type: 'play' }, { type: 'play' }, { type: 'play' }, { type: 'assetsReady' }, { type: 'play' });
  assert.equal(s.entered, true); assert.equal(canEnterMenu(s), false);
});
test('required asset failure keeps intent through retry and blocks entry until readiness', () => {
  let s = run({ type: 'play' }, { type: 'assetError', message: 'texture' });
  assert.equal(startupLabel(s), 'failed'); assert.equal(s.playRequested, true); assert.equal(canEnterMenu(s), false);
  s = enterMenu(advanceStartup(s, { type: 'retry' }));
  assert.equal(startupLabel(s), 'getting-ready', 'Retry keeps the recorded intent');
  s = enterMenu(advanceStartup(s, { type: 'assetsReady' }));
  assert.equal(s.entered, true, 'A retry succeeding after intent needs no second tap');
});
test('blocked audio never blocks play', () => {
  const s = run({ type: 'audio', result: 'blocked' }, { type: 'assetsReady' }, { type: 'play' });
  assert.equal(s.entered, true); assert.equal(s.audio, 'blocked');
});
