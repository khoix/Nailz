import test from 'node:test';
import assert from 'node:assert/strict';
import { Duel } from '../src/game/duel.ts';
import { participantName } from '../src/game/state.ts';
test('local names are optional, trimmed, capped, and fall back to Player 1/2', () => {
  assert.equal(participantName('pass-and-play', 'p1'), 'Player 1');
  assert.equal(participantName('pass-and-play', 'p2', { p2: '   ' }), 'Player 2');
  assert.equal(participantName('pass-and-play', 'p1', { p1: '  Maya  ' }), 'Maya');
  assert.equal(participantName('pass-and-play', 'p2', { p2: 'Bartholomew the Third' }), 'Bartholomew ');
});
test('solo names rename only the human; the operator keeps its identity', () => {
  assert.equal(participantName('solo', 'p1', { p1: 'Kay' }), 'Kay');
  assert.equal(participantName('solo', 'p2', { p2: 'Impostor' }), 'Operator');
});
test('names persist through rematch while the starter still swaps', () => {
  const duel = new Duel(5, { mode: 'pass-and-play', names: { p1: 'Ana', p2: 'Ben' }, firstStarter: 'p1' });
  const before = duel.snapshot.participants.map(p => p.name);
  duel.restart(6);
  assert.deepEqual(duel.snapshot.participants.map(p => p.name), before);
  assert.deepEqual(before, ['Ana', 'Ben']);
  assert.equal(duel.snapshot.firstStarter, 'p2');
});
