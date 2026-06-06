import { describe, expect, it } from "vitest";
import { PRNG } from "./prng";

describe("PRNG", () => {
  describe("determinism", () => {
    it("produces the same sequence for the same seed", () => {
      const a = new PRNG("test-seed");
      const b = new PRNG("test-seed");
      const valuesA = Array.from({ length: 20 }, () => a.next());
      const valuesB = Array.from({ length: 20 }, () => b.next());
      expect(valuesA).toEqual(valuesB);
    });

    it("produces different sequences for different seeds", () => {
      const a = new PRNG("seed-one");
      const b = new PRNG("seed-two");
      const valuesA = Array.from({ length: 10 }, () => a.next());
      const valuesB = Array.from({ length: 10 }, () => b.next());
      expect(valuesA).not.toEqual(valuesB);
    });

    it("handles an empty string seed without crashing", () => {
      const rng = new PRNG("");
      expect(rng.next()).toBeGreaterThanOrEqual(0);
      expect(rng.next()).toBeLessThan(1);
    });
  });

  describe("next", () => {
    it("returns values in [0, 1)", () => {
      const rng = new PRNG("range-check");
      for (let i = 0; i < 1000; i++) {
        const v = rng.next();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  describe("int", () => {
    it("returns values within the inclusive range", () => {
      const rng = new PRNG("int-range");
      for (let i = 0; i < 500; i++) {
        const v = rng.int(3, 7);
        expect(v).toBeGreaterThanOrEqual(3);
        expect(v).toBeLessThanOrEqual(7);
        expect(Number.isInteger(v)).toBe(true);
      }
    });

    it("returns the single value when min equals max", () => {
      const rng = new PRNG("single");
      for (let i = 0; i < 10; i++) {
        expect(rng.int(5, 5)).toBe(5);
      }
    });

    it("covers the full range over many calls", () => {
      const rng = new PRNG("coverage");
      const seen = new Set<number>();
      for (let i = 0; i < 1000; i++) {
        seen.add(rng.int(1, 6));
      }
      expect(seen).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    });
  });

  describe("chance", () => {
    it("returns true roughly at the expected rate", () => {
      const rng = new PRNG("chance-test");
      let trueCount = 0;
      const trials = 10000;
      for (let i = 0; i < trials; i++) {
        if (rng.chance(0.3)) trueCount++;
      }
      const rate = trueCount / trials;
      expect(rate).toBeGreaterThan(0.2);
      expect(rate).toBeLessThan(0.4);
    });

    it("always returns false for probability 0", () => {
      const rng = new PRNG("never");
      for (let i = 0; i < 100; i++) {
        expect(rng.chance(0)).toBe(false);
      }
    });

    it("always returns true for probability 1", () => {
      const rng = new PRNG("always");
      for (let i = 0; i < 100; i++) {
        expect(rng.chance(1)).toBe(true);
      }
    });
  });

  describe("pick", () => {
    it("returns an element from the array", () => {
      const rng = new PRNG("pick-test");
      const items = ["a", "b", "c", "d"] as const;
      for (let i = 0; i < 100; i++) {
        expect(items).toContain(rng.pick(items));
      }
    });

    it("covers all elements over many picks", () => {
      const rng = new PRNG("pick-coverage");
      const items = [10, 20, 30] as const;
      const seen = new Set<number>();
      for (let i = 0; i < 200; i++) {
        seen.add(rng.pick(items));
      }
      expect(seen).toEqual(new Set([10, 20, 30]));
    });
  });

  describe("shuffle", () => {
    it("returns an array with the same elements", () => {
      const rng = new PRNG("shuffle-test");
      const arr = [1, 2, 3, 4, 5];
      const result = rng.shuffle([...arr]);
      expect(result.sort()).toEqual(arr);
    });

    it("shuffles in place and returns the same reference", () => {
      const rng = new PRNG("shuffle-ref");
      const arr = [1, 2, 3];
      const result = rng.shuffle(arr);
      expect(result).toBe(arr);
    });

    it("produces a deterministic permutation", () => {
      const a = new PRNG("shuffle-det");
      const b = new PRNG("shuffle-det");
      expect(a.shuffle([1, 2, 3, 4, 5])).toEqual(b.shuffle([1, 2, 3, 4, 5]));
    });

    it("handles a single-element array", () => {
      const rng = new PRNG("one");
      expect(rng.shuffle([42])).toEqual([42]);
    });

    it("handles an empty array", () => {
      const rng = new PRNG("empty");
      expect(rng.shuffle([])).toEqual([]);
    });
  });
});
