import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRandom } from '../src/game/random.ts';
import { createMatch, otherParticipant } from '../src/game/state.ts';
import { canEnterMenu, createStartup } from '../src/game/startup.ts';
import { screenToNail } from '../src/input/coordinates.ts';
import { MUSIC } from '../src/audio/contracts.ts';
test('seeded streams repeat; cosmetic sampling cannot affect gameplay', () => {
  const a = createRandom(42); const b = createRandom(42); const decorative = createRandom(84);
  for (let i = 0; i < 500; i++) { decorative(); const value = a(); assert.equal(value, b()); assert.ok(value >= 0 && value < 1); }
  assert.notEqual(createRandom(1)(), createRandom(2)());
});
test('local mode contains two humans and independent scores', () => {
  const local = createMatch('pass-and-play', 'p2');
  assert.deepEqual(local.participants.map(p => p.controller), ['human', 'human']);
  assert.equal(local.activeParticipant, 'p2'); assert.equal(local.nailsPerMatch, 5);
  assert.equal(createMatch('solo').participants[1].controller, 'ai');
  assert.equal(otherParticipant('p2'), 'p1');
  assert.notEqual(createMatch('solo').nail, createMatch('solo').nail);
});
test('startup requires readiness AND intent, independent of audio failure', () => {
  const state = createStartup();
  assert.equal(canEnterMenu(state), false);
  assert.equal(canEnterMenu({ ...state, assetsReady: true }), false);
  assert.equal(canEnterMenu({ ...state, playRequested: true }), false);
  assert.equal(canEnterMenu({ ...state, assetsReady: true, playRequested: true, audio: 'blocked' }), true);
  assert.equal(canEnterMenu({ ...state, assetsReady: true, playRequested: true, requiredAssetError: 'texture' }), false);
  assert.equal(MUSIC, null);
});
test('CSS-pixel targeting has consistent axes and scale', () => {
  assert.deepEqual(screenToNail(125, 75, { centerX: 100, centerY: 100, radiusPixels: 25 }), { x: 1, y: 1 });
  assert.deepEqual(screenToNail(250, 150, { centerX: 200, centerY: 200, radiusPixels: 50 }), { x: 1, y: 1 });
  assert.throws(() => screenToNail(0, 0, { centerX: 0, centerY: 0, radiusPixels: 0 }));
});
