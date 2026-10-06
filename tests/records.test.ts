import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecords, createRecordsStore, parseRecords, recordMatch, RECORDS_KEY, type MatchSummary } from '../src/storage/records.ts';
const solo = (over: Partial<MatchSummary> = {}): MatchSummary => ({ mode: 'solo', difficulty: 'hard', winner: 'p1', nailsWon: { p1: 3, p2: 2 }, points: { p1: 640, p2: 410 }, humanStrikes: 9, humanOneHits: 1, ...over });
test('solo records are per difficulty and separate from local totals', () => {
  let r = recordMatch(createRecords(), solo());
  r = recordMatch(r, solo({ winner: 'p2', nailsWon: { p1: 1, p2: 4 }, points: { p1: 120, p2: 700 }, humanStrikes: 14, humanOneHits: 0 }));
  r = recordMatch(r, solo({ difficulty: 'easy', humanStrikes: 7 }));
  r = recordMatch(r, { mode: 'pass-and-play', difficulty: 'normal', winner: 'p2', nailsWon: { p1: 2, p2: 3 }, points: { p1: 0, p2: 0 }, humanStrikes: 20, humanOneHits: 2 });
  assert.deepEqual(r.solo.hard, { matches: 2, wins: 1, bestNails: 3, bestPoints: 640, fewestStrikes: 9, oneHits: 1 });
  assert.deepEqual(r.solo.easy, { matches: 1, wins: 1, bestNails: 3, bestPoints: 640, fewestStrikes: 7, oneHits: 1 });
  assert.equal(r.solo.normal.matches, 0);
  assert.deepEqual(r.local, { matches: 1, p1Wins: 0, p2Wins: 1, oneHits: 2 });
});
test('fewest strikes only counts wins and the update is pure', () => {
  const base = createRecords();
  const r = recordMatch(base, solo({ winner: 'p2', humanStrikes: 3 }));
  assert.equal(r.solo.hard.fewestStrikes, null); assert.equal(base.solo.hard.matches, 0);
});
test('corrupt, foreign, and future data fall back safely', () => {
  assert.deepEqual(parseRecords('not json'), createRecords());
  assert.deepEqual(parseRecords(JSON.stringify({ version: 2, solo: {} })), createRecords());
  const r = parseRecords(JSON.stringify({ version: 1, solo: { hard: { matches: -4, wins: '9', bestNails: 99, oneHits: 2.7 } }, local: { matches: 3 }, tutorialSeen: { solo: true, bogus: true } }));
  assert.deepEqual(r.solo.hard, { matches: 0, wins: 0, bestNails: 5, bestPoints: null, fewestStrikes: null, oneHits: 2 });
  assert.equal(r.local.matches, 3); assert.deepEqual(r.tutorialSeen, { solo: true });
});
test('store persists when it can and keeps working when storage is denied', () => {
  const map = new Map<string, string>();
  const ok = createRecordsStore({ getItem: k => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) });
  ok.update(r => recordMatch(r, solo()));
  assert.equal(parseRecords(map.get(RECORDS_KEY)).solo.hard.matches, 1);
  const denied = createRecordsStore({ getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } });
  assert.equal(denied.update(r => recordMatch(r, solo())).solo.hard.matches, 1);
  assert.equal(createRecordsStore(undefined).current.local.matches, 0);
});
