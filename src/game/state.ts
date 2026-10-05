import type { GameMode, MatchState, Participant, ParticipantId } from './types.ts';
import { createNail } from './strike.ts';
import { MATCH_TUNING } from './tuning.ts';
export const otherParticipant = (id: ParticipantId): ParticipantId => id === 'p1' ? 'p2' : 'p1';
export type ParticipantNames = Partial<Record<ParticipantId, string | null | undefined>>;
export const MAX_NAME_LENGTH = 12;
/** Optional local display names: trimmed, length-capped, falling back to the default identity. Solo names never rename the operator. */
export function participantName(mode: GameMode, id: ParticipantId, names: ParticipantNames = {}): string {
  const fallback = mode === 'solo' ? (id === 'p1' ? 'Player' : 'Operator') : (id === 'p1' ? 'Player 1' : 'Player 2');
  if (mode === 'solo' && id === 'p2') return fallback;
  const custom = (names[id] ?? '').trim().slice(0, MAX_NAME_LENGTH);
  return custom || fallback;
}
export function createMatch(mode: GameMode, firstStarter: ParticipantId = 'p1', names: ParticipantNames = {}): MatchState {
  const participants: [Participant, Participant] = [
    { id: 'p1', name: participantName(mode, 'p1', names), controller: 'human' },
    { id: 'p2', name: participantName(mode, 'p2', names), controller: mode === 'solo' ? 'ai' : 'human' },
  ];
  return { mode, participants, activeParticipant: firstStarter, firstStarter,
    phase: 'MATCH_INTRO', handoffRecipient: null, round: 1, nailsPerMatch: MATCH_TUNING.nailsPerMatch,
    nailsWon: { p1: 0, p2: 0 }, performanceScore: { p1: 0, p2: 0 }, nail: createNail(), pendingStrike: null };
}
