import { generateCourse } from "../src/engine/course.ts";
import type { Course, CourseConfig, Position } from "../src/engine/types.ts";
import {
  DIRECTION_VECTORS,
  DIRECTIONS,
  GRID_HEIGHT,
  GRID_WIDTH,
  Terrain,
} from "../src/engine/types.ts";
import { validateMove } from "../src/engine/validation.ts";
import type { CourseMetrics } from "./types.ts";

// ---- Helpers ----

function posKey(p: Position): string {
  return `${p.x},${p.y}`;
}

function posEq(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Get all valid landings from a position, trying every direction and distance 1-6.
 * Returns deduplicated landing positions with the move details.
 */
function getValidMoves(course: Course, from: Position): { to: Position; holesOut: boolean }[] {
  const seen = new Set<string>();
  const results: { to: Position; holesOut: boolean }[] = [];

  for (const dir of DIRECTIONS) {
    for (let dist = 1; dist <= 6; dist++) {
      const result = validateMove(course, from, dir, dist);
      if (!result.valid) continue;

      const key = posKey(result.landingPosition);
      if (result.holesOut) {
        // Always include hole-out - deduplicate on the hole position
        if (!seen.has("HOLE")) {
          seen.add("HOLE");
          results.push({ to: result.landingPosition, holesOut: true });
        }
      } else if (!seen.has(key)) {
        seen.add(key);
        results.push({ to: result.landingPosition, holesOut: false });
      }
    }
  }

  return results;
}

// ---- BFS: optimal strokes ----

function bfsOptimalStrokes(course: Course): number {
  const start = course.tee;
  const queue: { pos: Position; strokes: number }[] = [{ pos: start, strokes: 0 }];
  const visited = new Set<string>();
  visited.add(posKey(start));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const moves = getValidMoves(course, current.pos);
    for (const move of moves) {
      if (move.holesOut) {
        return current.strokes + 1;
      }

      const key = posKey(move.to);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ pos: move.to, strokes: current.strokes + 1 });
      }
    }
  }

  // No path found - return Infinity
  return Infinity;
}

// ---- DFS: near-optimal route count ----

const MAX_PATHS = 50;

function dfsNearOptimalPaths(course: Course, optimal: number): Position[][] {
  if (!Number.isFinite(optimal)) return [];

  const maxStrokes = optimal + 1;
  const paths: Position[][] = [];

  function dfs(pos: Position, strokes: number, path: Position[]): void {
    if (paths.length >= MAX_PATHS) return;
    if (strokes > maxStrokes) return;

    const moves = getValidMoves(course, pos);
    for (const move of moves) {
      if (paths.length >= MAX_PATHS) return;

      if (move.holesOut) {
        if (strokes + 1 <= maxStrokes) {
          paths.push([...path, move.to]);
        }
        continue;
      }

      // Avoid cycles within a single path
      const key = posKey(move.to);
      if (path.some((p) => posKey(p) === key)) continue;

      dfs(move.to, strokes + 1, [...path, move.to]);
    }
  }

  dfs(course.tee, 0, [course.tee]);
  return paths;
}

// ---- Branching factor ----

function computeBranchingFactor(course: Course, optimal: number): number {
  if (!Number.isFinite(optimal)) return 0;

  // BFS to find the optimal path (first one found)
  const start = course.tee;
  const cameFrom = new Map<string, Position>();
  const queue: Position[] = [start];
  const visited = new Set<string>();
  visited.add(posKey(start));
  let holeReached: Position | null = null;

  outer: while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break outer;
    const moves = getValidMoves(course, current);

    for (const move of moves) {
      if (move.holesOut) {
        cameFrom.set(posKey(move.to), current);
        holeReached = move.to;
        break outer;
      }

      const key = posKey(move.to);
      if (!visited.has(key)) {
        visited.add(key);
        cameFrom.set(key, current);
        queue.push(move.to);
      }
    }
  }

  if (!holeReached) return 0;

  // Reconstruct optimal path
  const path: Position[] = [];
  let current: Position | undefined = holeReached;
  while (current) {
    path.unshift(current);
    const prev = cameFrom.get(posKey(current));
    if (prev && posEq(prev, current)) break;
    current = prev;
  }

  // For each cell on the path (excluding the hole), count valid directions
  let totalDirections = 0;
  let cellCount = 0;

  for (const pos of path) {
    if (posEq(pos, course.hole)) continue;

    let validDirCount = 0;
    for (const dir of DIRECTIONS) {
      let anyValid = false;
      for (let dist = 1; dist <= 6; dist++) {
        const result = validateMove(course, pos, dir, dist);
        if (result.valid) {
          anyValid = true;
          break;
        }
      }
      if (anyValid) validDirCount++;
    }

    totalDirections += validDirCount;
    cellCount++;
  }

  return cellCount > 0 ? totalDirections / cellCount : 0;
}

// ---- Reachability BFS (for hazardRelevance and deadCellRatio) ----

