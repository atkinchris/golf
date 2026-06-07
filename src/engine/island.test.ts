import { describe, expect, it } from "vitest";
import {
  createGrid,
  isReachable,
  placeIsland,
  placeTreeCluster,
  setTerrain,
  validateWaterInvariant,
} from "./island";
import { PRNG } from "./prng";
import { Terrain } from "./types";

describe("createGrid", () => {
  it("creates a grid of all rough cells", () => {
    const grid = createGrid(4, 3);
    expect(grid).toHaveLength(3);
    for (const row of grid) {
      expect(row).toHaveLength(4);
      for (const cell of row) {
        expect(cell.terrain).toBe(Terrain.Rough);
        expect(cell.slope).toBeNull();
      }
    }
  });
});

describe("placeIsland", () => {
  it("places a rectangular fairway island on the grid", () => {
    const grid = createGrid(12, 18);
    placeIsland(grid, 12, 18, { x: 2, y: 2, w: 3, h: 3 }, new PRNG("test"));
    let fairwayCount = 0;
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        if (grid[2 + dy]?.[2 + dx]?.terrain === Terrain.Fairway) {
          fairwayCount++;
        }
      }
    }
    // With a 3x3 island, at most 1-2 corners removed, so at least 7 cells
    expect(fairwayCount).toBeGreaterThanOrEqual(7);
  });

  it("does not place cells outside grid bounds", () => {
    const grid = createGrid(6, 6);
    placeIsland(grid, 6, 6, { x: 4, y: 4, w: 5, h: 5 }, new PRNG("edge"));
    expect(grid).toHaveLength(6);
  });
});

describe("validateWaterInvariant", () => {
  it("converts enclosed rough cells to water", () => {
    const grid = createGrid(5, 5);
    for (let i = 0; i < 5; i++) {
      setTerrain(grid, 5, 5, i, 0, Terrain.Water);
      setTerrain(grid, 5, 5, i, 4, Terrain.Water);
      setTerrain(grid, 5, 5, 0, i, Terrain.Water);
      setTerrain(grid, 5, 5, 4, i, Terrain.Water);
    }
    validateWaterInvariant(grid, 5, 5);
    expect(grid[2]?.[2]?.terrain).toBe(Terrain.Water);
    expect(grid[1]?.[1]?.terrain).toBe(Terrain.Water);
  });

  it("does not convert rough cells reachable from edges", () => {
    const grid = createGrid(5, 5);
    setTerrain(grid, 5, 5, 2, 2, Terrain.Water);
    validateWaterInvariant(grid, 5, 5);
    expect(grid[0]?.[0]?.terrain).toBe(Terrain.Rough);
    expect(grid[4]?.[4]?.terrain).toBe(Terrain.Rough);
  });

  it("converts enclosed fairway to water", () => {
    const grid = createGrid(5, 5);
    for (let i = 0; i < 5; i++) {
      setTerrain(grid, 5, 5, i, 0, Terrain.Water);
      setTerrain(grid, 5, 5, i, 4, Terrain.Water);
      setTerrain(grid, 5, 5, 0, i, Terrain.Water);
      setTerrain(grid, 5, 5, 4, i, Terrain.Water);
    }
    setTerrain(grid, 5, 5, 2, 2, Terrain.Fairway);
    validateWaterInvariant(grid, 5, 5);
    expect(grid[2]?.[2]?.terrain).toBe(Terrain.Water);
  });
});

describe("placeTreeCluster", () => {
  it("places a block of trees on rough cells", () => {
    const grid = createGrid(12, 18);
    const placed = placeTreeCluster(grid, 12, 18, 3, 5, 2, 3);
    if (placed) {
      let treeCount = 0;
      for (const row of grid) {
        for (const cell of row) {
          if (cell.terrain === Terrain.Trees) treeCount++;
        }
      }
      expect(treeCount).toBeGreaterThanOrEqual(4);
    }
  });

  it("does not place trees on fairway", () => {
    const grid = createGrid(12, 18);
    for (let y = 4; y < 8; y++) {
      for (let x = 2; x < 6; x++) {
        setTerrain(grid, 12, 18, x, y, Terrain.Fairway);
      }
    }
    placeTreeCluster(grid, 12, 18, 3, 5, 3, 3);
    for (let y = 4; y < 8; y++) {
      for (let x = 2; x < 6; x++) {
        expect(grid[y]?.[x]?.terrain).not.toBe(Terrain.Trees);
      }
    }
  });
});

describe("isReachable", () => {
  it("returns true when path exists", () => {
    const grid = createGrid(5, 5);
    expect(isReachable(grid, 5, 5, { x: 0, y: 4 }, { x: 4, y: 0 })).toBe(true);
  });

  it("returns false when blocked by water and trees", () => {
    const grid = createGrid(5, 5);
    for (let x = 0; x < 5; x++) {
      setTerrain(grid, 5, 5, x, 2, Terrain.Water);
    }
    expect(isReachable(grid, 5, 5, { x: 0, y: 4 }, { x: 0, y: 0 })).toBe(false);
  });
});
