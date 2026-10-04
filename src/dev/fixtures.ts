import type { StrikeInput } from '../game/types.ts';
export const FIXTURES: Readonly<Record<string, StrikeInput>> = {
  'Perfect finish': { actor: 'p1', offset: { x: 0, y: 0 }, reticleQuality: 1, swipePower: 1 },
  'Weak centered': { actor: 'p1', offset: { x: 0, y: 0 }, reticleQuality: 1, swipePower: 0.3 },
  'Focus capped': { actor: 'p1', offset: { x: 0, y: 0 }, reticleQuality: 0.4, swipePower: 1 },
  'Left glance': { actor: 'p1', offset: { x: -0.85, y: 0 }, reticleQuality: 1, swipePower: 0.9 },
  'Diagonal glance': { actor: 'p1', offset: { x: 0.65, y: 0.65 }, reticleQuality: 1, swipePower: 1 },
  'Complete miss': { actor: 'p1', offset: { x: 1.8, y: 0 }, reticleQuality: 1, swipePower: 1 },
};
