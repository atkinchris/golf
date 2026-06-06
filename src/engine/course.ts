import { PRNG } from "./prng";
import {
  type Cell,
  type Course,
  type CourseConfig,
  DEFAULT_COURSE_CONFIG,
  DIRECTION_VECTORS,
  DIRECTIONS,
  type Direction,
  type Position,
  Terrain,
} from "./types";

/** Create an empty grid filled with rough. */
function createGrid(width: number, height: number): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      terrain: Terrain.Rough,
      slope: null,
    })),
  );
}

/** Set terrain at a position if in bounds. */
function setTerrain(
  grid: Cell[][],
  width: number,
  height: number,
  x: number,
  y: number,
  terrain: Terrain,
): void {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    const row = grid[y];
    const cell = row?.[x];
    if (cell) cell.terrain = terrain;
  }
}

/** Get terrain at a position, or null if out of bounds. */
function getTerrain(
  grid: Cell[][],
  width: number,
  height: number,
  x: number,
  y: number,
): Terrain | null {
  if (x < 0 || x >= width || y < 0 || y >= height) return null;
  return grid[y]?.[x]?.terrain ?? null;
}

/**
 * Interpolate a smooth path through control points using Catmull-Rom-like interpolation.
 * Returns a list of {x, y} positions along the spine.
 */
function generateSpine(points: Position[], _height: number): Position[] {
  if (points.length < 2) return [...points];

  const spine: Position[] = [];
  const seen = new Set<string>();

  // Walk through each segment between consecutive points
  for (let seg = 0; seg < points.length - 1; seg++) {
    const p0 = points[seg];
    const p1 = points[seg + 1];
    if (!p0 || !p1) continue;
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = Math.round(p0.x + dx * t);
      const y = Math.round(p0.y + dy * t);
      const key = `${x},${y}`;
      if (!seen.has(key)) {
        seen.add(key);
        spine.push({ x, y });
      }
    }
  }

  return spine;
}

/**
 * Widen the fairway around the spine.
 * Width varies: wider near tee and hole, narrower in middle.
 */
function widenFairway(
  grid: Cell[][],
  width: number,
  height: number,
  spine: Position[],
  config: CourseConfig,
  rng: PRNG,
): void {
  const spineLen = spine.length;

  for (let i = 0; i < spineLen; i++) {
    const pos = spine[i];
    if (!pos) continue;

    // Calculate width at this point along the spine
    const t = spineLen <= 1 ? 0.5 : i / (spineLen - 1);
    // Wider near start (tee box) and end (green), narrower in middle
    const widthFactor = 1 - 0.5 * Math.sin(t * Math.PI);
    const halfWidth = Math.round(
      (config.fairwayWidthMin + (config.fairwayWidthMax - config.fairwayWidthMin) * widthFactor) /
        2,
    );

    // Set fairway cells in a diamond/circle pattern around spine
    for (let dy = -halfWidth; dy <= halfWidth; dy++) {
      for (let dx = -halfWidth; dx <= halfWidth; dx++) {
        // Use a rough circle shape with some randomness
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist <= halfWidth + (rng.chance(0.3) ? 1 : 0)) {
          setTerrain(grid, width, height, pos.x + dx, pos.y + dy, Terrain.Fairway);
        }
      }
    }
  }
}

/** Place trees along grid edges and in clusters. */
function placeTrees(
  grid: Cell[][],
  width: number,
  height: number,
  spine: Position[],
  config: CourseConfig,
  rng: PRNG,
): void {
  // Edge trees
  const edgeDepth = rng.int(2, 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isEdge =
        x < edgeDepth || x >= width - edgeDepth || y < edgeDepth || y >= height - edgeDepth;
      if (isEdge && getTerrain(grid, width, height, x, y) === Terrain.Rough) {
        if (rng.chance(0.7)) {
          setTerrain(grid, width, height, x, y, Terrain.Trees);
        }
      }
    }
  }

  // Clusters in rough areas (not adjacent to fairway)
  const clusterCount = Math.floor(config.treeDensity * 10);
  for (let c = 0; c < clusterCount; c++) {
    const cx = rng.int(3, width - 4);
    const cy = rng.int(3, height - 4);

    // Don't place near spine
    const nearSpine = spine.some((p) => Math.abs(p.x - cx) <= 2 && Math.abs(p.y - cy) <= 2);
    if (nearSpine) continue;

    // Place a cluster
    const clusterSize = rng.int(2, 5);
    for (let i = 0; i < clusterSize; i++) {
      const tx = cx + rng.int(-2, 2);
      const ty = cy + rng.int(-2, 2);
      if (getTerrain(grid, width, height, tx, ty) === Terrain.Rough) {
        // Check not adjacent to fairway
        let adjFairway = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (getTerrain(grid, width, height, tx + dx, ty + dy) === Terrain.Fairway) {
              adjFairway = true;
            }
          }
        }
        if (!adjFairway) {
          setTerrain(grid, width, height, tx, ty, Terrain.Trees);
        }
      }
    }
  }
}

