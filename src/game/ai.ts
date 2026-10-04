import type { Difficulty, ParticipantId, StrikeInput } from './types.ts';
/** Inputs only: presets never inspect depth, score, or the opponent. */
export const AI_PRESETS = Object.freeze({
  easy: { error: 1.8, focus: .3, power: .4, perfect: .001 },
  normal: { error: .95, focus: .45, power: .55, perfect: .006 },
  hard: { error: .5, focus: .7, power: .75, perfect: .025 },
  champion: { error: .22, focus: .86, power: .9, perfect: .22 },
});
export function sampleAI(difficulty: Difficulty, random: () => number, actor: ParticipantId = 'p2'): StrikeInput {
  const p = AI_PRESETS[difficulty];
  // Occasional full-focus centered swing is reachable under the same human rules.
  const perfect = random() < p.perfect;
  const x = (random()+random()-1)*p.error, y = (random()+random()-1)*p.error;
  const quality = p.focus + random()*(1-p.focus), power = p.power+random()*(1-p.power);
  return { actor, offset: perfect ? {x:0,y:0} : {x,y}, reticleQuality: perfect ? 1 : quality, swipePower: perfect ? 1 : power };
}
