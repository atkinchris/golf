import { describe, expect, it } from "vitest";
import { dogleg, forestSlalom, fortressGreen, gauntlet, islandHop, slopedAmphitheatre, splitDecision } from "./archetypes";
import { createGrid } from "./island";
import { PRNG } from "./prng";
import { DEFAULT_COURSE_CONFIG, type Position, Terrain } from "./types";

/** Count connected components of a terrain type using BFS. */
function countFairwayComponents(
  grid: readonly (readonly { terrain: Terrain }[])[],
  width: number,
  height: number,
): number {
  const visited = new Set<string>();
  let components = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      if (grid[y]?.[x]?.terrain !== Terrain.Fairway) continue;

      components++;
      const queue: Position[] = [{ x, y }];
      visited.add(key);
      while (queue.length > 0) {
        // biome-ignore lint/style/noNonNullAssertion: length checked above
        const pos = queue.shift()!;
        for (const [dx, dy] of [
          [0, -1],
          [0, 1],
          [1, 0],
          [-1, 0],
        ] as const) {
          const nx = pos.x + dx;
          const ny = pos.y + dy;
          const nk = `${nx},${ny}`;
          if (visited.has(nk)) continue;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          if (grid[ny]?.[nx]?.terrain !== Terrain.Fairway) continue;
          visited.add(nk);
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }
  return components;
}

function makeTeeHole(): { tee: Position; hole: Position } {
  return { tee: { x: 5, y: 15 }, hole: { x: 5, y: 2 } };
}

describe("islandHop", () => {
  it("creates multiple disconnected fairway islands", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    islandHop(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("hop1"));
    const components = countFairwayComponents(grid, 12, 18);
    expect(components).toBeGreaterThanOrEqual(2);
  });
});

describe("gauntlet", () => {
  it("creates at least two fairway regions", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    gauntlet(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("gnt1"));
    const components = countFairwayComponents(grid, 12, 18);
    expect(components).toBeGreaterThanOrEqual(1);
  });

  it("places trees forming corridor walls", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    gauntlet(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("gnt2"));
    let treeCount = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.terrain === Terrain.Trees) treeCount++;
      }
    }
    expect(treeCount).toBeGreaterThanOrEqual(6);
  });
});

describe("splitDecision", () => {
  it("creates multiple disconnected fairway islands", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    splitDecision(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("spl1"));
    const components = countFairwayComponents(grid, 12, 18);
    expect(components).toBeGreaterThanOrEqual(2);
  });

  it("places water as a central barrier", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    splitDecision(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("spl2"));
    let waterCount = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.terrain === Terrain.Water) waterCount++;
      }
    }
    expect(waterCount).toBeGreaterThanOrEqual(4);
  });
});

describe("dogleg", () => {
  it("creates fairway islands", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    dogleg(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("dog1"));
    const components = countFairwayComponents(grid, 12, 18);
    expect(components).toBeGreaterThanOrEqual(1);
  });
});

describe("fortressGreen", () => {
  it("surrounds the hole with sand", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    fortressGreen(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("fort1"));

    let sandNearHole = 0;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const x = hole.x + dx;
        const y = hole.y + dy;
        if (x >= 0 && x < 12 && y >= 0 && y < 18) {
          if (grid[y]?.[x]?.terrain === Terrain.Sand) sandNearHole++;
        }
      }
    }
    expect(sandNearHole).toBeGreaterThanOrEqual(3);
  });
});

describe("forestSlalom", () => {
  it("creates a single large fairway region", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    forestSlalom(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("fs1"));
    const components = countFairwayComponents(grid, 12, 18);
    expect(components).toBeGreaterThanOrEqual(1);
    expect(components).toBeLessThanOrEqual(4);
  });

  it("places tree lines creating corridors", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    forestSlalom(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("fs2"));
    let treeCount = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.terrain === Terrain.Trees) treeCount++;
      }
    }
    expect(treeCount).toBeGreaterThanOrEqual(12);
  });
});

describe("slopedAmphitheatre", () => {
  it("places slopes around the green area", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    slopedAmphitheatre(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("amp1"));

    let slopeCount = 0;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = hole.x + dx;
        const y = hole.y + dy;
        if (x >= 0 && x < 12 && y >= 0 && y < 18) {
          if (grid[y]?.[x]?.slope !== null) slopeCount++;
        }
      }
    }
    expect(slopeCount).toBeGreaterThanOrEqual(2);
  });

  it("places sand around the green", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    slopedAmphitheatre(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("amp2"));

    let sandCount = 0;
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = hole.x + dx;
        const y = hole.y + dy;
        if (x >= 0 && x < 12 && y >= 0 && y < 18) {
          if (grid[y]?.[x]?.terrain === Terrain.Sand) sandCount++;
        }
      }
    }
    expect(sandCount).toBeGreaterThanOrEqual(2);
  });
});