/** Place sand traps near the green and along the fairway. */
function placeSandTraps(
  grid: Cell[][],
  width: number,
  height: number,
  spine: Position[],
  hole: Position,
  config: CourseConfig,
  rng: PRNG,
): void {
  const placed: Position[] = [];

  for (let i = 0; i < config.sandTrapCount; i++) {
    let targetPos: Position;

    if (i === 0) {
      // Greenside bunker - near the hole
      const angle = rng.next() * Math.PI * 2;
      targetPos = {
        x: hole.x + Math.round(Math.cos(angle) * 3),
        y: hole.y + Math.round(Math.sin(angle) * 3),
      };
    } else {
      // Fairway bunker - along the middle of the spine
      const spineIdx = rng.int(Math.floor(spine.length * 0.3), Math.floor(spine.length * 0.7));
      const spinePos = spine[spineIdx] ?? spine[Math.floor(spine.length / 2)];
      if (!spinePos) continue;
      const side = rng.chance(0.5) ? 1 : -1;
      targetPos = {
        x: spinePos.x + side * rng.int(2, 4),
        y: spinePos.y + rng.int(-1, 1),
      };
    }

    // Don't place too close to other traps
    const tooClose = placed.some(
      (p) => Math.abs(p.x - targetPos.x) <= 2 && Math.abs(p.y - targetPos.y) <= 2,
    );
    if (tooClose) continue;

    // Place a cluster of sand cells
    const clusterSize = rng.int(2, 4);
    for (let j = 0; j < clusterSize; j++) {
      const sx = targetPos.x + rng.int(-1, 1);
      const sy = targetPos.y + rng.int(-1, 1);
      const terrain = getTerrain(grid, width, height, sx, sy);
      if (terrain === Terrain.Rough || terrain === Terrain.Fairway) {
        setTerrain(grid, width, height, sx, sy, Terrain.Sand);
      }
    }

    placed.push(targetPos);
  }
}

/** Place a water hazard (pond or stream). */
function placeWater(
  grid: Cell[][],
  width: number,
  height: number,
  spine: Position[],
  rng: PRNG,
): void {
  const isPond = rng.chance(0.6);

  if (isPond) {
    // Pond near the middle of the fairway
    const spineIdx = rng.int(Math.floor(spine.length * 0.3), Math.floor(spine.length * 0.6));
    const center = spine[spineIdx] ?? spine[Math.floor(spine.length / 2)];
    if (!center) return;
    const side = rng.chance(0.5) ? 1 : -1;
    const pondCenter: Position = {
      x: center.x + side * rng.int(3, 5),
      y: center.y,
    };

    const pondSize = rng.int(4, 8);
    for (let i = 0; i < pondSize; i++) {
      const px = pondCenter.x + rng.int(-2, 2);
      const py = pondCenter.y + rng.int(-1, 1);
      const terrain = getTerrain(grid, width, height, px, py);
      if (terrain === Terrain.Rough) {
        setTerrain(grid, width, height, px, py, Terrain.Water);
      }
    }
  } else {
    // Stream crossing the fairway
    const spineIdx = rng.int(Math.floor(spine.length * 0.3), Math.floor(spine.length * 0.6));
    const crossPoint = spine[spineIdx] ?? spine[Math.floor(spine.length / 2)];
    if (!crossPoint) return;

    // Draw a thin horizontal or near-horizontal line
    for (let dx = -4; dx <= 4; dx++) {
      const dy = rng.int(-1, 0);
      const wx = crossPoint.x + dx;
      const wy = crossPoint.y + dy;
      const terrain = getTerrain(grid, width, height, wx, wy);
      if (terrain === Terrain.Rough || terrain === Terrain.Fairway) {
        setTerrain(grid, width, height, wx, wy, Terrain.Water);
      }
    }
  }
}

