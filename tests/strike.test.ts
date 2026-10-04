import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyStrike, createNail, resolveStrike, straightenNail } from '../src/game/strike.ts';
import { STRIKE_TUNING } from '../src/game/tuning.ts';
import type { StrikeInput } from '../src/game/types.ts';
const perfect: StrikeInput = { actor: 'p1', offset: { x: 0, y: 0 }, reticleQuality: 1, swipePower: 1 };
const strike = (changes: Partial<StrikeInput> = {}) => resolveStrike(createNail(), { ...perfect, ...changes });
test('perfect fresh strike is a one-hit finish in a reachable radius', () => {
  for (const x of [0, 0.01, STRIKE_TUNING.perfectRadius]) {
    const r = strike({ offset: { x, y: 0 }, reticleQuality: 0.99 });
    assert.equal(r.depthAfter, 1); assert.equal(r.oneHit, true); assert.equal(r.perfect, true);
  }
});
test('focus caps power and a weak swipe stays weak', () => {
  const capped = strike({ reticleQuality: 0.3 });
  assert.ok(capped.usablePower < 0.4);
  assert.equal(capped.usablePower, capped.powerCap);
  assert.equal(strike({ swipePower: 0.2 }).usablePower, 0.2);
  assert.equal(strike({ swipePower: 0 }).depthDelta, 0);
});
test('useful force falls monotonically with radial error', () => {
  let previous = 1;
  for (let i = 0; i < 200; i++) {
    const r = strike({ offset: { x: i / 100, y: 0 } });
    assert.ok(r.downwardForce <= previous + 1e-12); previous = r.downwardForce;
    assert.ok(r.depthAfter >= createNail().depth && r.depthAfter <= 1);
  }
});
test('power and reticle quality produce monotonic depth gain', () => {
  for (const field of ['swipePower', 'reticleQuality'] as const) {
    let previous = 0;
    for (let i = 0; i <= 100; i++) {
      const r = strike({ [field]: i / 100 });
      assert.ok(r.depthDelta >= previous); previous = r.depthDelta;
    }
  }
});
test('bend goes away from every cardinal/diagonal hit', () => {
  for (const [x,y] of [[-0.8,0],[0.8,0],[0,-0.8],[0,0.8],[-0.5,0.5],[0.5,-0.5]]) {
    const r = strike({ offset: { x: x!, y: y! } });
    assert.ok(r.bend.x * x! + r.bend.y * y! < 0);
    assert.ok(Math.abs(r.bend.x * y! - r.bend.y * x!) < 1e-10);
  }
});
test('complete miss neither inserts nor bends; clamp extreme power', () => {
  const miss = strike({ offset: { x: 2, y: 0 } });
  assert.equal(miss.contact, false); assert.equal(miss.depthDelta, 0);
  assert.equal(Math.hypot(miss.bend.x, miss.bend.y), 0);
  assert.equal(strike({ swipePower: 4, reticleQuality: 4 }).usablePower, 1);
  assert.equal(strike({ swipePower: -2 }).usablePower, 0);
});
test('invalid and completed nail inputs are rejected', () => {
  assert.throws(() => strike({ swipePower: NaN }), RangeError);
  assert.throws(() => strike({ offset: { x: Infinity, y: 0 } }), RangeError);
  assert.throws(() => resolveStrike({ ...createNail(), depth: 2 }, perfect), RangeError);
  assert.throws(() => resolveStrike({ ...createNail(), depth: 1 }, perfect), RangeError);
});
test('straightening preserves depth/count; finishing belongs to striker', () => {
  const original = createNail();
  const hit = applyStrike(original, strike({ offset: { x: -0.6, y: 0 } }));
  const straight = straightenNail(hit);
  assert.equal(straight.depth, hit.depth); assert.equal(straight.strikeCount, 1);
  assert.deepEqual(straight.bend, { x: 0, y: 0 });
  const finish = resolveStrike(straight, { ...perfect, actor: 'p2' });
  assert.equal(finish.finishing, true); assert.equal(finish.oneHit, false);
  assert.equal(applyStrike(straight, finish).winner, 'p2');
  assert.equal(original.depth, STRIKE_TUNING.setupDepth);
});
test('results cannot be applied twice, including zero-depth misses', () => {
  for (const offset of [{ x: 0, y: 0 }, { x: 2, y: 0 }]) {
    const nail = createNail(); const result = resolveStrike(nail, { ...perfect, offset, swipePower: 0.2 });
    assert.throws(() => applyStrike(applyStrike(nail, result), result));
  }
});
test('center hit has no lateral force and non-finishing contact conserves force', () => {
  assert.equal(strike().lateralForce, 0);
  const result = strike({ offset: { x: 0.8, y: 0 } });
  assert.ok(Math.abs(result.downwardForce + result.lateralForce - result.usablePower) < 1e-12);
});
