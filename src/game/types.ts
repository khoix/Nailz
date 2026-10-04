/** Positions are nail-local: +x right, +y up in the fixed target view. */
export interface Vec2 { readonly x: number; readonly y: number }
export type ParticipantId = 'p1' | 'p2';
export type ControllerKind = 'human' | 'ai';
export type GameMode = 'solo' | 'pass-and-play';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'champion';
export interface Participant { readonly id: ParticipantId; readonly name: string; readonly controller: ControllerKind }
export type GamePhase = 'BOOT' | 'TITLE' | 'MODE_SELECT' | 'MATCH_INTRO' | 'NAIL_SETUP'
  | 'TURN_HANDOFF' | 'TARGET_Y' | 'TARGET_X' | 'RETICLE' | 'READY_TO_SWING'
  | 'SWING' | 'IMPACT_RESOLUTION' | 'NAIL_STRAIGHTEN' | 'ROUND_RESULT' | 'MATCH_RESULT' | 'PAUSED';
export interface NailState {
  readonly length: number;
  /** Insertion from tip to wood surface, in world units. */
  readonly depth: number;
  /** Temporary deflection in radians, directed away from contact. */
  readonly bend: Vec2;
  readonly strikeCount: number;
  readonly winner: ParticipantId | null;
}
export interface StrikeInput {
  readonly actor: ParticipantId;
  readonly offset: Vec2;
  readonly reticleQuality: number;
  readonly swipePower: number;
}
export interface StrikeResult {
  readonly actor: ParticipantId;
  readonly offset: Vec2;
  readonly radialError: number;
  readonly contact: boolean;
  readonly reticleQuality: number;
  readonly swipePower: number;
  readonly powerCap: number;
  readonly usablePower: number;
  readonly efficiency: number;
  readonly downwardForce: number;
  readonly lateralForce: number;
  readonly strikeCountBefore: number;
  readonly depthBefore: number;
  readonly depthAfter: number;
  readonly depthDelta: number;
  readonly bend: Vec2;
  readonly perfect: boolean;
  readonly finishing: boolean;
  readonly oneHit: boolean;
}
export interface MatchState {
  readonly mode: GameMode;
  readonly participants: readonly [Participant, Participant];
  readonly activeParticipant: ParticipantId;
  readonly firstStarter: ParticipantId;
  readonly phase: GamePhase;
  readonly handoffRecipient: ParticipantId | null;
  readonly round: number;
  readonly nailsPerMatch: number;
  readonly nailsWon: Readonly<Record<ParticipantId, number>>;
  readonly performanceScore: Readonly<Record<ParticipantId, number>>;
  readonly nail: NailState;
  /** E2 applies a resolved strike exactly once at contact. */
  readonly pendingStrike: { readonly id: number; readonly result: StrikeResult; readonly applied: boolean } | null;
}