/** Place slope cells in rough and fairway edges. */
function placeSlopes(
  grid: Cell[][],
  width: number,
  height: number,
  config: CourseConfig,
  rng: PRNG,
): void {
  let placed = 0;
  let attempts = 0;

  while (placed < config.slopeCount && attempts < 100) {
    attempts++;
    const x = rng.int(2, width - 3);
    const y = rng.int(2, height - 3);
    const terrain = getTerrain(grid, width, height, x, y);

    // Only place on rough or fairway
    if (terrain !== Terrain.Rough && terrain !== Terrain.Fairway) continue;

    // Pick a direction that doesn't point into water or trees or out of bounds
    const validDirs: Direction[] = [];
    for (const dir of DIRECTIONS) {
      const vec = DIRECTION_VECTORS[dir];
      const nx = x + vec.dx;
      const ny = y + vec.dy;
      const nextTerrain = getTerrain(grid, width, height, nx, ny);
      if (nextTerrain !== null && nextTerrain !== Terrain.Water && nextTerrain !== Terrain.Trees) {
        validDirs.push(dir);
      }
    }

    if (validDirs.length === 0) continue;

    const dir = rng.pick(validDirs);
    const slopeCell = grid[y]?.[x];
    if (slopeCell) slopeCell.slope = dir;
    placed++;
  }
}

/**
 * Simple reachability check using BFS.
 * Checks if the hole can be reached from the tee by stepping through
 * non-tree, non-water cells (rough approximation).
 */
function isReachable(
  grid: Cell[][],
  width: number,
  height: number,
  tee: Position,
  hole: Position,
): boolean {
  const visited = new Set<string>();
  const queue: Position[] = [tee];
  visited.add(`${tee.x},${tee.y}`);

  while (queue.length > 0) {
    const pos = queue.shift();
    if (!pos) break;
    if (pos.x === hole.x && pos.y === hole.y) return true;

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

/** Generate a course deterministically from a seed. */
export function generateCourse(
  seed: string,
  width: number,
  height: number,
  config: CourseConfig = DEFAULT_COURSE_CONFIG,
): Course {
  const rng = new PRNG(seed);
  const grid = createGrid(width, height);

  // Step 1: Place tee and hole
  const teeX = rng.int(Math.floor(width * 0.2), Math.floor(width * 0.8));
  const teeY = rng.int(height - 5, height - 3);
  const tee: Position = { x: teeX, y: teeY };

  const holeX = rng.int(Math.floor(width * 0.2), Math.floor(width * 0.8));
  const holeY = rng.int(2, 4);
  const hole: Position = { x: holeX, y: holeY };

  // Step 2: Generate fairway spine with control points
  const controlPointCount = config.controlPoints;
  const points: Position[] = [tee];

  for (let i = 0; i < controlPointCount; i++) {
    const t = (i + 1) / (controlPointCount + 1);
    const baseX = tee.x + (hole.x - tee.x) * t;
    const baseY = tee.y + (hole.y - tee.y) * t;
    // Add some random offset for curves/doglegs
    const offsetX = rng.int(-4, 4);
    const offsetY = rng.int(-2, 2);
    points.push({
      x: Math.max(3, Math.min(width - 4, Math.round(baseX + offsetX))),
      y: Math.max(3, Math.min(height - 4, Math.round(baseY + offsetY))),
    });
  }

  points.push(hole);
  const spine = generateSpine(points, height);

  // Step 3: Widen the fairway
  widenFairway(grid, width, height, spine, config, rng);

  // Ensure tee and hole are on fairway
  setTerrain(grid, width, height, tee.x, tee.y, Terrain.Fairway);
  setTerrain(grid, width, height, hole.x, hole.y, Terrain.Fairway);

  // Step 4: Base terrain is already rough (default)

  // Step 5: Place trees
  placeTrees(grid, width, height, spine, config, rng);

  // Step 6: Place sand traps
  placeSandTraps(grid, width, height, spine, hole, config, rng);

  // Step 7: Place water hazard (50% chance)
  if (rng.chance(config.waterProbability)) {
    placeWater(grid, width, height, spine, rng);
  }

  // Step 8: Place slopes
  placeSlopes(grid, width, height, config, rng);

  // Ensure tee and hole haven't been overwritten
  setTerrain(grid, width, height, tee.x, tee.y, Terrain.Fairway);
  setTerrain(grid, width, height, hole.x, hole.y, Terrain.Fairway);
  const teeCell = grid[tee.y]?.[tee.x];
  if (teeCell) teeCell.slope = null;
  const holeCell = grid[hole.y]?.[hole.x];
  if (holeCell) holeCell.slope = null;

  // Step 9: Validate reachability
  if (!isReachable(grid, width, height, tee, hole)) {
    // Regenerate with a modified seed
    return generateCourse(`${seed}_retry`, width, height, config);
  }

  return { grid, width, height, tee, hole, seed };
}
