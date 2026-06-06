/**
 * Seeded PRNG using the mulberry32 algorithm.
 * Deterministic: same seed always produces the same sequence.
 */
export class PRNG {
  private state: number;

  constructor(seed: string) {
    this.state = PRNG.hashSeed(seed);
  }

  /** Hash a string seed into a 32-bit integer. */
  private static hashSeed(seed: string): number {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(31, h) + seed.charCodeAt(i);
      h = h | 0; // keep as 32-bit int
    }
    // Ensure non-zero state
    return h === 0 ? 1 : h;
  }

  /** Return a float in [0, 1). */
  next(): number {
    this.state += 0x6d2b79f5;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Return an integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Return true with the given probability (0-1). */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /** Pick a random element from an array. */
  pick<T>(arr: readonly T[]): T {
    // biome-ignore lint/style/noNonNullAssertion: index is guaranteed in bounds
    return arr[this.int(0, arr.length - 1)]!;
  }

  /** Shuffle an array in place (Fisher-Yates). */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const tmp = arr[i];
      arr[i] = arr[j] as T;
      arr[j] = tmp as T;
    }
    return arr;
  }
}
