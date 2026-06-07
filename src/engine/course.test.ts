import { describe, expect, it } from "vitest";
import { generateCourse } from "./course";
import {
  DEFAULT_COURSE_CONFIG,
  GRID_HEIGHT,
  GRID_WIDTH,
  Terrain,
  type Position,
} from "./types";

describe("generateCourse", () => {
  describe("determinism", () => {
    it("generates the same course for the same seed", () => {
      const a = generateCourse("deterministic", GRID_WIDTH, GRID_HEIGHT);
      const b = generateCourse("deterministic", GRID_WIDTH, GRID_HEIGHT);
      expect(a.tee).toEqual(b.tee);
      expect(a.hole).toEqual(b.hole);
      expect(a.grid).toEqual(b.grid);
      expect(a.seed).toBe(b.seed);
    });

    it("generates different courses for different seeds", () => {
      const a = generateCourse("alpha", GRID_WIDTH, GRID_HEIGHT);
      const b = generateCourse("beta", GRID_WIDTH, GRID_HEIGHT);
      const sameTee = a.tee.x === b.tee.x && a.tee.y === b.tee.y;
      const sameHole = a.hole.x === b.hole.x && a.hole.y === b.hole.y;
      expect(sameTee && sameHole).toBe(false);
    });
  });

  describe("grid dimensions", () => {
    it("creates a grid with the correct dimensions", () => {
      const course = generateCourse("dimensions", GRID_WIDTH, GRID_HEIGHT);
      expect(course.width).toBe(GRID_WIDTH);
      expect(course.height).toBe(GRID_HEIGHT);
      expect(course.grid).toHaveLength(GRID_HEIGHT);
      for (const row of course.grid) {
        expect(row).toHaveLength(GRID_WIDTH);
      }
    });

    it("works with non-standard dimensions", () => {
      const course = generateCourse("small", 10, 15);
      expect(course.width).toBe(10);
      expect(course.height).toBe(15);
      expect(course.grid).toHaveLength(15);
    });
  });

  describe("tee and hole placement", () => {
    it("places tee in the bottom third of the grid", () => {
      for (let i = 0; i < 20; i++) {
        const course = generateCourse(`tee-${i}`, GRID_WIDTH, GRID_HEIGHT);
        expect(course.tee.y).toBeGreaterThanOrEqual(Math.floor(GRID_HEIGHT * 0.6));
      }
    });

    it("places hole in the top third of the grid", () => {
      for (let i = 0; i < 20; i++) {
        const course = generateCourse(`hole-${i}`, GRID_WIDTH, GRID_HEIGHT);
        expect(course.hole.y).toBeLessThanOrEqual(Math.floor(GRID_HEIGHT * 0.35));
      }
    });

    it("places tee and hole within grid bounds", () => {
      for (let i = 0; i < 20; i++) {
        const course = generateCourse(`bounds-${i}`, GRID_WIDTH, GRID_HEIGHT);
        expect(course.tee.x).toBeGreaterThanOrEqual(0);
        expect(course.tee.x).toBeLessThan(GRID_WIDTH);
        expect(course.tee.y).toBeGreaterThanOrEqual(0);
        expect(course.tee.y).toBeLessThan(GRID_HEIGHT);
        expect(course.hole.x).toBeGreaterThanOrEqual(0);
        expect(course.hole.x).toBeLessThan(GRID_WIDTH);
        expect(course.hole.y).toBeGreaterThanOrEqual(0);
        expect(course.hole.y).toBeLessThan(GRID_HEIGHT);
      }
    });

    it("places tee on fairway", () => {
      for (let i = 0; i < 20; i++) {
        const course = generateCourse(`tee-fw-${i}`, GRID_WIDTH, GRID_HEIGHT);
        const cell = course.grid[course.tee.y]?.[course.tee.x];
        expect(cell?.terrain).toBe(Terrain.Fairway);
      }
    });

    it("places hole on fairway", () => {
      for (let i = 0; i < 20; i++) {
        const course = generateCourse(`hole-fw-${i}`, GRID_WIDTH, GRID_HEIGHT);
        const cell = course.grid[course.hole.y]?.[course.hole.x];
        expect(cell?.terrain).toBe(Terrain.Fairway);
      }
    });

    it("ensures tee has no slope", () => {
      for (let i = 0; i < 20; i++) {
        const course = generateCourse(`tee-ns-${i}`, GRID_WIDTH, GRID_HEIGHT);
        const cell = course.grid[course.tee.y]?.[course.tee.x];
        expect(cell?.slope).toBeNull();
      }
    });

    it("ensures hole has no slope", () => {
      for (let i = 0; i < 20; i++) {
        const course = generateCourse(`hole-ns-${i}`, GRID_WIDTH, GRID_HEIGHT);
        const cell = course.grid[course.hole.y]?.[course.hole.x];
        expect(cell?.slope).toBeNull();
      }
    });
  });

  describe("terrain variety", () => {
    it("contains at least fairway and rough", () => {
      const course = generateCourse("terrain-mix", GRID_WIDTH, GRID_HEIGHT);
      const terrains = new Set<Terrain>();
      for (const row of course.grid) {
        for (const cell of row) {
          terrains.add(cell.terrain);
        }
      }
      expect(terrains.has(Terrain.Fairway)).toBe(true);
      expect(terrains.has(Terrain.Rough)).toBe(true);
    });

    it("generates courses with trees across many seeds", () => {
      let foundTrees = false;
      for (let i = 0; i < 20; i++) {
        const course = generateCourse(`trees-${i}`, GRID_WIDTH, GRID_HEIGHT);
        for (const row of course.grid) {
          if (row.some((c) => c.terrain === Terrain.Trees)) {
            foundTrees = true;
            break;
          }
        }
        if (foundTrees) break;
      }
      expect(foundTrees).toBe(true);
    });

    it("generates courses with sand across many seeds", () => {
      let foundSand = false;
      for (let i = 0; i < 20; i++) {
        const course = generateCourse(`sand-${i}`, GRID_WIDTH, GRID_HEIGHT);
        for (const row of course.grid) {
          if (row.some((c) => c.terrain === Terrain.Sand)) {
            foundSand = true;
            break;
          }
        }
        if (foundSand) break;
      }
      expect(foundSand).toBe(true);
    });
  });

  describe("reachability", () => {
    it("produces a course where the hole is reachable from the tee", () => {
      for (let i = 0; i < 30; i++) {
        const course = generateCourse(`reach-${i}`, GRID_WIDTH, GRID_HEIGHT);

        const visited = new Set<string>();
        const queue = [course.tee];
        visited.add(`${course.tee.x},${course.tee.y}`);
        let found = false;

        while (queue.length > 0) {
          const pos = queue.shift();
          if (!pos) break;
          if (pos.x === course.hole.x && pos.y === course.hole.y) {
            found = true;
            break;
          }
          for (const [dx, dy] of [
            [0, -1], [0, 1], [1, 0], [-1, 0],
            [1, -1], [1, 1], [-1, -1], [-1, 1],
          ] as const) {
            const nx = pos.x + dx;
            const ny = pos.y + dy;
            const key = `${nx},${ny}`;
            if (visited.has(key)) continue;
            if (nx < 0 || nx >= course.width || ny < 0 || ny >= course.height) continue;
            const terrain = course.grid[ny]?.[nx]?.terrain;
            if (terrain === Terrain.Trees || terrain === Terrain.Water) continue;
            visited.add(key);
            queue.push({ x: nx, y: ny });
          }
        }

        expect(found).toBe(true);
      }
    });
  });

  describe("water invariant", () => {
    it("no non-water cell is enclosed by water", () => {
      for (let i = 0; i < 30; i++) {
        const course = generateCourse(`water-inv-${i}`, GRID_WIDTH, GRID_HEIGHT);
        const { grid, width, height } = course;

        // Flood-fill from all edge cells through non-water
        const visited = new Set<string>();
        const queue: Position[] = [];

        for (let x = 0; x < width; x++) {
          for (const y of [0, height - 1]) {
            if (grid[y]![x]!.terrain !== Terrain.Water) {
              const key = `${x},${y}`;
              if (!visited.has(key)) { visited.add(key); queue.push({ x, y }); }
            }
          }
        }
        for (let y = 0; y < height; y++) {
          for (const x of [0, width - 1]) {
            if (grid[y]![x]!.terrain !== Terrain.Water) {
              const key = `${x},${y}`;
              if (!visited.has(key)) { visited.add(key); queue.push({ x, y }); }
            }
          }
        }

        while (queue.length > 0) {
          const pos = queue.shift()!;
          for (const [dx, dy] of [[0,-1],[0,1],[1,0],[-1,0],[1,-1],[1,1],[-1,-1],[-1,1]] as const) {
            const nx = pos.x + dx;
            const ny = pos.y + dy;
            const key = `${nx},${ny}`;
            if (visited.has(key)) continue;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            if (grid[ny]![nx]!.terrain === Terrain.Water) continue;
            visited.add(key);
            queue.push({ x: nx, y: ny });
          }
        }

        // Every non-water cell must have been visited
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (grid[y]![x]!.terrain !== Terrain.Water) {
              expect(visited.has(`${x},${y}`)).toBe(true);
            }
          }
        }
      }
    });
  });

  describe("archetype distribution", () => {
    it("produces varied layouts across 100 seeds", () => {
      const layouts = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const course = generateCourse(`arch-${i}`, GRID_WIDTH, GRID_HEIGHT);
        const fairwayCells: string[] = [];
        for (let y = 0; y < course.height; y++) {
          for (let x = 0; x < course.width; x++) {
            if (course.grid[y]![x]!.terrain === Terrain.Fairway) {
              fairwayCells.push(`${x},${y}`);
            }
          }
        }
        layouts.add(fairwayCells.join("|"));
      }
      expect(layouts.size).toBeGreaterThanOrEqual(5);
    });
  });

  describe("config", () => {
    it("respects slope count of zero", () => {
      const config = { ...DEFAULT_COURSE_CONFIG, slopeCount: 0 };
      const course = generateCourse("no-slopes", GRID_WIDTH, GRID_HEIGHT, config);
      let hasSlope = false;
      for (const row of course.grid) {
        for (const cell of row) {
          if (cell.slope !== null) hasSlope = true;
        }
      }
      expect(hasSlope).toBe(false);
    });
  });

  describe("grid cell integrity", () => {
    it("every cell has a valid terrain value", () => {
      const course = generateCourse("integrity", GRID_WIDTH, GRID_HEIGHT);
      const validTerrains = new Set(Object.values(Terrain));
      for (const row of course.grid) {
        for (const cell of row) {
          expect(validTerrains.has(cell.terrain)).toBe(true);
        }
      }
    });

    it("slopes point to valid directions or are null", () => {
      const course = generateCourse("slope-dirs", GRID_WIDTH, GRID_HEIGHT);
      const validDirs = new Set(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]);
      for (const row of course.grid) {
        for (const cell of row) {
          if (cell.slope !== null) {
            expect(validDirs.has(cell.slope)).toBe(true);
          }
        }
      }
    });
  });
});
