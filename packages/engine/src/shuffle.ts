/**
 * Seeded pseudo-random number generator (xoshiro128**).
 * Enables deterministic shuffles for testing and replay.
 */
export function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
}

/**
 * Fisher-Yates shuffle.
 * Returns a new array — does not mutate the input.
 */
export function shuffle<T>(items: ReadonlyArray<T>, rng?: () => number): T[] {
  const arr = [...items];
  const random = rng ?? Math.random;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
