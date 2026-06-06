import {
  type Course,
  DIRECTION_VECTORS,
  type Direction,
  type MoveResult,
  type Position,
  Terrain,
} from "./types";

/** Get the terrain modifier for a given terrain type. */
export function getTerrainModifier(terrain: Terrain): number {
  switch (terrain) {
    case Terrain.Fairway:
      return 1;
    case Terrain.Sand:
      return -1;
    default:
      return 0;
  }
}

/** Get the cell at a position, or null if out of bounds. */
export function getCell(course: Course, pos: Position) {
  if (pos.x < 0 || pos.x >= course.width || pos.y < 0 || pos.y >= course.height) {
    return null;
  }
  return course.grid[pos.y]?.[pos.x] ?? null;
}

/** Check if a position matches another position. */
export function posEq(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Resolve a slope chain starting from a position.
 * Returns the list of intermediate positions the ball rolls through
 * (not including the starting position), and the final resting position.
 */
export function resolveSlopeChain(
  course: Course,
  start: Position,
): { chain: Position[]; final: Position } {
  const chain: Position[] = [];
  let current = start;
  const visited = new Set<string>();
  visited.add(`${current.x},${current.y}`);

  for (;;) {
    const cell = getCell(course, current);
    if (!cell?.slope) break;

    const vec = DIRECTION_VECTORS[cell.slope];
    const next: Position = { x: current.x + vec.dx, y: current.y + vec.dy };
    const nextKey = `${next.x},${next.y}`;

    // Out of bounds - stop
    const nextCell = getCell(course, next);
    if (!nextCell) break;

    // Slope points into water - ignore this slope
    if (nextCell.terrain === Terrain.Water) break;

    // Two slopes facing each other - stop after first movement
    if (visited.has(nextKey)) break;

    chain.push(next);
    visited.add(nextKey);
    current = next;
  }

  return { chain, final: current };
}

/**
 * Validate a move in a given direction with a given distance.
 * Returns either a valid result with landing position, or an invalid result with a reason.
 */
export function validateMove(
  course: Course,
  from: Position,
  direction: Direction,
  distance: number,
): MoveResult {
  const vec = DIRECTION_VECTORS[direction];
  const fromCell = getCell(course, from);
  if (!fromCell) {
    return { valid: false, reason: "Ball is out of bounds" };
  }

  const isOnFairway = fromCell.terrain === Terrain.Fairway;

  // Check each cell along the path
  for (let step = 1; step <= distance; step++) {
    const pos: Position = {
      x: from.x + vec.dx * step,
      y: from.y + vec.dy * step,
    };

    const cell = getCell(course, pos);
    if (!cell) {
      return { valid: false, reason: "Path goes out of bounds" };
    }

    // Check if the hole is on the path before the landing cell
    if (step < distance && posEq(pos, course.hole)) {
      // Overshoot rule: can overshoot by at most 1
      if (distance - step <= 1) {
        return {
          valid: true,
          landingPosition: course.hole,
          holesOut: true,
          slopeChain: [],
        };
      }
      // Overshooting by more than 1 - ball goes over the hole
      continue;
    }

    const isLanding = step === distance;

    // Trees block the path entirely (unless hitting from fairway)
    if (cell.terrain === Terrain.Trees) {
      if (!isOnFairway) {
        return { valid: false, reason: "Path blocked by trees" };
      }
      // From fairway, can fly over trees but not land on them
      if (isLanding) {
        return { valid: false, reason: "Cannot land on trees" };
      }
    }

    // Water: can fly over but not land on
    if (isLanding && cell.terrain === Terrain.Water) {
      return { valid: false, reason: "Cannot land in water" };
    }
  }

  const landingPos: Position = {
    x: from.x + vec.dx * distance,
    y: from.y + vec.dy * distance,
  };

  // Check if landing on the hole
  if (posEq(landingPos, course.hole)) {
    return {
      valid: true,
      landingPosition: course.hole,
      holesOut: true,
      slopeChain: [],
    };
  }

  // Resolve slope chain from landing position
  const { chain, final } = resolveSlopeChain(course, landingPos);

  // Check if slope chain lands on the hole
  const holesOut = posEq(final, course.hole);

  return {
    valid: true,
    landingPosition: final,
    holesOut,
    slopeChain: chain,
  };
}
