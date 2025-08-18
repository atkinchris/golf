/**
 * Deterministic random number generator using pure-rand
 */

import { RandomGenerator as PureRandomGenerator, xoroshiro128plus } from 'pure-rand'

export interface RandomGenerator {
  next(min: number, max: number): number
  nextFloat(): number
  clone(): RandomGenerator
}

class SeededRandomGenerator implements RandomGenerator {
  private rng: PureRandomGenerator

  constructor(seed: number = Date.now()) {
    this.rng = xoroshiro128plus(seed)
  }

  next(min: number, max: number): number {
    const [value, nextRng] = this.rng.next()
    this.rng = nextRng

    // Convert to range [min, max] inclusive
    const range = max - min + 1
    return min + Math.floor((value >>> 0) / (0x100000000 / range))
  }

  nextFloat(): number {
    const [value, nextRng] = this.rng.next()
    this.rng = nextRng

    // Convert to [0, 1)
    return (value >>> 0) / 0x100000000
  }

  clone(): RandomGenerator {
    const cloned = new SeededRandomGenerator()
    cloned.rng = this.rng
    return cloned
  }
}

export function createRandomGenerator(seed?: number): RandomGenerator {
  return new SeededRandomGenerator(seed)
}