function bfsReachableCells(course: Course): Set<string> {
  const reachable = new Set<string>();
  const queue: Position[] = [course.tee];
  reachable.add(posKey(course.tee));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const moves = getValidMoves(course, current);

    for (const move of moves) {
      const key = posKey(move.to);
      if (!reachable.has(key)) {
        reachable.add(key);
        if (!move.holesOut) {
          queue.push(move.to);
        }
      }
    }
  }

  return reachable;
}

// ---- Hazard relevance ----

function computeHazardRelevance(course: Course, reachable: Set<string>): number {
  const hazardTerrains = new Set([Terrain.Water, Terrain.Sand, Terrain.Trees]);
  let totalHazards = 0;
  let relevantHazards = 0;

  for (let y = 0; y < course.height; y++) {
    for (let x = 0; x < course.width; x++) {
      const cell = course.grid[y]?.[x];
      if (!cell || !hazardTerrains.has(cell.terrain)) continue;

      totalHazards++;

      // Check if any adjacent cell (8-directional) is reachable
      let adjacent = false;
      for (const dir of DIRECTIONS) {
        const vec = DIRECTION_VECTORS[dir];
        const nx = x + vec.dx;
        const ny = y + vec.dy;
        if (reachable.has(`${nx},${ny}`)) {
          adjacent = true;
          break;
        }
      }

      if (adjacent) relevantHazards++;
    }
  }

  return totalHazards > 0 ? relevantHazards / totalHazards : 0;
}

// ---- Dead cell ratio ----

function computeDeadCellRatio(course: Course, reachable: Set<string>): number {
  let totalNonRough = 0;
  let unreachableNonRough = 0;

  for (let y = 0; y < course.height; y++) {
    for (let x = 0; x < course.width; x++) {
      const cell = course.grid[y]?.[x];
      if (!cell || cell.terrain === Terrain.Rough) continue;

      totalNonRough++;
      if (!reachable.has(`${x},${y}`)) {
        unreachableNonRough++;
      }
    }
  }

  return totalNonRough > 0 ? unreachableNonRough / totalNonRough : 0;
}

// ---- Choke points ----

function computeChokePoints(course: Course, paths: Position[][]): number {
  if (paths.length <= 1) return 0;

  // Count cells present in ALL paths, excluding tee and hole
  const teeKey = posKey(course.tee);
  const holeKey = posKey(course.hole);

  // Build intersection: start with cells from first path, intersect with rest
  const firstPathCells = new Set(
    paths[0]?.map(posKey).filter((k) => k !== teeKey && k !== holeKey),
  );

  for (let i = 1; i < paths.length; i++) {
    const pathCells = new Set(paths[i]?.map(posKey).filter((k) => k !== teeKey && k !== holeKey));
    for (const cell of firstPathCells) {
      if (!pathCells.has(cell)) {
        firstPathCells.delete(cell);
      }
    }
  }

  return firstPathCells.size;
}

// ---- Public API ----

/** Compute all structural quality metrics for a course. */
export function computeMetrics(course: Course): CourseMetrics {
  const optimalStrokes = bfsOptimalStrokes(course);
  const nearOptimalPaths = dfsNearOptimalPaths(course, optimalStrokes);
  const reachable = bfsReachableCells(course);

  return {
    seed: course.seed,
    optimalStrokes,
    routeCount: nearOptimalPaths.length,
    branchingFactor: Math.round(computeBranchingFactor(course, optimalStrokes) * 100) / 100,
    hazardRelevance: Math.round(computeHazardRelevance(course, reachable) * 100) / 100,
    deadCellRatio: Math.round(computeDeadCellRatio(course, reachable) * 100) / 100,
    chokePoints: computeChokePoints(course, nearOptimalPaths),
  };
}

/** Generate N courses and compute metrics for each. */
export function generateAndMeasureBatch(
  batchSize: number,
  iteration: number,
  config: CourseConfig,
): { course: Course; metrics: CourseMetrics }[] {
  const results: { course: Course; metrics: CourseMetrics }[] = [];

  for (let i = 0; i < batchSize; i++) {
    const seed = `iter${iteration}_batch${i}`;
    const course = generateCourse(seed, GRID_WIDTH, GRID_HEIGHT, config);
    const metrics = computeMetrics(course);
    results.push({ course, metrics });
  }

  return results;
}

/** Filter out degenerate courses and rank the rest by quality score. */
export function filterAndRank(
  batch: { course: Course; metrics: CourseMetrics }[],
  topN: number,
): { course: Course; metrics: CourseMetrics }[] {
  const filtered = batch.filter(({ metrics }) => {
    if (metrics.optimalStrokes < 3) return false;
    if (metrics.routeCount <= 1) return false;
    if (metrics.branchingFactor < 1.5) return false;
    if (metrics.deadCellRatio > 0.5) return false;
    return true;
  });

  const scored = filtered.map((entry) => {
    const { metrics } = entry;
    const score =
      metrics.routeCount * 2 +
      metrics.branchingFactor * 3 +
      metrics.hazardRelevance * 2 -
      metrics.deadCellRatio * 5 -
      metrics.chokePoints * 1;
    return { ...entry, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN).map(({ course, metrics }) => ({ course, metrics }));
}
