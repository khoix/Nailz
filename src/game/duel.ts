import { applyStrike, createNail, resolveStrike, straightenNail } from './strike.ts';
import { createRandom } from './random.ts';
import { INPUT_TUNING } from './tuning.ts';
import type { GamePhase, NailState, ParticipantId, StrikeInput, StrikeResult, Vec2 } from './types.ts';
export const DUEL_TIMING = Object.freeze({ setup: .4, ready: .36, contact: .24, impact: .7, straighten: .45, operatorAim: .85, resume: .8, tapGuard: .12 });
export const axisPosition = (seconds: number): number => INPUT_TUNING.axisRange * Math.cos(seconds / INPUT_TUNING.axisPeriodSeconds * Math.PI * 2);
export const reticleRadius = (seconds: number): number => 2.5 - 2.15 * Math.min(1, seconds / INPUT_TUNING.reticleDurationSeconds);
export function focusQuality(seconds: number): number {
  const timingError = Math.abs(seconds - 1.5 / 2.15);
  return Math.max(0, 1 - Math.max(0, timingError - .035) / .3);
}
export interface DuelSnapshot {
  readonly phase: GamePhase;
  readonly elapsed: number;
  readonly actor: ParticipantId;
  readonly nail: NailState;
  readonly aim: Vec2;
  readonly quality: number;
  readonly pending: StrikeResult | null;
  readonly lastResult: StrikeResult | null;
  readonly actionId: number;
  readonly appliedActionId: number;
  readonly paused: boolean;
  readonly resumeIn: number;
}
/** Single-nail simulation. No DOM, animation callbacks, wall clocks, or timers. */
export class Duel {
  private phase: GamePhase = 'MATCH_INTRO';
  private elapsed = 0;
  private actor: ParticipantId = 'p1';
  private nail = createNail();
  private aim: Vec2 = { x: 0, y: 0 };
  private quality = 0;
  private pending: StrikeResult | null = null;
  private lastResult: StrikeResult | null = null;
  private actionId = 0;
  private appliedActionId = 0;
  private paused = false;
  private resumeIn = 0;
  private random: () => number;
  constructor(seed = 9271) { this.random = createRandom(seed); }
  get snapshot(): DuelSnapshot {
    return { phase: this.phase, elapsed: this.elapsed, actor: this.actor, nail: this.nail,
      aim: this.aim, quality: this.quality, pending: this.pending, lastResult: this.lastResult,
      actionId: this.actionId, appliedActionId: this.appliedActionId, paused: this.paused, resumeIn: this.resumeIn };
  }
  private enter(phase: GamePhase) { this.phase = phase; this.elapsed = 0; }
  start() { if (this.phase === 'MATCH_INTRO') this.enter('NAIL_SETUP'); }
  restart(seed = 9271) {
    this.random = createRandom(seed); this.nail = createNail(); this.actor = 'p1';
    this.aim = { x: 0, y: 0 }; this.quality = 0; this.pending = null; this.lastResult = null;
    this.actionId = 0; this.appliedActionId = 0; this.paused = false; this.resumeIn = 0;
    this.enter('NAIL_SETUP');
  }
  pause() { if (this.phase !== 'MATCH_INTRO' && this.phase !== 'ROUND_RESULT') this.paused = true; }
  resume() { if (this.paused) { this.paused = false; this.resumeIn = DUEL_TIMING.resume; } }
  tap() {
    if (this.paused || this.resumeIn > 0 || this.actor !== 'p1' || this.elapsed < DUEL_TIMING.tapGuard) return;
    if (this.phase === 'TARGET_Y') { this.aim = { ...this.aim, y: axisPosition(this.elapsed) }; this.enter('TARGET_X'); }
    else if (this.phase === 'TARGET_X') { this.aim = { ...this.aim, x: axisPosition(this.elapsed) }; this.enter('RETICLE'); }
    else if (this.phase === 'RETICLE') { this.quality = focusQuality(this.elapsed); this.enter('READY_TO_SWING'); }
  }
  swing(power: number): boolean {
    if (this.phase !== 'READY_TO_SWING' || this.elapsed < DUEL_TIMING.ready || this.paused || this.resumeIn > 0) return false;
    this.prepare({ actor: this.actor, offset: this.aim, reticleQuality: this.quality, swipePower: power }); return true;
  }
  private prepare(input: StrikeInput) {
    this.pending = resolveStrike(this.nail, input); this.actionId++; this.enter('SWING');
  }
  private nextTurn() {
    this.actor = this.actor === 'p1' ? 'p2' : 'p1'; this.pending = null; this.aim = { x: 0, y: 0 }; this.quality = 0;
    if (this.actor === 'p1') this.enter('NAIL_SETUP');
    else {
      // Symmetric bounded errors; sampled inputs are shown before the swing.
      this.aim = { x: (this.random() + this.random() - 1) * .95, y: (this.random() + this.random() - 1) * .95 };
      this.quality = .45 + this.random() * .55; this.enter('TARGET_Y');
    }
  }
  tick(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Time must be finite and nonnegative');
    if (this.paused) return;
    let remaining = seconds;
    if (this.resumeIn > 0) { const used = Math.min(remaining, this.resumeIn); this.resumeIn -= used; remaining -= used; }
    // Consume phase boundaries so 30/60/120Hz resolve the same timeline.
    for (let i = 0; i < 32 && remaining > 1e-10; i++) {
      let duration = Infinity;
      if (this.phase === 'NAIL_SETUP') duration = DUEL_TIMING.setup;
      else if (this.actor === 'p2' && this.phase === 'TARGET_Y') duration = DUEL_TIMING.operatorAim;
      else if (this.phase === 'RETICLE') duration = INPUT_TUNING.reticleDurationSeconds;
      else if (this.phase === 'SWING') duration = DUEL_TIMING.contact;
      else if (this.phase === 'IMPACT_RESOLUTION') duration = DUEL_TIMING.impact;
      else if (this.phase === 'NAIL_STRAIGHTEN') duration = DUEL_TIMING.straighten;
      if (this.phase === 'MATCH_INTRO' || this.phase === 'ROUND_RESULT') return;
      const used = Math.min(remaining, Math.max(0, duration - this.elapsed));
      this.elapsed += used; remaining -= used;
      if (this.elapsed + 1e-10 < duration) return;
      if (this.phase === 'NAIL_SETUP') this.enter('TARGET_Y');
      else if (this.actor === 'p2' && this.phase === 'TARGET_Y') this.prepare({ actor: 'p2', offset: this.aim, reticleQuality: this.quality, swipePower: .55 + this.random() * .45 });
      else if (this.phase === 'RETICLE') { this.quality = 0; this.enter('READY_TO_SWING'); }
      else if (this.phase === 'SWING') {
        if (this.pending && this.appliedActionId !== this.actionId) {
          this.nail = applyStrike(this.nail, this.pending); this.lastResult = this.pending; this.appliedActionId = this.actionId;
        }
        this.enter('IMPACT_RESOLUTION');
      } else if (this.phase === 'IMPACT_RESOLUTION') {
        if (this.nail.winner) this.enter('ROUND_RESULT');
        else if (Math.hypot(this.nail.bend.x, this.nail.bend.y) > 0) this.enter('NAIL_STRAIGHTEN');
        else this.nextTurn();
      } else if (this.phase === 'NAIL_STRAIGHTEN') { this.nail = straightenNail(this.nail); this.nextTurn(); }
    }
  }
}
