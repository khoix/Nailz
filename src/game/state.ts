import type { GameMode, MatchState, Participant, ParticipantId } from './types.ts';
import { createNail } from './strike.ts';
import { MATCH_TUNING } from './tuning.ts';
export const otherParticipant = (id: ParticipantId): ParticipantId => id === 'p1' ? 'p2' : 'p1';
export function createMatch(mode: GameMode, firstStarter: ParticipantId = 'p1'): MatchState {
  const participants: [Participant, Participant] = [
    { id: 'p1', name: mode === 'solo' ? 'Player' : 'Player 1', controller: 'human' },
    { id: 'p2', name: mode === 'solo' ? 'Operator' : 'Player 2', controller: mode === 'solo' ? 'ai' : 'human' },
  ];
  return { mode, participants, activeParticipant: firstStarter, firstStarter,
    phase: 'MATCH_INTRO', handoffRecipient: null, round: 1, nailsPerMatch: MATCH_TUNING.nailsPerMatch,
    nailsWon: { p1: 0, p2: 0 }, performanceScore: { p1: 0, p2: 0 }, nail: createNail(), pendingStrike: null };
}
