import { describe, expect, it } from "vitest";
import { generateSeed, getSeedFromUrl, writeSeedToUrl } from "./App";

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

describe("getSeedFromUrl", () => {
  it("returns the seed from a query string", () => {
    expect(getSeedFromUrl("?seed=brave-copper-wolf")).toBe("brave-copper-wolf");
  });

  it("returns null when no seed param is present", () => {
    expect(getSeedFromUrl("")).toBeNull();
    expect(getSeedFromUrl("?foo=bar")).toBeNull();
  });
});

describe("writeSeedToUrl", () => {
  it("sets ?seed= in the URL using replaceState", () => {
    writeSeedToUrl("brave-copper-wolf", true);
    expect(window.location.search).toContain("seed=brave-copper-wolf");
  });

  it("sets ?seed= in the URL using pushState", () => {
    writeSeedToUrl("happy-red-fox", false);
    expect(window.location.search).toContain("seed=happy-red-fox");
  });
});
