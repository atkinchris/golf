import { describe, expect, it } from "vitest";
import {
  type Cell,
  type Course,
  DIRECTION_VECTORS,
  type Direction,
  type Position,
  Terrain,
} from "./types";
import { getCell, getTerrainModifier, posEq, resolveSlopeChain, validateMove } from "./validation";

// ---- Helpers ----

/** Build a small course from a terrain map for testing. */
function makeCourse(
  terrainMap: Terrain[][],
  tee: Position,
  hole: Position,
  slopes?: { pos: Position; dir: Direction }[],
): Course {
  const height = terrainMap.length;
  const width = terrainMap[0]?.length ?? 0;
  const grid: Cell[][] = terrainMap.map((row) => row.map((terrain) => ({ terrain, slope: null })));
  if (slopes) {
    for (const s of slopes) {
      const cell = grid[s.pos.y]?.[s.pos.x];
      if (cell) cell.slope = s.dir;
    }
  }
  return { grid, width, height, tee, hole, seed: "test" };
}

const R = Terrain.Rough;
const F = Terrain.Fairway;
const W = Terrain.Water;
const T = Terrain.Trees;

// ---- Tests ----

describe("getTerrainModifier", () => {
  it("returns +1 for fairway", () => {
    expect(getTerrainModifier(Terrain.Fairway)).toBe(1);
  });

  it("returns -1 for sand", () => {
    expect(getTerrainModifier(Terrain.Sand)).toBe(-1);
  });

  it("returns 0 for rough", () => {
    expect(getTerrainModifier(Terrain.Rough)).toBe(0);
  });

  it("returns 0 for water", () => {
    expect(getTerrainModifier(Terrain.Water)).toBe(0);
  });

  it("returns 0 for trees", () => {
    expect(getTerrainModifier(Terrain.Trees)).toBe(0);
  });
});

describe("getCell", () => {
  const course = makeCourse(
    [
      [R, F, R],
      [R, F, R],
      [R, F, R],
    ],
    { x: 1, y: 2 },
    { x: 1, y: 0 },
  );

  it("returns the cell at a valid position", () => {
    const cell = getCell(course, { x: 1, y: 0 });
    expect(cell?.terrain).toBe(Terrain.Fairway);
  });

  it("returns null for negative x", () => {
    expect(getCell(course, { x: -1, y: 0 })).toBeNull();
  });

  it("returns null for x beyond width", () => {
    expect(getCell(course, { x: 3, y: 0 })).toBeNull();
  });

  it("returns null for negative y", () => {
    expect(getCell(course, { x: 0, y: -1 })).toBeNull();
  });

  it("returns null for y beyond height", () => {
    expect(getCell(course, { x: 0, y: 3 })).toBeNull();
  });
});

describe("posEq", () => {
  it("returns true for equal positions", () => {
    expect(posEq({ x: 3, y: 5 }, { x: 3, y: 5 })).toBe(true);
  });

  it("returns false when x differs", () => {
    expect(posEq({ x: 3, y: 5 }, { x: 4, y: 5 })).toBe(false);
  });

  it("returns false when y differs", () => {
    expect(posEq({ x: 3, y: 5 }, { x: 3, y: 6 })).toBe(false);
  });
});

