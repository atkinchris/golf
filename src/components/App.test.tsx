import { describe, expect, it } from "vitest";
import { generateSeed } from "./App";

describe("generateSeed", () => {
  it("produces a three-word hyphenated string", () => {
    const seed = generateSeed();
    const parts = seed.split("-");
    expect(parts).toHaveLength(3);
    for (const p of parts) {
      expect(p.length).toBeGreaterThan(0);
    }
  });

  it("produces different seeds on repeated calls", () => {
    const seeds = new Set(Array.from({ length: 20 }, () => generateSeed()));
    expect(seeds.size).toBeGreaterThan(1);
  });
});
