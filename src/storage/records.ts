import type { Difficulty, GameMode, ParticipantId } from '../game/types.ts';
export const RECORDS_KEY = 'nailz-records-v1';
export interface SoloRecord { matches: number; wins: number; bestNails: number; bestPoints: number | null; fewestStrikes: number | null; oneHits: number }
export interface LocalRecord { matches: number; p1Wins: number; p2Wins: number; oneHits: number }
/** Solo bests are per difficulty and never mixed with local pass-and-play totals. Names are match-local and never stored. */
export interface Records { version: 1; solo: Record<Difficulty, SoloRecord>; local: LocalRecord; tutorialSeen: Partial<Record<GameMode, boolean>> }
const emptySolo = (): SoloRecord => ({ matches: 0, wins: 0, bestNails: 0, bestPoints: null, fewestStrikes: null, oneHits: 0 });
export const createRecords = (): Records => ({ version: 1, solo: { easy: emptySolo(), normal: emptySolo(), hard: emptySolo(), champion: emptySolo() }, local: { matches: 0, p1Wins: 0, p2Wins: 0, oneHits: 0 }, tutorialSeen: {} });
const count = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
const optional = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : null;
/** Corrupt, foreign, or future-version data falls back to fresh records rather than throwing. */
export function parseRecords(raw: string | null | undefined): Records {
  const fresh = createRecords();
  if (!raw) return fresh;
  try {
    const data = JSON.parse(raw) as Partial<Records> | null;
    if (!data || typeof data !== 'object' || data.version !== 1) return fresh;
    for (const d of Object.keys(fresh.solo) as Difficulty[]) {
      const s = (data.solo as Partial<Record<Difficulty, Partial<SoloRecord>>> | undefined)?.[d];
      if (s && typeof s === 'object') fresh.solo[d] = { matches: count(s.matches), wins: count(s.wins), bestNails: Math.min(5, count(s.bestNails)), bestPoints: optional(s.bestPoints), fewestStrikes: optional(s.fewestStrikes), oneHits: count(s.oneHits) };
    }
    const l = data.local as Partial<LocalRecord> | undefined;
    if (l && typeof l === 'object') fresh.local = { matches: count(l.matches), p1Wins: count(l.p1Wins), p2Wins: count(l.p2Wins), oneHits: count(l.oneHits) };
    if (data.tutorialSeen && typeof data.tutorialSeen === 'object') for (const mode of ['solo', 'pass-and-play'] as GameMode[]) if (data.tutorialSeen[mode] === true) fresh.tutorialSeen[mode] = true;
    return fresh;
  } catch { return fresh; }
}
export interface MatchSummary { mode: GameMode; difficulty: Difficulty; winner: ParticipantId; nailsWon: Record<ParticipantId, number>; points: Record<ParticipantId, number>; humanStrikes: number; humanOneHits: number }
/** Pure update; the human in solo is always p1. Returns a new object so callers can diff. */
export function recordMatch(records: Records, m: MatchSummary): Records {
  const next: Records = structuredClone(records);
  if (m.mode === 'solo') {
    const s = next.solo[m.difficulty];
    s.matches++; if (m.winner === 'p1') s.wins++;
    s.bestNails = Math.max(s.bestNails, m.nailsWon.p1);
    s.bestPoints = s.bestPoints === null ? m.points.p1 : Math.max(s.bestPoints, m.points.p1);
    if (m.winner === 'p1') s.fewestStrikes = s.fewestStrikes === null ? m.humanStrikes : Math.min(s.fewestStrikes, m.humanStrikes);
    s.oneHits += m.humanOneHits;
  } else {
    next.local.matches++; next.local[m.winner === 'p1' ? 'p1Wins' : 'p2Wins']++; next.local.oneHits += m.humanOneHits;
  }
  return next;
}
export interface RecordsStore { readonly current: Records; update(fn: (r: Records) => Records): Records }
/** Storage failures (denied, quota, corrupt) degrade to in-memory records for the session. */
export function createRecordsStore(storage: Pick<Storage, 'getItem' | 'setItem'> | undefined): RecordsStore {
  let current: Records;
  try { current = parseRecords(storage?.getItem(RECORDS_KEY)); } catch { current = createRecords(); }
  return {
    get current() { return current; },
    update(fn) { current = fn(current); try { storage?.setItem(RECORDS_KEY, JSON.stringify(current)); } catch { /* keep in memory */ } return current; },
  };
}
