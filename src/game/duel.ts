import { applyStrike, createNail, resolveStrike, straightenNail } from './strike.ts';
import { createRandom } from './random.ts';
import { sampleAI } from './ai.ts';
import { createMatch, otherParticipant, type ParticipantNames } from './state.ts';
import { INPUT_TUNING } from './tuning.ts';
import type { Difficulty, GameMode, Participant, GamePhase, NailState, ParticipantId, StrikeInput, StrikeResult, Vec2 } from './types.ts';
export const DUEL_TIMING = Object.freeze({ setup: .4, ready: .36, contact: .24, impact: .7, straighten: .45, operatorAim: .85, resume: .8, tapGuard: .12 });
export const axisPosition = (seconds: number): number => INPUT_TUNING.axisRange * Math.cos(seconds / INPUT_TUNING.axisPeriodSeconds * Math.PI * 2);
export const reticleRadius = (seconds: number): number => 2.5 - 2.15 * Math.min(1, seconds / INPUT_TUNING.reticleDurationSeconds);
export function focusQuality(seconds: number): number {
  const timingError = Math.abs(seconds - 1.5 / 2.15);
  return Math.max(0, 1 - Math.max(0, timingError - .035) / .3);
}
export interface DuelOptions { mode?: GameMode; difficulty?: Difficulty; firstStarter?: ParticipantId; names?: ParticipantNames }
export interface DuelSnapshot {
  readonly mode: GameMode;
  readonly difficulty: Difficulty;
  readonly participants: readonly Participant[];
  readonly isHuman: boolean;
  readonly round: number;
  readonly firstStarter: ParticipantId;
  readonly nailsWon: Readonly<Record<ParticipantId, number>>;
  readonly points: Readonly<Record<ParticipantId, number>>;
  readonly previousHuman: ParticipantId | null;
  readonly winner: ParticipantId | null;
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
/** Five-nail match simulation. No DOM, animation callbacks, wall clocks, or timers. */
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
  private mode: GameMode;
  private difficulty: Difficulty;
  private participants: readonly Participant[];
  private firstStarter: ParticipantId;
  private round = 1;
  private nailsWon = { p1: 0, p2: 0 };
  private points = { p1: 0, p2: 0 };
  private previousHuman: ParticipantId | null = null;
  private handoffAccepted = false;
  private aiInput: StrikeInput | null = null;
  constructor(seed = 9271, options: DuelOptions = {}) {
    this.random = createRandom(seed);
    this.mode = options.mode ?? 'solo'; this.difficulty = options.difficulty ?? 'normal';
    this.participants = createMatch(this.mode, 'p1', options.names).participants;
    this.firstStarter = options.firstStarter ?? (this.random() < .5 ? 'p1' : 'p2');
    this.actor = this.firstStarter;
  }
  private get isHuman() { return this.participants.find(p => p.id === this.actor)!.controller === 'human'; }
  get snapshot(): DuelSnapshot {
    return { mode: this.mode, difficulty: this.difficulty, participants: this.participants, isHuman: this.isHuman,
      round: this.round, firstStarter: this.firstStarter, nailsWon: {...this.nailsWon}, points: {...this.points}, previousHuman: this.previousHuman,
      winner: this.phase === 'MATCH_RESULT' ? (this.nailsWon.p1 > this.nailsWon.p2 ? 'p1' : 'p2') : null,
      phase: this.phase, elapsed: this.elapsed, actor: this.actor, nail: this.nail,
      aim: this.aim, quality: this.quality, pending: this.pending, lastResult: this.lastResult,
      actionId: this.actionId, appliedActionId: this.appliedActionId, paused: this.paused, resumeIn: this.resumeIn };
  }
  private enter(phase: GamePhase) { this.phase = phase; this.elapsed = 0; }
  start() { if (this.phase === 'MATCH_INTRO') this.beginTurn(); }
  restart(seed = 9271) {
    this.random = createRandom(seed);
    this.firstStarter = this.mode === 'pass-and-play' ? otherParticipant(this.firstStarter) : (this.random() < .5 ? 'p1' : 'p2');
    this.round = 1; this.nailsWon = {p1:0,p2:0}; this.points = {p1:0,p2:0};
    this.nail = createNail(); this.actor = this.firstStarter; this.previousHuman = null;
    this.lastResult = null; this.actionId = 0; this.appliedActionId = 0; this.paused = false; this.resumeIn = 0;
    this.beginTurn();
  }
  advanceRound() {
    if (this.phase !== 'ROUND_RESULT' || this.paused) return;
    if (this.round === 5) { this.enter('MATCH_RESULT'); return; }
    this.round++; this.nail = createNail(); this.lastResult = null;
    this.actor = this.round % 2 === 1 ? this.firstStarter : otherParticipant(this.firstStarter);
    this.beginTurn();
  }
  ready(): boolean {
    if (this.phase !== 'TURN_HANDOFF' || this.paused || this.resumeIn > 0) return false;
    this.handoffAccepted = true; this.enter('NAIL_SETUP'); return true;
  }
  pause() { if (!['MATCH_INTRO','ROUND_RESULT','MATCH_RESULT'].includes(this.phase)) this.paused = true; }
  resume() { if (this.paused) { this.paused = false; this.resumeIn = DUEL_TIMING.resume; } }
  tap() {
    if (this.paused || this.resumeIn > 0 || !this.isHuman || this.elapsed < DUEL_TIMING.tapGuard) return;
    if (this.phase === 'TARGET_Y') { this.aim = { ...this.aim, y: axisPosition(this.elapsed) }; this.enter('TARGET_X'); }
    else if (this.phase === 'TARGET_X') { this.aim = { ...this.aim, x: axisPosition(this.elapsed) }; this.enter('RETICLE'); }
    else if (this.phase === 'RETICLE') { this.quality = focusQuality(this.elapsed); this.enter('READY_TO_SWING'); }
  }
  swing(power: number): boolean {
    if (!this.isHuman || this.phase !== 'READY_TO_SWING' || this.elapsed < DUEL_TIMING.ready || this.paused || this.resumeIn > 0) return false;
    this.prepare({ actor: this.actor, offset: this.aim, reticleQuality: this.quality, swipePower: power }); return true;
  }
  private prepare(input: StrikeInput) {
    this.pending = resolveStrike(this.nail, input); this.actionId++; this.enter('SWING');
  }
  private beginTurn() {
    this.pending = null; this.aim = {x:0,y:0}; this.quality = 0;
    this.aiInput = null; this.handoffAccepted = false;
    if (!this.isHuman) {
      this.aiInput = sampleAI(this.difficulty, this.random, this.actor);
      this.aim = this.aiInput.offset; this.quality = this.aiInput.reticleQuality;
      this.enter('TARGET_Y');
    } else this.enter('NAIL_SETUP');
  }
  private nextTurn() { this.actor = otherParticipant(this.actor); this.beginTurn(); }
  tick(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Time must be finite and nonnegative');
    if (this.paused) return;
    let remaining = seconds;
    if (this.resumeIn > 0) { const used = Math.min(remaining, this.resumeIn); this.resumeIn -= used; remaining -= used; }
    // Consume phase boundaries so 30/60/120Hz resolve the same timeline.
    for (let i = 0; i < 32 && remaining > 1e-10; i++) {
      let duration = Infinity;
      if (this.phase === 'NAIL_SETUP') duration = DUEL_TIMING.setup;
      else if (!this.isHuman && this.phase === 'TARGET_Y') duration = DUEL_TIMING.operatorAim;
      else if (this.phase === 'RETICLE') duration = INPUT_TUNING.reticleDurationSeconds;
      else if (this.phase === 'SWING') duration = DUEL_TIMING.contact;
      else if (this.phase === 'IMPACT_RESOLUTION') duration = DUEL_TIMING.impact;
      else if (this.phase === 'NAIL_STRAIGHTEN') duration = DUEL_TIMING.straighten;
      if (['MATCH_INTRO','ROUND_RESULT','MATCH_RESULT','TURN_HANDOFF'].includes(this.phase)) return;
      const used = Math.min(remaining, Math.max(0, duration - this.elapsed));
      this.elapsed += used; remaining -= used;
      if (this.elapsed + 1e-10 < duration) return;
      if (this.phase === 'NAIL_SETUP') this.enter(this.mode === 'pass-and-play' && !this.handoffAccepted ? 'TURN_HANDOFF' : 'TARGET_Y');
      else if (!this.isHuman && this.phase === 'TARGET_Y') this.prepare(this.aiInput!);
      else if (this.phase === 'RETICLE') { this.quality = 0; this.enter('READY_TO_SWING'); }
      else if (this.phase === 'SWING') {
        if (this.pending && this.appliedActionId !== this.actionId) {
          this.nail = applyStrike(this.nail, this.pending);
          const r = this.pending;
          // Every award/penalty belongs only to this strike's actor. Negative totals are allowed.
          this.points[r.actor] += Math.round(r.depthDelta * 100) + (r.finishing ? 100 : 0) + (r.oneHit ? 50 : 0) - (!r.contact ? 10 : Math.hypot(r.bend.x,r.bend.y) > .08 ? 5 : 0);
          if (r.finishing) this.nailsWon[r.actor]++;
          if (this.isHuman) this.previousHuman = r.actor;
          this.lastResult = this.pending; this.appliedActionId = this.actionId;
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