describe("resolveSlopeChain", () => {
  it("returns empty chain when no slope on the cell", () => {
    const course = makeCourse([[F, F, F]], { x: 0, y: 0 }, { x: 2, y: 0 });
    const { chain, final } = resolveSlopeChain(course, { x: 1, y: 0 });
    expect(chain).toEqual([]);
    expect(final).toEqual({ x: 1, y: 0 });
  });

  it("follows a single slope step", () => {
    //  F(slope E) -> F -> F(hole)
    const course = makeCourse([[F, F, F]], { x: 0, y: 0 }, { x: 2, y: 0 }, [
      { pos: { x: 0, y: 0 }, dir: "E" },
    ]);
    const { chain, final } = resolveSlopeChain(course, { x: 0, y: 0 });
    expect(chain).toEqual([{ x: 1, y: 0 }]);
    expect(final).toEqual({ x: 1, y: 0 });
  });

  it("follows multiple slope steps in a chain", () => {
    // F(slope E) -> F(slope E) -> F
    const course = makeCourse([[F, F, F]], { x: 0, y: 0 }, { x: 2, y: 0 }, [
      { pos: { x: 0, y: 0 }, dir: "E" },
      { pos: { x: 1, y: 0 }, dir: "E" },
    ]);
    const { chain, final } = resolveSlopeChain(course, { x: 0, y: 0 });
    expect(chain).toEqual([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
    expect(final).toEqual({ x: 2, y: 0 });
  });

  it("stops when slope points out of bounds", () => {
    // F(slope W) at x=0 - slope points off the grid
    const course = makeCourse([[F, F]], { x: 0, y: 0 }, { x: 1, y: 0 }, [
      { pos: { x: 0, y: 0 }, dir: "W" },
    ]);
    const { chain, final } = resolveSlopeChain(course, { x: 0, y: 0 });
    expect(chain).toEqual([]);
    expect(final).toEqual({ x: 0, y: 0 });
  });

  it("stops when slope points into water", () => {
    // F(slope E) -> W
    const course = makeCourse([[F, W]], { x: 0, y: 0 }, { x: 0, y: 0 }, [
      { pos: { x: 0, y: 0 }, dir: "E" },
    ]);
    const { chain, final } = resolveSlopeChain(course, { x: 0, y: 0 });
    expect(chain).toEqual([]);
    expect(final).toEqual({ x: 0, y: 0 });
  });

  it("stops on a cycle (two slopes facing each other)", () => {
    // F(slope E) <-> F(slope W) - would loop forever without cycle detection
    const course = makeCourse([[F, F]], { x: 0, y: 0 }, { x: 1, y: 0 }, [
      { pos: { x: 0, y: 0 }, dir: "E" },
      { pos: { x: 1, y: 0 }, dir: "W" },
    ]);
    const { chain, final } = resolveSlopeChain(course, { x: 0, y: 0 });
    // Moves to (1,0), detects cycle, stops
    expect(chain).toEqual([{ x: 1, y: 0 }]);
    expect(final).toEqual({ x: 1, y: 0 });
  });
});

describe("validateMove", () => {
  describe("basic movement", () => {
    it("allows a valid move on open terrain", () => {
      // 5-wide row of rough
      const course = makeCourse([[R, R, R, R, R]], { x: 0, y: 0 }, { x: 4, y: 0 });
      const result = validateMove(course, { x: 0, y: 0 }, "E", 3);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.landingPosition).toEqual({ x: 3, y: 0 });
        expect(result.holesOut).toBe(false);
      }
    });

    it("detects holing out on exact landing", () => {
      const course = makeCourse([[R, R, R]], { x: 0, y: 0 }, { x: 2, y: 0 });
      const result = validateMove(course, { x: 0, y: 0 }, "E", 2);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.holesOut).toBe(true);
        expect(result.landingPosition).toEqual({ x: 2, y: 0 });
      }
    });
  });

  describe("out of bounds", () => {
    it("rejects a move that goes off the grid", () => {
      const course = makeCourse([[R, R, R]], { x: 0, y: 0 }, { x: 2, y: 0 });
      const result = validateMove(course, { x: 1, y: 0 }, "E", 3);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toMatch(/out of bounds/i);
      }
    });
  });

  describe("trees", () => {
    it("blocks path through trees from rough", () => {
      // R -> T -> R
      const course = makeCourse([[R, T, R]], { x: 0, y: 0 }, { x: 2, y: 0 });
      const result = validateMove(course, { x: 0, y: 0 }, "E", 2);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toMatch(/trees/i);
      }
    });

    it("allows flying over trees from fairway", () => {
      // F -> T -> R
      const course = makeCourse([[F, T, R]], { x: 0, y: 0 }, { x: 2, y: 0 });
      const result = validateMove(course, { x: 0, y: 0 }, "E", 2);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.landingPosition).toEqual({ x: 2, y: 0 });
      }
    });

    it("rejects landing on trees even from fairway", () => {
      // F -> T (distance 1 = landing on trees)
      const course = makeCourse([[F, T]], { x: 0, y: 0 }, { x: 0, y: 0 });
      const result = validateMove(course, { x: 0, y: 0 }, "E", 1);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toMatch(/trees/i);
      }
    });
  });

  describe("water", () => {
    it("allows flying over water", () => {
      // R -> W -> R
      const course = makeCourse([[R, W, R]], { x: 0, y: 0 }, { x: 2, y: 0 });
      const result = validateMove(course, { x: 0, y: 0 }, "E", 2);
      expect(result.valid).toBe(true);
    });

    it("rejects landing in water", () => {
      const course = makeCourse([[R, W]], { x: 0, y: 0 }, { x: 0, y: 0 });
      const result = validateMove(course, { x: 0, y: 0 }, "E", 1);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toMatch(/water/i);
      }
    });
  });

  describe("overshoot rule", () => {
    it("holes out when overshooting by exactly 1", () => {
      // Ball at (0,0), hole at (1,0), distance 2 -> overshoot by 1
      const course = makeCourse([[R, R, R]], { x: 0, y: 0 }, { x: 1, y: 0 });
      const result = validateMove(course, { x: 0, y: 0 }, "E", 2);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.holesOut).toBe(true);
        expect(result.landingPosition).toEqual({ x: 1, y: 0 });
      }
    });

    it("does not hole out when overshooting by more than 1", () => {
      // Ball at (0,0), hole at (1,0), distance 3 -> overshoot by 2, passes over
      const course = makeCourse([[R, R, R, R]], { x: 0, y: 0 }, { x: 1, y: 0 });
      const result = validateMove(course, { x: 0, y: 0 }, "E", 3);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.holesOut).toBe(false);
        expect(result.landingPosition).toEqual({ x: 3, y: 0 });
      }
    });
  });

  describe("slopes on landing", () => {
    it("applies slope after landing", () => {
      // R -> R(slope E) -> R
      const course = makeCourse([[R, R, R]], { x: 0, y: 0 }, { x: 2, y: 0 }, [
        { pos: { x: 1, y: 0 }, dir: "E" },
      ]);
      const result = validateMove(course, { x: 0, y: 0 }, "E", 1);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.landingPosition).toEqual({ x: 2, y: 0 });
        expect(result.slopeChain).toEqual([{ x: 2, y: 0 }]);
      }
    });

    it("holes out via slope chain", () => {
      // R -> R(slope E) -> hole
      const course = makeCourse([[R, R, R]], { x: 0, y: 0 }, { x: 2, y: 0 }, [
        { pos: { x: 1, y: 0 }, dir: "E" },
      ]);
      const result = validateMove(course, { x: 0, y: 0 }, "E", 1);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.holesOut).toBe(true);
      }
    });
  });

  describe("diagonal movement", () => {
    it("moves diagonally", () => {
      const course = makeCourse(
        [
          [R, R, R],
          [R, R, R],
          [R, R, R],
        ],
        { x: 0, y: 2 },
        { x: 2, y: 0 },
      );
      const result = validateMove(course, { x: 0, y: 2 }, "NE", 2);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.landingPosition).toEqual({ x: 2, y: 0 });
        expect(result.holesOut).toBe(true);
      }
    });

    it("checks all cells along a diagonal path", () => {
      // Diagonal path NE blocked by trees at (1,1) from rough
      const course = makeCourse(
        [
          [R, R, R],
          [R, T, R],
          [R, R, R],
        ],
        { x: 0, y: 2 },
        { x: 2, y: 0 },
      );
      const result = validateMove(course, { x: 0, y: 2 }, "NE", 2);
      expect(result.valid).toBe(false);
    });
  });

  describe("direction vectors", () => {
    it("all 8 directions have correct vectors", () => {
      expect(DIRECTION_VECTORS.N).toEqual({ dx: 0, dy: -1 });
      expect(DIRECTION_VECTORS.S).toEqual({ dx: 0, dy: 1 });
      expect(DIRECTION_VECTORS.E).toEqual({ dx: 1, dy: 0 });
      expect(DIRECTION_VECTORS.W).toEqual({ dx: -1, dy: 0 });
      expect(DIRECTION_VECTORS.NE).toEqual({ dx: 1, dy: -1 });
      expect(DIRECTION_VECTORS.NW).toEqual({ dx: -1, dy: -1 });
      expect(DIRECTION_VECTORS.SE).toEqual({ dx: 1, dy: 1 });
      expect(DIRECTION_VECTORS.SW).toEqual({ dx: -1, dy: 1 });
    });
  });
});
