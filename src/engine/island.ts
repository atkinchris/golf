import type { PRNG } from "./prng";
import {
  type Cell,
  type Direction,
  DIRECTION_VECTORS,
  DIRECTIONS,
  type Position,
  Terrain,
} from "./types";

/** Rectangle describing where to place an island. */
export interface IslandRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Create an empty grid filled with rough. */
export function createGrid(width: number, height: number): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      terrain: Terrain.Rough,
      slope: null,
    })),
  );
}

/** Get terrain at a position, or null if out of bounds. */
export function getTerrain(
  grid: Cell[][],
  width: number,
  height: number,
  x: number,
  y: number,
): Terrain | null {
  if (x < 0 || x >= width || y < 0 || y >= height) return null;
  return grid[y]?.[x]?.terrain ?? null;
}

/** Set terrain at a position if in bounds. */
export function setTerrain(
  grid: Cell[][],
  width: number,
  height: number,
  x: number,
  y: number,
  terrain: Terrain,
): void {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    const cell = grid[y]?.[x];
    if (cell) cell.terrain = terrain;
  }
}

/**
 * Place a rectangular fairway island with irregular edges.
 * Randomly removes 1-2 corner cells for a blocky, tabletop feel.
 */
export function placeIsland(
  grid: Cell[][],
  width: number,
  height: number,
  rect: IslandRect,
  rng: PRNG,
): void {
  const cells: Position[] = [];
  for (let dy = 0; dy < rect.h; dy++) {
    for (let dx = 0; dx < rect.w; dx++) {
      cells.push({ x: rect.x + dx, y: rect.y + dy });
    }
  }

  const corners = cells.filter(
    (c) =>
      (c.x === rect.x || c.x === rect.x + rect.w - 1) &&
      (c.y === rect.y || c.y === rect.y + rect.h - 1),
  );

  const removals = new Set<string>();
  const removeCount = rng.int(0, Math.min(2, corners.length));
  const shuffledCorners = rng.shuffle([...corners]);
  for (let i = 0; i < removeCount; i++) {
    const c = shuffledCorners[i];
    if (c) removals.add(`${c.x},${c.y}`);
  }

  for (const c of cells) {
    if (removals.has(`${c.x},${c.y}`)) continue;
    setTerrain(grid, width, height, c.x, c.y, Terrain.Fairway);
  }
}

/**
 * Place a rectangular block of water.
 */
export function placeWaterBlock(
  grid: Cell[][],
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setTerrain(grid, width, height, x + dx, y + dy, Terrain.Water);
    }
  }
}

/**
 * Validate the water invariant: no non-water cell may be enclosed by water/OOB.
 * Flood-fills from all grid edges through non-water cells.
 * Any non-water cell not reached is converted to water.
 */
export function validateWaterInvariant(
  grid: Cell[][],
  width: number,
  height: number,
): void {
  const visited = new Set<string>();
  const queue: Position[] = [];

  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      if (getTerrain(grid, width, height, x, y) !== Terrain.Water) {
        const key = `${x},${y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ x, y });
        }
      }
    }
  }
  for (let y = 0; y < height; y++) {
    for (const x of [0, width - 1]) {
      if (getTerrain(grid, width, height, x, y) !== Terrain.Water) {
        const key = `${x},${y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ x, y });
        }
      }
    }
  }

  while (queue.length > 0) {
    const pos = queue.shift();
    if (!pos) break;
    for (const dir of DIRECTIONS) {
      const vec = DIRECTION_VECTORS[dir];
      const nx = pos.x + vec.dx;
      const ny = pos.y + vec.dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (getTerrain(grid, width, height, nx, ny) === Terrain.Water) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny });
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (!visited.has(key) && getTerrain(grid, width, height, x, y) !== Terrain.Water) {
        setTerrain(grid, width, height, x, y, Terrain.Water);
      }
    }
  }
}

/**
 * Place a rectangular cluster of trees at the given position.
 * Only places on rough cells. Returns true if any trees were placed.
 */
export function placeTreeCluster(
  grid: Cell[][],
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  let placed = false;
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      if (getTerrain(grid, width, height, tx, ty) === Terrain.Rough) {
        setTerrain(grid, width, height, tx, ty, Terrain.Trees);
        placed = true;
      }
    }
  }
  return placed;
}

/**
 * Place a rectangular sand patch at the given position.
 * Only places on rough cells.
 */
export function placeSandPatch(
  grid: Cell[][],
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const sx = x + dx;
      const sy = y + dy;
      if (getTerrain(grid, width, height, sx, sy) === Terrain.Rough) {
        setTerrain(grid, width, height, sx, sy, Terrain.Sand);
      }
    }
  }
}

/**
 * Place slope cells on rough/fairway, with validated directions.
 */
export function placeSlopes(
  grid: Cell[][],
  width: number,
  height: number,
  count: number,
  rng: PRNG,
): void {
  let placed = 0;
  let attempts = 0;

  while (placed < count && attempts < 100) {
    attempts++;
    const x = rng.int(1, width - 2);
    const y = rng.int(1, height - 2);
    const terrain = getTerrain(grid, width, height, x, y);

    if (terrain !== Terrain.Fairway) continue;

    const validDirs: Direction[] = [];
    for (const dir of DIRECTIONS) {
      const vec = DIRECTION_VECTORS[dir];
      const nx = x + vec.dx;
      const ny = y + vec.dy;
      const nextTerrain = getTerrain(grid, width, height, nx, ny);
      if (
        nextTerrain !== null &&
        nextTerrain !== Terrain.Water &&
        nextTerrain !== Terrain.Trees
      ) {
        validDirs.push(dir);
      }
    }

    if (validDirs.length === 0) continue;

    const dir = rng.pick(validDirs);
    const cell = grid[y]?.[x];
    if (cell) cell.slope = dir;
    placed++;
  }
}

/**
 * BFS reachability check from start to end through non-tree, non-water cells.
 */
export function isReachable(
  grid: Cell[][],
  width: number,
  height: number,
  start: Position,
  end: Position,
): boolean {
  const visited = new Set<string>();
  const queue: Position[] = [start];
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const pos = queue.shift();
    if (!pos) break;
    if (pos.x === end.x && pos.y === end.y) return true;

    for (const dir of DIRECTIONS) {
      const vec = DIRECTION_VECTORS[dir];
      const nx = pos.x + vec.dx;
      const ny = pos.y + vec.dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const terrain = grid[ny]?.[nx]?.terrain;
      if (terrain === Terrain.Trees || terrain === Terrain.Water) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny });
    }
  }

  return false;
}
