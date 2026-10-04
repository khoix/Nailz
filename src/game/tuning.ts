export interface StrikeTuning {
  readonly nailLength: number;
  readonly setupDepth: number;
  readonly perfectRadius: number;
  readonly contactRadius: number;
  readonly perfectReticle: number;
  readonly minimumCap: number;
  readonly reticleExponent: number;
  readonly accuracyExponent: number;
  readonly maxBendRadians: number;
  readonly bendThreshold: number;
  readonly flushTolerance: number;
}
export const STRIKE_TUNING: Readonly<StrikeTuning> = Object.freeze({
  nailLength: 1,
  setupDepth: 0.16,
  perfectRadius: 0.035,
  // Sum of head radius (1) and effective hammer-face contact radius (0.65).
  contactRadius: 1.65,
  perfectReticle: 0.98,
  minimumCap: 0.12,
  reticleExponent: 1.6,
  accuracyExponent: 2,
  maxBendRadians: 0.9,
  bendThreshold: 0.015,
  flushTolerance: 1e-6,
});
export const INPUT_TUNING = Object.freeze({
  axisPeriodSeconds: 1.8, axisRange: 1.8, reticleDurationSeconds: 1,
  swipeReferenceViewportFraction: 0.35, swipeReferenceSeconds: 0.2,
});
export const MATCH_TUNING = Object.freeze({ nailsPerMatch: 5, humanTimingPreset: 'normal' as const });
