import type { NailState, StrikeInput, StrikeResult } from './types.ts';
import { STRIKE_TUNING, type StrikeTuning } from './tuning.ts';

const unit = (n: number) => Math.max(0, Math.min(1, n));
function finite(...values: number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Strike values must be finite.');
}
export function createNail(t: StrikeTuning = STRIKE_TUNING): NailState {
  return { length: t.nailLength, depth: t.setupDepth, bend: { x: 0, y: 0 }, strikeCount: 0, winner: null };
}
/** Pure: no scene state, clocks, mutation, random rolls, or frame-count dependence. */
export function resolveStrike(nail: NailState, input: StrikeInput, t: StrikeTuning = STRIKE_TUNING): StrikeResult {
  finite(nail.length, nail.depth, input.offset.x, input.offset.y, input.reticleQuality, input.swipePower);
  if (nail.length <= 0 || nail.depth < 0 || nail.depth > nail.length || nail.winner !== null)
    throw new RangeError('Cannot strike an invalid or completed nail.');
  if (nail.length - nail.depth <= t.flushTolerance) throw new RangeError('Nail is already flush.');
  const radialError = Math.hypot(input.offset.x, input.offset.y);
  const reticleQuality = unit(input.reticleQuality);
  const swipePower = unit(input.swipePower);
  const powerCap = reticleQuality >= t.perfectReticle ? 1 :
    t.minimumCap + (1 - t.minimumCap) * (reticleQuality / t.perfectReticle) ** t.reticleExponent;
  const usablePower = Math.min(swipePower, powerCap);
  const contact = radialError < t.contactRadius;
  const error = unit((radialError - t.perfectRadius) / (t.contactRadius - t.perfectRadius));
  const efficiency = contact ? (1 - error) ** t.accuracyExponent : 0;
  const downwardForce = usablePower * efficiency;
  const lateralForce = contact ? usablePower * (1 - efficiency) : 0;
  const bendMagnitude = lateralForce < t.bendThreshold ? 0 : lateralForce * t.maxBendRadians;
  const bend = radialError > 0 ? {
    x: -input.offset.x / radialError * bendMagnitude,
    y: -input.offset.y / radialError * bendMagnitude,
  } : { x: 0, y: 0 };
  const capacity = nail.length * (1 - t.setupDepth / t.nailLength);
  let depthAfter = Math.min(nail.length, nail.depth + downwardForce * capacity);
  const finishing = nail.length - depthAfter <= t.flushTolerance;
  if (finishing) depthAfter = nail.length;
  return Object.freeze({ actor: input.actor, offset: Object.freeze({ ...input.offset }), radialError,
    contact, reticleQuality, swipePower, powerCap, usablePower, efficiency, downwardForce,
    lateralForce, strikeCountBefore: nail.strikeCount, depthBefore: nail.depth, depthAfter, depthDelta: depthAfter - nail.depth,
    bend: Object.freeze(bend), perfect: radialError <= t.perfectRadius && reticleQuality >= t.perfectReticle && swipePower >= 1,
    finishing, oneHit: finishing && nail.strikeCount === 0 });
}
/** Applying is explicit. A stale result cannot be applied to a changed nail. */
export function applyStrike(nail: NailState, result: StrikeResult): NailState {
  if (nail.winner !== null || nail.depth !== result.depthBefore || nail.strikeCount !== result.strikeCountBefore)
    throw new Error('Strike result does not match the current nail.');
  return { ...nail, depth: result.depthAfter, bend: { ...result.bend }, strikeCount: nail.strikeCount + 1,
    winner: result.finishing ? result.actor : null };
}
export function straightenNail(nail: NailState): NailState {
  return { ...nail, bend: { x: 0, y: 0 } };
}
