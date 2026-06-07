import {
  dogleg,
  fortressGreen,
  gauntlet,
  islandHop,
  splitDecision,
} from "./archetypes";
import {
  createGrid,
  isReachable,
  placeSlopes,
  setTerrain,
  validateWaterInvariant,
} from "./island";
import { PRNG } from "./prng";
import {
  ARCHETYPES,
  type Archetype,
  type Course,
  type CourseConfig,
  DEFAULT_COURSE_CONFIG,
  type Position,
  Terrain,
} from "./types";

const ARCHETYPE_FNS: Record<
  Archetype,
  (
    grid: import("./types").Cell[][],
    width: number,
    height: number,
    tee: Position,
    hole: Position,
    config: CourseConfig,
    rng: PRNG,
  ) => void
> = {
  "island-hop": islandHop,
  gauntlet,
  "split-decision": splitDecision,
  dogleg,
  "fortress-green": fortressGreen,
};

/** Generate a course deterministically from a seed. */
export function generateCourse(
  seed: string,
  width: number,
  height: number,
  config: CourseConfig = DEFAULT_COURSE_CONFIG,
): Course {
  const rng = new PRNG(seed);
  const grid = createGrid(width, height);

  // Step 1: Select archetype
  const archetype = rng.pick(ARCHETYPES);

  // Step 2: Place tee and hole
  const teeX = rng.int(Math.floor(width * 0.1), Math.floor(width * 0.9));
  const teeY = rng.int(height - 5, height - 3);
  const tee: Position = { x: teeX, y: teeY };

  const holeX = rng.int(Math.floor(width * 0.1), Math.floor(width * 0.9));
  const holeY = rng.int(1, 4);
  const hole: Position = { x: holeX, y: holeY };

  // Step 3: Run archetype to place islands, water, trees, sand
  const archetypeFn = ARCHETYPE_FNS[archetype];
  archetypeFn(grid, width, height, tee, hole, config, rng);

  // Step 4: Validate water invariant
  validateWaterInvariant(grid, width, height);

  // Step 5: Place slopes
  placeSlopes(grid, width, height, config.slopeCount, rng);

  // Step 6: Protect tee and hole
  setTerrain(grid, width, height, tee.x, tee.y, Terrain.Fairway);
  setTerrain(grid, width, height, hole.x, hole.y, Terrain.Fairway);
  const teeCell = grid[tee.y]?.[tee.x];
  if (teeCell) teeCell.slope = null;
  const holeCell = grid[hole.y]?.[hole.x];
  if (holeCell) holeCell.slope = null;

  // Step 7: Reachability check
  if (!isReachable(grid, width, height, tee, hole)) {
    return generateCourse(`${seed}_retry`, width, height, config);
  }

  return { grid, width, height, tee, hole, seed };
}
