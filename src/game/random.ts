/** Independent seeded streams for gameplay and cosmetic choices. */
export function createRandom(seed: number): () => number {
  if (!Number.isSafeInteger(seed)) throw new RangeError('Seed must be a safe integer.');
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
