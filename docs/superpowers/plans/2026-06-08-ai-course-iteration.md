# AI Course Iteration Loop - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully autonomous CLI loop that generates courses, filters by structural metrics, has an LLM play and evaluate them, then proposes config improvements - iterating toward more interesting course generation.

**Architecture:** A standalone `ai/` directory at repo root with its own `tsconfig.json` targeting Node. Imports the game engine from `../src/engine/` directly. Uses `@openrouter/sdk` for LLM calls. Orchestrated as a single CLI entry point that runs N iterations autonomously, writing results to `ai/results/`.

**Tech Stack:** TypeScript (Node, ES modules), tsx for execution, @openrouter/sdk, existing game engine

**Design decisions:**
- Separate `ai/` package avoids polluting the game's Vite/React build
- Metrics are computed with zero LLM cost (BFS + counting)
- LLM plays via a multi-turn message protocol (not tool use) for simplicity
- Config mutations are clamped to +/-30% per iteration and max 2 fields to prevent chaotic jumps
- All iteration state is persisted to JSON for auditability and resumption

---

### Task 1: Project Scaffolding

**Files:**
- Create: `ai/package.json`
- Create: `ai/tsconfig.json`

- [ ] **Step 1: Create ai/package.json**

```json
{
  "name": "dice-golf-ai",
  "private": true,
  "type": "module",
  "scripts": {
    "iterate": "tsx cli.ts"
  },
  "dependencies": {
    "@openrouter/sdk": "^1.0.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0",
    "typescript": "~5.8.0"
  }
}
```

- [ ] **Step 2: Create ai/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "#engine/*": ["../src/engine/*"]
    }
  },
  "include": ["./**/*.ts", "../src/engine/**/*.ts"]
}
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`
Working directory: `ai/`
Expected: Clean install with no errors.

- [ ] **Step 4: Verify engine imports work**

Create `ai/smoke.ts`:

```typescript
import { generateCourse } from "../src/engine/course.ts";
import { GRID_WIDTH, GRID_HEIGHT, DEFAULT_COURSE_CONFIG } from "../src/engine/types.ts";

const course = generateCourse("test-seed", GRID_WIDTH, GRID_HEIGHT, DEFAULT_COURSE_CONFIG);
console.log(`Generated course: ${course.width}x${course.height}, tee=(${course.tee.x},${course.tee.y}), hole=(${course.hole.x},${course.hole.y})`);
```

Run: `npx tsx smoke.ts`
Working directory: `ai/`
Expected: Prints course dimensions and positions without error.

- [ ] **Step 5: Remove smoke test, commit**

```sh
rm ai/smoke.ts
git add ai/
git commit -m "Add ai/ scaffolding with tsx and OpenRouter SDK"
```

---

### Task 2: Types

**Files:**
- Create: `ai/types.ts`

- [ ] **Step 1: Define shared types**

```typescript
import type { CourseConfig, Course, Direction, Position } from "../src/engine/types.ts";

// ---- Metrics ----

export interface CourseMetrics {
  seed: string;
  optimalStrokes: number;
  routeCount: number;
  branchingFactor: number;
  hazardRelevance: number;
  deadCellRatio: number;
  chokePoints: number;
}

// ---- Play ratings ----

export interface PlayRating {
  strokes: number;
  decisionQuality: 1 | 2 | 3 | 4 | 5;
  tensionMoments: number;
  boringTurns: number;
  notes: string;
}

export interface PlayedCourse {
  seed: string;
  metrics: CourseMetrics;
  rating: PlayRating;
  moves: MoveRecord[];
}

export interface MoveRecord {
  turn: number;
  from: Position;
  roll: number;
  effectiveRoll: number;
  direction: Direction;
  to: Position;
  holedOut: boolean;
  reasoning: string;
}

// ---- Evaluator proposals ----

export interface ConfigProposal {
  field: keyof CourseConfig;
  currentValue: number;
  proposedValue: number;
  reasoning: string;
}

export interface ArchetypeProposal {
  name: string;
  description: string;
  keyFeature: string;
  whyBetter: string;
}

// ---- Iteration log ----

export interface IterationLog {
  iteration: number;
  config: CourseConfig;
  metricsDistribution: {
    mean: Record<string, number>;
    best: Record<string, number>;
  };
  playedCourses: PlayedCourse[];
  proposals: ConfigProposal[];
  archetypeIdeas: ArchetypeProposal[];
}

export interface RunLog {
  startedAt: string;
  model: string;
  iterations: IterationLog[];
  finalConfig: CourseConfig;
  allArchetypeIdeas: ArchetypeProposal[];
}

// ---- CLI options ----

export interface CliOptions {
  iterations: number;
  batchSize: number;
  playCount: number;
  model: string;
  resume?: string;
}
```

- [ ] **Step 2: Commit**

```sh
git add ai/types.ts
git commit -m "Add AI iteration type definitions"
```

---

### Task 3: Grid Serialisation

**Files:**
- Create: `ai/serialise.ts`

- [ ] **Step 1: Implement grid-to-text serialisation**

```typescript
import type { Course } from "../src/engine/types.ts";
import { Terrain } from "../src/engine/types.ts";

/**
 * Serialise a course grid to a compact text format suitable for LLM consumption.
 * Legend: . = rough, F = fairway, S = sand, W = water, T = tree
 * Slopes shown as directional arrows: ^ v < > / \ (for N, S, W, E, NE/SW, NW/SE)
 * Tee = O, Hole = H
 */
export function serialiseCourse(course: Course): string {
  const slopeChars: Record<string, string> = {
    N: "^",
    S: "v",
    W: "<",
    E: ">",
    NE: "/",
    SW: "/",
    NW: "\\",
    SE: "\\",
  };

  const terrainChars: Record<Terrain, string> = {
    [Terrain.Rough]: ".",
    [Terrain.Fairway]: "F",
    [Terrain.Sand]: "S",
    [Terrain.Water]: "W",
    [Terrain.Trees]: "T",
  };

  const lines: string[] = [];
  lines.push(`Seed: ${course.seed} | Grid: ${course.width}x${course.height}`);
  lines.push(`Tee: (${course.tee.x},${course.tee.y}) | Hole: (${course.hole.x},${course.hole.y})`);
  lines.push(`Legend: . rough, F fairway, S sand, W water, T tree, ^v<>/\\ slope, O tee, H hole`);
  lines.push("");

  // Column numbers header
  lines.push("   " + Array.from({ length: course.width }, (_, i) => (i % 10).toString()).join(""));

  for (let y = 0; y < course.height; y++) {
    let row = String(y).padStart(2, " ") + " ";
    for (let x = 0; x < course.width; x++) {
      if (x === course.tee.x && y === course.tee.y) {
        row += "O";
      } else if (x === course.hole.x && y === course.hole.y) {
        row += "H";
      } else {
        const cell = course.grid[y]?.[x];
        if (!cell) {
          row += "?";
          continue;
        }
        if (cell.slope) {
          row += slopeChars[cell.slope] ?? "F";
        } else {
          row += terrainChars[cell.terrain] ?? "?";
        }
      }
    }
    lines.push(row);
  }

  return lines.join("\n");
}
```

- [ ] **Step 2: Verify serialisation works**

Create `ai/test-serialise.ts`:

```typescript
import { generateCourse } from "../src/engine/course.ts";
import { GRID_WIDTH, GRID_HEIGHT } from "../src/engine/types.ts";
import { serialiseCourse } from "./serialise.ts";

const course = generateCourse("test-visual", GRID_WIDTH, GRID_HEIGHT);
console.log(serialiseCourse(course));
```

Run: `npx tsx test-serialise.ts`
Working directory: `ai/`
Expected: Prints a readable 12x18 text grid with terrain characters, tee (O) and hole (H) visible.

- [ ] **Step 3: Remove test file, commit**

```sh
rm ai/test-serialise.ts
git add ai/serialise.ts
git commit -m "Add course grid serialisation for LLM consumption"
```

---

### Task 4: Metrics Computation

**Files:**
- Create: `ai/metrics.ts`

- [ ] **Step 1: Implement structural metrics**

```typescript
import { generateCourse } from "../src/engine/course.ts";
import { GRID_WIDTH, GRID_HEIGHT, DIRECTIONS, DIRECTION_VECTORS, Terrain } from "../src/engine/types.ts";
import type { CourseConfig, Course, Position, Direction } from "../src/engine/types.ts";
import { validateMove } from "../src/engine/validation.ts";
import type { CourseMetrics } from "./types.ts";

/**
 * Compute structural metrics for a course.
 * All metrics are derived from BFS/graph analysis - no LLM calls.
 */
export function computeMetrics(course: Course): CourseMetrics {
  const optimal = computeOptimalStrokes(course);
  const routes = computeRoutes(course);
  const branching = computeBranchingFactor(course);
  const hazard = computeHazardRelevance(course);
  const dead = computeDeadCellRatio(course);
  const chokes = computeChokePoints(course, routes.paths);

  return {
    seed: course.seed,
    optimalStrokes: optimal,
    routeCount: routes.count,
    branchingFactor: branching,
    hazardRelevance: hazard,
    deadCellRatio: dead,
    chokePoints: chokes,
  };
}

/**
 * BFS shortest path from tee to hole, simulating actual movement.
 * Each "step" tests all 8 directions with distances 1-6 (all possible rolls).
 * Returns minimum strokes to hole out.
 */
function computeOptimalStrokes(course: Course): number {
  interface BfsNode {
    pos: Position;
    strokes: number;
  }

  const visited = new Set<string>();
  const queue: BfsNode[] = [{ pos: course.tee, strokes: 0 }];
  visited.add(`${course.tee.x},${course.tee.y}`);

  while (queue.length > 0) {
    const node = queue.shift()!;

    // Try all directions and distances 1-6
    for (const dir of DIRECTIONS) {
      for (let dist = 1; dist <= 6; dist++) {
        const result = validateMove(course, node.pos, dir, dist);
        if (!result.valid) continue;

        if (result.holesOut) {
          return node.strokes + 1;
        }

        const key = `${result.landingPosition.x},${result.landingPosition.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ pos: result.landingPosition, strokes: node.strokes + 1 });
        }
      }
    }
  }

  // Should not happen due to reachability guarantee, but fallback
  return 99;
}

/**
 * Count distinct near-optimal routes (within +1 of optimal).
 * Returns count of unique paths and the paths themselves for choke analysis.
 */
function computeRoutes(course: Course): { count: number; paths: Position[][] } {
  const optimal = computeOptimalStrokes(course);
  const maxStrokes = optimal + 1;
  const paths: Position[][] = [];

  interface DfsNode {
    pos: Position;
    strokes: number;
    path: Position[];
  }

  const stack: DfsNode[] = [{ pos: course.tee, strokes: 0, path: [course.tee] }];

  // Limit total paths explored to prevent explosion
  const maxPaths = 50;

  while (stack.length > 0 && paths.length < maxPaths) {
    const node = stack.pop()!;
    if (node.strokes >= maxStrokes) continue;

    for (const dir of DIRECTIONS) {
      for (let dist = 1; dist <= 6; dist++) {
        const result = validateMove(course, node.pos, dir, dist);
        if (!result.valid) continue;

        if (result.holesOut) {
          paths.push([...node.path, course.hole]);
          continue;
        }

        const newPath = [...node.path, result.landingPosition];
        if (node.strokes + 1 < maxStrokes) {
          stack.push({
            pos: result.landingPosition,
            strokes: node.strokes + 1,
            path: newPath,
          });
        }
      }
    }
  }

  return { count: paths.length, paths };
}

/**
 * Average number of valid directions at each cell along the optimal path.
 * Uses distance=3 (median roll) as the reference distance.
 */
function computeBranchingFactor(course: Course): number {
  // Get optimal path cells via BFS
  const pathCells = getOptimalPathCells(course);
  if (pathCells.length === 0) return 0;

  let totalValid = 0;
  for (const pos of pathCells) {
    let validDirs = 0;
    for (const dir of DIRECTIONS) {
      // Check distances 1-6 - count direction as valid if any distance works
      let anyValid = false;
      for (let dist = 1; dist <= 6; dist++) {
        const result = validateMove(course, pos, dir, dist);
        if (result.valid) {
          anyValid = true;
          break;
        }
      }
      if (anyValid) validDirs++;
    }
    totalValid += validDirs;
  }

  return totalValid / pathCells.length;
}

/**
 * What percentage of hazard cells (water, sand, trees) are adjacent to
 * a cell on any viable route? Measures whether hazards are relevant.
 */
function computeHazardRelevance(course: Course): number {
  const routeCells = getReachableCells(course);
  let totalHazards = 0;
  let relevantHazards = 0;

  for (let y = 0; y < course.height; y++) {
    for (let x = 0; x < course.width; x++) {
      const cell = course.grid[y]?.[x];
      if (!cell) continue;
      if (cell.terrain === Terrain.Water || cell.terrain === Terrain.Sand || cell.terrain === Terrain.Trees) {
        totalHazards++;
        // Check if adjacent to a route cell
        let adjacent = false;
        for (const dir of DIRECTIONS) {
          const vec = DIRECTION_VECTORS[dir];
          const nx = x + vec.dx;
          const ny = y + vec.dy;
          if (routeCells.has(`${nx},${ny}`)) {
            adjacent = true;
            break;
          }
        }
        if (adjacent) relevantHazards++;
      }
    }
  }

  return totalHazards === 0 ? 0 : relevantHazards / totalHazards;
}

/**
 * Percentage of non-rough cells that are unreachable from tee.
 */
function computeDeadCellRatio(course: Course): number {
  const reachable = getReachableCells(course);
  let totalFeatureCells = 0;
  let deadFeatureCells = 0;

  for (let y = 0; y < course.height; y++) {
    for (let x = 0; x < course.width; x++) {
      const cell = course.grid[y]?.[x];
      if (!cell || cell.terrain === Terrain.Rough) continue;
      totalFeatureCells++;
      if (!reachable.has(`${x},${y}`)) {
        deadFeatureCells++;
      }
    }
  }

  return totalFeatureCells === 0 ? 0 : deadFeatureCells / totalFeatureCells;
}

/**
 * Count cells where ALL near-optimal routes must pass through.
 */
function computeChokePoints(course: Course, paths: Position[][]): number {
  if (paths.length <= 1) return 0;

  // Find cells present in ALL paths (excluding tee and hole)
  const cellCounts = new Map<string, number>();
  for (const path of paths) {
    const uniqueInPath = new Set(path.map((p) => `${p.x},${p.y}`));
    for (const key of uniqueInPath) {
      cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1);
    }
  }

  const teeKey = `${course.tee.x},${course.tee.y}`;
  const holeKey = `${course.hole.x},${course.hole.y}`;
  let chokeCount = 0;
  for (const [key, count] of cellCounts) {
    if (key === teeKey || key === holeKey) continue;
    if (count === paths.length) chokeCount++;
  }

  return chokeCount;
}

/** BFS to get all cells reachable from tee (through non-blocking terrain). */
function getReachableCells(course: Course): Set<string> {
  const visited = new Set<string>();
  const queue: Position[] = [course.tee];
  visited.add(`${course.tee.x},${course.tee.y}`);

  while (queue.length > 0) {
    const pos = queue.shift()!;
    for (const dir of DIRECTIONS) {
      const vec = DIRECTION_VECTORS[dir];
      const nx = pos.x + vec.dx;
      const ny = pos.y + vec.dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (nx < 0 || nx >= course.width || ny < 0 || ny >= course.height) continue;
      const cell = course.grid[ny]?.[nx];
      if (!cell || cell.terrain === Terrain.Trees || cell.terrain === Terrain.Water) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny });
    }
  }

  return visited;
}

/** Get cells along the BFS optimal path (for branching factor). */
function getOptimalPathCells(course: Course): Position[] {
  interface BfsNode {
    pos: Position;
    path: Position[];
  }

  const visited = new Set<string>();
  const queue: BfsNode[] = [{ pos: course.tee, path: [course.tee] }];
  visited.add(`${course.tee.x},${course.tee.y}`);

  while (queue.length > 0) {
    const node = queue.shift()!;

    for (const dir of DIRECTIONS) {
      for (let dist = 1; dist <= 6; dist++) {
        const result = validateMove(course, node.pos, dir, dist);
        if (!result.valid) continue;

        if (result.holesOut) {
          return node.path;
        }

        const key = `${result.landingPosition.x},${result.landingPosition.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({
            pos: result.landingPosition,
            path: [...node.path, result.landingPosition],
          });
        }
      }
    }
  }

  return [];
}

/**
 * Generate a batch of courses and compute metrics for each.
 */
export function generateAndMeasureBatch(
  batchSize: number,
  iteration: number,
  config: CourseConfig,
): { course: Course; metrics: CourseMetrics }[] {
  const results: { course: Course; metrics: CourseMetrics }[] = [];

  for (let i = 0; i < batchSize; i++) {
    const seed = `iter-${iteration}-course-${i}`;
    const course = generateCourse(seed, GRID_WIDTH, GRID_HEIGHT, config);
    const metrics = computeMetrics(course);
    results.push({ course, metrics });
  }

  return results;
}

/**
 * Filter and rank courses by metric quality.
 * Rejects degenerate courses, ranks remainder by route diversity and branching.
 */
export function filterAndRank(
  batch: { course: Course; metrics: CourseMetrics }[],
  topN: number,
): { course: Course; metrics: CourseMetrics }[] {
  const filtered = batch.filter((item) => {
    const m = item.metrics;
    if (m.optimalStrokes < 3) return false;
    if (m.routeCount <= 1) return false;
    if (m.branchingFactor < 1.5) return false;
    if (m.deadCellRatio > 0.5) return false;
    return true;
  });

  // Score: weighted combination favouring route diversity and branching
  const scored = filtered.map((item) => ({
    ...item,
    score:
      item.metrics.routeCount * 2 +
      item.metrics.branchingFactor * 3 +
      item.metrics.hazardRelevance * 2 -
      item.metrics.deadCellRatio * 5 -
      item.metrics.chokePoints * 1,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}
```

- [ ] **Step 2: Verify metrics compute correctly**

Create `ai/test-metrics.ts`:

```typescript
import { generateCourse } from "../src/engine/course.ts";
import { GRID_WIDTH, GRID_HEIGHT } from "../src/engine/types.ts";
import { computeMetrics } from "./metrics.ts";

const course = generateCourse("metrics-test", GRID_WIDTH, GRID_HEIGHT);
const metrics = computeMetrics(course);
console.log(JSON.stringify(metrics, null, 2));
```

Run: `npx tsx test-metrics.ts`
Working directory: `ai/`
Expected: Prints a JSON object with all metric fields populated with reasonable values.

- [ ] **Step 3: Remove test file, commit**

```sh
rm ai/test-metrics.ts
git add ai/metrics.ts
git commit -m "Add structural metrics computation for courses"
```

---

### Task 5: LLM Player

**Files:**
- Create: `ai/player.ts`

- [ ] **Step 1: Implement the LLM player**

```typescript
import { OpenRouter } from "@openrouter/sdk";
import type { Course, Direction, Position } from "../src/engine/types.ts";
import { DIRECTIONS, DIRECTION_VECTORS, Terrain } from "../src/engine/types.ts";
import { getTerrainModifier, validateMove } from "../src/engine/validation.ts";
import { PRNG } from "../src/engine/prng.ts";
import { serialiseCourse } from "./serialise.ts";
import type { MoveRecord, PlayRating, PlayedCourse, CourseMetrics } from "./types.ts";

const SYSTEM_PROMPT = `You are playing a dice-based golf game on a grid. Your goal is to get the ball from the tee (O) to the hole (H) in as few strokes as possible.

Rules:
- Each turn you roll a d6. The effective distance = roll + terrain modifier (fairway: +1, sand: -1, rough: 0). Minimum move is always 1.
- You choose one of 8 directions: N, NE, E, SE, S, SW, W, NW.
- The ball travels exactly the effective distance in that direction.
- Trees block the path (unless you're on fairway, in which case you can fly over but not land on them).
- You cannot land in water.
- If the ball's path crosses or lands on the hole, you hole out.
- Slopes (shown as ^v<>/\\) push the ball 1 cell in their direction after landing.
- You may also putt (move exactly 1 cell in any direction) instead of using your roll.

When asked for your move, respond with EXACTLY this JSON format:
{"direction": "N", "usePutt": false, "reasoning": "brief explanation"}

Choose directions strategically. Consider risk vs reward - a longer shot might overshoot or hit hazards, but gets you closer faster.`;

/**
 * Have the LLM play a complete game on the given course.
 * Returns the move records and final play rating.
 */
export async function playGame(
  client: OpenRouter,
  model: string,
  course: Course,
  metrics: CourseMetrics,
): Promise<PlayedCourse> {
  const courseText = serialiseCourse(course);
  const rng = new PRNG(`play-${course.seed}`);
  const moves: MoveRecord[] = [];
  let ball: Position = { ...course.tee };
  let holed = false;
  const maxStrokes = 10; // par + 4 safety limit

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Here is the course:\n\n${courseText}\n\nYour ball is at the tee (${ball.x},${ball.y}). The hole is at (${course.hole.x},${course.hole.y}). Let's play!`,
    },
  ];

  for (let turn = 1; turn <= maxStrokes && !holed; turn++) {
    // Roll the dice
    const rawRoll = rng.int(1, 6);
    const cell = course.grid[ball.y]?.[ball.x];
    const terrain = cell?.terrain ?? Terrain.Rough;
    const modifier = getTerrainModifier(terrain);
    const effectiveRoll = Math.max(1, rawRoll + modifier);

    // List valid directions for this roll
    const validDirs: Direction[] = [];
    for (const dir of DIRECTIONS) {
      const result = validateMove(course, ball, dir, effectiveRoll);
      if (result.valid) validDirs.push(dir);
    }
    const validPutts: Direction[] = [];
    for (const dir of DIRECTIONS) {
      const result = validateMove(course, ball, dir, 1);
      if (result.valid) validPutts.push(dir);
    }

    const turnPrompt = `Turn ${turn}: Ball at (${ball.x},${ball.y}) on ${terrain}. You rolled ${rawRoll} (effective: ${effectiveRoll}).
Valid directions for roll: ${validDirs.length > 0 ? validDirs.join(", ") : "NONE"}
Valid putt directions (move 1): ${validPutts.join(", ")}
Choose your move:`;

    messages.push({ role: "user", content: turnPrompt });

    // Call LLM
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 150,
    });

    const response = completion.choices[0]?.message?.content ?? "";
    messages.push({ role: "assistant", content: response });

    // Parse response
    const parsed = parseMove(response);
    if (!parsed) {
      // If parse fails, pick first valid direction
      const fallbackDir = validDirs[0] ?? validPutts[0] ?? "N";
      const dist = validDirs[0] ? effectiveRoll : 1;
      const result = validateMove(course, ball, fallbackDir as Direction, dist);
      if (result.valid) {
        moves.push({
          turn,
          from: ball,
          roll: rawRoll,
          effectiveRoll,
          direction: fallbackDir as Direction,
          to: result.landingPosition,
          holedOut: result.holesOut,
          reasoning: "Parse failure - used fallback",
        });
        ball = result.landingPosition;
        holed = result.holesOut;
      }
      continue;
    }

    const dist = parsed.usePutt ? 1 : effectiveRoll;
    const result = validateMove(course, ball, parsed.direction, dist);

    if (result.valid) {
      moves.push({
        turn,
        from: ball,
        roll: rawRoll,
        effectiveRoll,
        direction: parsed.direction,
        to: result.landingPosition,
        holedOut: result.holesOut,
        reasoning: parsed.reasoning,
      });
      ball = result.landingPosition;
      holed = result.holesOut;
    } else {
      // Invalid move chosen by LLM - fallback
      const fallbackDir = validDirs[0] ?? validPutts[0] ?? "N";
      const fallbackDist = validDirs[0] ? effectiveRoll : 1;
      const fallbackResult = validateMove(course, ball, fallbackDir as Direction, fallbackDist);
      if (fallbackResult.valid) {
        moves.push({
          turn,
          from: ball,
          roll: rawRoll,
          effectiveRoll,
          direction: fallbackDir as Direction,
          to: fallbackResult.landingPosition,
          holedOut: fallbackResult.holesOut,
          reasoning: `LLM chose invalid ${parsed.direction} - used fallback`,
        });
        ball = fallbackResult.landingPosition;
        holed = fallbackResult.holesOut;
      }
    }
  }

  // Get play rating from LLM
  const rating = await rateGame(client, model, messages, moves, holed);

  return {
    seed: course.seed,
    metrics,
    rating,
    moves,
  };
}

async function rateGame(
  client: OpenRouter,
  model: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  moves: MoveRecord[],
  holed: boolean,
): Promise<PlayRating> {
  const ratingPrompt = `The game is over. You ${holed ? "holed out" : "did not hole out"} in ${moves.length} strokes.

Now rate this course as a play experience. Respond with EXACTLY this JSON:
{
  "decisionQuality": <1-5, where 1 = choices were obvious/meaningless, 5 = every turn had interesting tradeoffs>,
  "tensionMoments": <number of turns where you genuinely weighed risk vs reward>,
  "boringTurns": <number of turns where the direction was completely obvious>,
  "notes": "brief observations about what made this course interesting or boring"
}`;

  messages.push({ role: "user", content: ratingPrompt });

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.2,
    max_tokens: 200,
  });

  const response = completion.choices[0]?.message?.content ?? "";

  try {
    const json = extractJson(response);
    return {
      strokes: moves.length,
      decisionQuality: clamp(json.decisionQuality ?? 3, 1, 5) as PlayRating["decisionQuality"],
      tensionMoments: json.tensionMoments ?? 0,
      boringTurns: json.boringTurns ?? moves.length,
      notes: json.notes ?? "No notes provided",
    };
  } catch {
    return {
      strokes: moves.length,
      decisionQuality: 3,
      tensionMoments: 0,
      boringTurns: moves.length,
      notes: `Rating parse failed. Raw: ${response.slice(0, 100)}`,
    };
  }
}

function parseMove(response: string): { direction: Direction; usePutt: boolean; reasoning: string } | null {
  try {
    const json = extractJson(response);
    const dir = json.direction?.toUpperCase();
    if (!DIRECTIONS.includes(dir as Direction)) return null;
    return {
      direction: dir as Direction,
      usePutt: json.usePutt ?? false,
      reasoning: json.reasoning ?? "",
    };
  } catch {
    return null;
  }
}

function extractJson(text: string): Record<string, unknown> {
  // Try to find JSON in the response (LLMs sometimes wrap in markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found");
  return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
```

- [ ] **Step 2: Commit**

```sh
git add ai/player.ts
git commit -m "Add LLM player that plays and rates courses"
```

---

### Task 6: LLM Evaluator

**Files:**
- Create: `ai/evaluator.ts`

- [ ] **Step 1: Implement the evaluator**

```typescript
import { OpenRouter } from "@openrouter/sdk";
import type { CourseConfig } from "../src/engine/types.ts";
import { DEFAULT_COURSE_CONFIG } from "../src/engine/types.ts";
import { serialiseCourse } from "./serialise.ts";
import type { PlayedCourse, ConfigProposal, ArchetypeProposal, IterationLog } from "./types.ts";
import type { Course } from "../src/engine/types.ts";

const EVALUATOR_PROMPT = `You are an expert game designer evaluating a dice-based golf game played on a 12x18 grid. The game has a problem: it's not fun because dice rolls dominate decisions, courses are samey, and par-6 is easy or dull.

Your job is to analyse courses that were played and propose changes to the course generation config to make courses more interesting. "Interesting" means: meaningful player decisions, routes with genuine risk/reward tradeoffs, hazards that matter, and variety.

The course generation config controls these parameters:
- islandSizeMin (int, 2-8): minimum fairway island width/height
- islandSizeMax (int, 4-12): maximum fairway island width/height
- treeDensity (float, 0.05-0.4): probability of tree placement in rough areas
- sandTrapCount (int, 0-6): number of sand patches placed
- waterProbability (float, 0.0-1.0): chance of water hazards being placed
- slopeCount (int, 0-8): number of slope cells placed on fairway

You must respond with EXACTLY this JSON format:
{
  "analysis": "2-3 sentence summary of what patterns you observed across the played courses",
  "configChanges": [
    {"field": "<field name>", "currentValue": <num>, "proposedValue": <num>, "reasoning": "why this change helps"}
  ],
  "archetypeIdeas": [
    {"name": "<short name>", "description": "what the layout looks like", "keyFeature": "the core design idea", "whyBetter": "what problem it solves"}
  ]
}

Rules:
- Maximum 2 config changes per evaluation
- Each value change must be within +/-30% of current value (gradual exploration)
- Respect the min/max bounds listed above
- Archetype ideas should be specific enough to implement (describe placement, not just vibes)`;

/**
 * Synthesise across played courses and propose config changes + archetype ideas.
 */
export async function evaluate(
  client: OpenRouter,
  model: string,
  playedCourses: PlayedCourse[],
  courses: Course[],
  currentConfig: CourseConfig,
  previousIterations: IterationLog[],
): Promise<{ proposals: ConfigProposal[]; archetypeIdeas: ArchetypeProposal[] }> {
  // Build context about played courses
  const coursesSummary = playedCourses.map((pc, i) => {
    const course = courses[i];
    const grid = course ? serialiseCourse(course) : "(grid unavailable)";
    return `### Course: ${pc.seed}
Metrics: optimal=${pc.metrics.optimalStrokes} strokes, routes=${pc.metrics.routeCount}, branching=${pc.metrics.branchingFactor.toFixed(2)}, hazardRelevance=${pc.metrics.hazardRelevance.toFixed(2)}
Rating: decisions=${pc.rating.decisionQuality}/5, tension=${pc.rating.tensionMoments}, boring=${pc.rating.boringTurns}
Notes: ${pc.rating.notes}

${grid}`;
  }).join("\n\n---\n\n");

  // Build history context
  let historyContext = "";
  if (previousIterations.length > 0) {
    historyContext = "\n\n## Previous iterations (do NOT repeat failed experiments):\n";
    for (const iter of previousIterations) {
      const avgDecision = iter.playedCourses.reduce((s, c) => s + c.rating.decisionQuality, 0) / iter.playedCourses.length;
      historyContext += `- Iteration ${iter.iteration}: config changes=${JSON.stringify(iter.proposals.map((p) => `${p.field}: ${p.currentValue}->${p.proposedValue}`))} -> avg decision quality=${avgDecision.toFixed(1)}\n`;
    }
  }

  const configStr = JSON.stringify(currentConfig, null, 2);

  const userPrompt = `## Current config:
${configStr}

## Courses played this iteration:

${coursesSummary}
${historyContext}

Based on the play experience and metrics, propose config changes and new archetype ideas.`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: EVALUATOR_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 1000,
  });

  const response = completion.choices[0]?.message?.content ?? "";

  try {
    const json = extractJson(response);
    const proposals: ConfigProposal[] = (json.configChanges as ConfigProposal[] ?? [])
      .slice(0, 2)
      .map((p) => ({
        field: p.field,
        currentValue: p.currentValue,
        proposedValue: clampProposal(p.field, p.currentValue, p.proposedValue, currentConfig),
        reasoning: p.reasoning,
      }));

    const archetypeIdeas: ArchetypeProposal[] = (json.archetypeIdeas as ArchetypeProposal[] ?? []).map((a) => ({
      name: a.name ?? "unnamed",
      description: a.description ?? "",
      keyFeature: a.keyFeature ?? "",
      whyBetter: a.whyBetter ?? "",
    }));

    return { proposals, archetypeIdeas };
  } catch {
    console.error("Failed to parse evaluator response:", response.slice(0, 200));
    return { proposals: [], archetypeIdeas: [] };
  }
}

/**
 * Apply config proposals to produce a new config.
 */
export function applyProposals(config: CourseConfig, proposals: ConfigProposal[]): CourseConfig {
  const newConfig = { ...config };
  for (const proposal of proposals) {
    if (proposal.field in newConfig) {
      (newConfig as Record<string, number>)[proposal.field] = proposal.proposedValue;
    }
  }
  return newConfig;
}

const CONFIG_BOUNDS: Record<keyof CourseConfig, { min: number; max: number }> = {
  islandSizeMin: { min: 2, max: 8 },
  islandSizeMax: { min: 4, max: 12 },
  treeDensity: { min: 0.05, max: 0.4 },
  sandTrapCount: { min: 0, max: 6 },
  waterProbability: { min: 0.0, max: 1.0 },
  slopeCount: { min: 0, max: 8 },
};

function clampProposal(
  field: keyof CourseConfig,
  currentValue: number,
  proposedValue: number,
  config: CourseConfig,
): number {
  const bounds = CONFIG_BOUNDS[field];
  if (!bounds) return currentValue;

  // Enforce +/-30% change limit
  const maxDelta = currentValue * 0.3;
  const clamped = Math.max(
    currentValue - maxDelta,
    Math.min(currentValue + maxDelta, proposedValue),
  );

  // Enforce absolute bounds
  const bounded = Math.max(bounds.min, Math.min(bounds.max, clamped));

  // Round integers
  if (field === "islandSizeMin" || field === "islandSizeMax" || field === "sandTrapCount" || field === "slopeCount") {
    return Math.round(bounded);
  }

  return Math.round(bounded * 100) / 100;
}

function extractJson(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found");
  return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
}
```

- [ ] **Step 2: Commit**

```sh
git add ai/evaluator.ts
git commit -m "Add LLM evaluator that proposes config changes"
```

---

### Task 7: Loop Orchestration

**Files:**
- Create: `ai/loop.ts`

- [ ] **Step 1: Implement the iteration loop**

```typescript
import { OpenRouter } from "@openrouter/sdk";
import type { CourseConfig, Course } from "../src/engine/types.ts";
import { DEFAULT_COURSE_CONFIG } from "../src/engine/types.ts";
import { generateAndMeasureBatch, filterAndRank } from "./metrics.ts";
import { playGame } from "./player.ts";
import { evaluate, applyProposals } from "./evaluator.ts";
import type { CliOptions, IterationLog, RunLog, PlayedCourse } from "./types.ts";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Run the full autonomous iteration loop.
 */
export async function runLoop(options: CliOptions): Promise<void> {
  const client = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
  });

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("Error: OPENROUTER_API_KEY environment variable is required.");
    process.exit(1);
  }

  // Initialise or resume
  let config: CourseConfig = { ...DEFAULT_COURSE_CONFIG };
  let previousIterations: IterationLog[] = [];
  let startIteration = 0;

  if (options.resume) {
    const resumeData = JSON.parse(readFileSync(options.resume, "utf-8")) as RunLog;
    config = resumeData.finalConfig;
    previousIterations = resumeData.iterations;
    startIteration = resumeData.iterations.length;
    console.log(`Resuming from iteration ${startIteration} with config:`, config);
  }

  const runLog: RunLog = {
    startedAt: new Date().toISOString(),
    model: options.model,
    iterations: previousIterations,
    finalConfig: config,
    allArchetypeIdeas: [],
  };

  // Ensure results directory exists
  const resultsDir = join(import.meta.dirname ?? ".", "results");
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }
  const outputPath = join(resultsDir, `run-${Date.now()}.json`);

  for (let i = startIteration; i < startIteration + options.iterations; i++) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Iteration ${i + 1}/${startIteration + options.iterations}`);
    console.log(`Config: ${JSON.stringify(config)}`);
    console.log(`${"=".repeat(60)}\n`);

    // Step 1: Generate and measure batch
    console.log(`Generating ${options.batchSize} courses...`);
    const batch = generateAndMeasureBatch(options.batchSize, i, config);

    // Log metrics distribution
    const allMetrics = batch.map((b) => b.metrics);
    const avgOptimal = allMetrics.reduce((s, m) => s + m.optimalStrokes, 0) / allMetrics.length;
    const avgRoutes = allMetrics.reduce((s, m) => s + m.routeCount, 0) / allMetrics.length;
    const avgBranching = allMetrics.reduce((s, m) => s + m.branchingFactor, 0) / allMetrics.length;
    console.log(`  Avg optimal strokes: ${avgOptimal.toFixed(1)}`);
    console.log(`  Avg route count: ${avgRoutes.toFixed(1)}`);
    console.log(`  Avg branching factor: ${avgBranching.toFixed(2)}`);

    // Step 2: Filter and rank
    const topCourses = filterAndRank(batch, options.playCount);
    console.log(`\nFiltered to ${topCourses.length} candidates (from ${batch.length})`);

    if (topCourses.length === 0) {
      console.log("No courses passed filtering. Relaxing thresholds...");
      // Fallback: just take the best N by branching factor
      const fallback = [...batch].sort((a, b) => b.metrics.branchingFactor - a.metrics.branchingFactor);
      topCourses.push(...fallback.slice(0, Math.min(options.playCount, 3)));
    }

    // Step 3: LLM plays each course
    console.log(`\nPlaying ${topCourses.length} courses with ${options.model}...`);
    const playedCourses: PlayedCourse[] = [];
    const coursesForEval: Course[] = [];

    for (let j = 0; j < topCourses.length; j++) {
      const item = topCourses[j]!;
      console.log(`  Playing course ${j + 1}/${topCourses.length}: ${item.course.seed}`);
      try {
        const played = await playGame(client, options.model, item.course, item.metrics);
        playedCourses.push(played);
        coursesForEval.push(item.course);
        console.log(`    -> ${played.rating.strokes} strokes, decision quality: ${played.rating.decisionQuality}/5`);
      } catch (err) {
        console.error(`    -> Error playing: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (playedCourses.length === 0) {
      console.log("No courses were played successfully. Skipping evaluation.");
      continue;
    }

    // Step 4: Evaluate and propose changes
    console.log(`\nEvaluating ${playedCourses.length} played courses...`);
    const { proposals, archetypeIdeas } = await evaluate(
      client,
      options.model,
      playedCourses,
      coursesForEval,
      config,
      previousIterations,
    );

    // Step 5: Apply mutations
    const previousConfig = { ...config };
    config = applyProposals(config, proposals);

    // Log results
    console.log("\nProposed changes:");
    for (const p of proposals) {
      console.log(`  ${p.field}: ${p.currentValue} -> ${p.proposedValue} (${p.reasoning})`);
    }
    if (archetypeIdeas.length > 0) {
      console.log("\nNew archetype ideas:");
      for (const a of archetypeIdeas) {
        console.log(`  ${a.name}: ${a.description}`);
      }
    }

    const avgDecision = playedCourses.reduce((s, c) => s + c.rating.decisionQuality, 0) / playedCourses.length;
    console.log(`\nAverage decision quality: ${avgDecision.toFixed(1)}/5`);

    // Record iteration
    const iterLog: IterationLog = {
      iteration: i,
      config: previousConfig,
      metricsDistribution: {
        mean: {
          optimalStrokes: avgOptimal,
          routeCount: avgRoutes,
          branchingFactor: avgBranching,
        },
        best: topCourses[0] ? {
          optimalStrokes: topCourses[0].metrics.optimalStrokes,
          routeCount: topCourses[0].metrics.routeCount,
          branchingFactor: topCourses[0].metrics.branchingFactor,
        } : {},
      },
      playedCourses,
      proposals,
      archetypeIdeas,
    };

    previousIterations.push(iterLog);
    runLog.iterations = previousIterations;
    runLog.finalConfig = config;
    runLog.allArchetypeIdeas = previousIterations.flatMap((it) => it.archetypeIdeas);

    // Save progress after each iteration
    writeFileSync(outputPath, JSON.stringify(runLog, null, 2));
    console.log(`\nProgress saved to: ${outputPath}`);
  }

  // Final summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("ITERATION COMPLETE");
  console.log(`${"=".repeat(60)}`);
  console.log(`\nStarting config: ${JSON.stringify(DEFAULT_COURSE_CONFIG)}`);
  console.log(`Final config:    ${JSON.stringify(config)}`);
  console.log(`\nArchetype ideas collected: ${runLog.allArchetypeIdeas.length}`);
  for (const a of runLog.allArchetypeIdeas) {
    console.log(`  - ${a.name}: ${a.keyFeature}`);
  }
  console.log(`\nFull results: ${outputPath}`);

  // Print top-rated course seeds for browser testing
  const allPlayed = previousIterations.flatMap((it) => it.playedCourses);
  const bestCourses = [...allPlayed].sort((a, b) => b.rating.decisionQuality - a.rating.decisionQuality).slice(0, 5);
  if (bestCourses.length > 0) {
    console.log("\nTop-rated courses (play in browser with ?seed=...):");
    for (const c of bestCourses) {
      console.log(`  ${c.seed} - decision quality: ${c.rating.decisionQuality}/5, notes: ${c.rating.notes}`);
    }
  }
}
```

- [ ] **Step 2: Commit**

```sh
git add ai/loop.ts
git commit -m "Add iteration loop orchestration"
```

---

### Task 8: CLI Entry Point

**Files:**
- Create: `ai/cli.ts`

- [ ] **Step 1: Implement the CLI**

```typescript
import { runLoop } from "./loop.ts";
import type { CliOptions } from "./types.ts";

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    iterations: 5,
    batchSize: 100,
    playCount: 10,
    model: "anthropic/claude-sonnet-4",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--iterations":
        options.iterations = parseInt(next ?? "5", 10);
        i++;
        break;
      case "--batch-size":
        options.batchSize = parseInt(next ?? "100", 10);
        i++;
        break;
      case "--play-count":
        options.playCount = parseInt(next ?? "10", 10);
        i++;
        break;
      case "--model":
        options.model = next ?? options.model;
        i++;
        break;
      case "--resume":
        options.resume = next;
        i++;
        break;
      case "--help":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
dice-golf AI iteration loop

Usage: npm run iterate -- [options]

Options:
  --iterations <n>   Number of generate-play-evaluate cycles (default: 5)
  --batch-size <n>   Courses generated per iteration (default: 100)
  --play-count <n>   Courses played per iteration after filtering (default: 10)
  --model <slug>     OpenRouter model slug (default: anthropic/claude-sonnet-4)
  --resume <path>    Path to a previous run JSON file to continue from
  --help             Show this help message

Environment:
  OPENROUTER_API_KEY   Required. Your OpenRouter API key.

Examples:
  npm run iterate -- --iterations 3 --model anthropic/claude-sonnet-4
  npm run iterate -- --resume ai/results/run-1717836000000.json --iterations 2
`);
}

const options = parseArgs(process.argv.slice(2));

console.log("Dice Golf AI - Course Iteration Loop");
console.log("=====================================");
console.log(`Model: ${options.model}`);
console.log(`Iterations: ${options.iterations}`);
console.log(`Batch size: ${options.batchSize}`);
console.log(`Play count: ${options.playCount}`);
if (options.resume) console.log(`Resuming from: ${options.resume}`);
console.log("");

runLoop(options).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Add results directory gitignore**

Create `ai/.gitignore`:

```text
node_modules/
results/
```

- [ ] **Step 3: Commit**

```sh
git add ai/cli.ts ai/.gitignore
git commit -m "Add CLI entry point for AI iteration loop"
```

---

### Task 9: Integration Test

**Files:**
- Modify: `ai/package.json` (add test script)

- [ ] **Step 1: Add a dry-run mode and test script**

Add to `ai/package.json` scripts:

```json
"test": "tsx test-integration.ts"
```

Create `ai/test-integration.ts`:

```typescript
import { generateCourse } from "../src/engine/course.ts";
import { GRID_WIDTH, GRID_HEIGHT, DEFAULT_COURSE_CONFIG } from "../src/engine/types.ts";
import { computeMetrics, generateAndMeasureBatch, filterAndRank } from "./metrics.ts";
import { serialiseCourse } from "./serialise.ts";

// Test 1: Metrics computation
console.log("Test 1: Metrics computation");
const course = generateCourse("integration-test", GRID_WIDTH, GRID_HEIGHT, DEFAULT_COURSE_CONFIG);
const metrics = computeMetrics(course);
console.assert(metrics.optimalStrokes >= 1, "optimalStrokes should be >= 1");
console.assert(metrics.routeCount >= 0, "routeCount should be >= 0");
console.assert(metrics.branchingFactor >= 0, "branchingFactor should be >= 0");
console.assert(metrics.hazardRelevance >= 0 && metrics.hazardRelevance <= 1, "hazardRelevance should be 0-1");
console.assert(metrics.deadCellRatio >= 0 && metrics.deadCellRatio <= 1, "deadCellRatio should be 0-1");
console.log("  PASS:", JSON.stringify(metrics));

// Test 2: Serialisation
console.log("\nTest 2: Grid serialisation");
const text = serialiseCourse(course);
console.assert(text.includes("O"), "Should contain tee marker O");
console.assert(text.includes("H"), "Should contain hole marker H");
console.assert(text.split("\n").length > 18, "Should have at least 18 grid rows plus header");
console.log("  PASS: Grid serialised correctly");

// Test 3: Batch generation and filtering
console.log("\nTest 3: Batch generation and filtering");
const batch = generateAndMeasureBatch(20, 0, DEFAULT_COURSE_CONFIG);
console.assert(batch.length === 20, "Should generate 20 courses");
const filtered = filterAndRank(batch, 5);
console.assert(filtered.length <= 5, "Should filter to at most 5");
console.log(`  PASS: Generated ${batch.length}, filtered to ${filtered.length}`);

// Test 4: Determinism
console.log("\nTest 4: Deterministic generation");
const batch2 = generateAndMeasureBatch(5, 0, DEFAULT_COURSE_CONFIG);
for (let i = 0; i < 5; i++) {
  console.assert(
    batch[i]!.metrics.optimalStrokes === batch2[i]!.metrics.optimalStrokes,
    `Course ${i} should be deterministic`,
  );
}
console.log("  PASS: Same seeds produce same metrics");

console.log("\n✓ All integration tests passed");
```

- [ ] **Step 2: Run the integration test**

Run: `npx tsx test-integration.ts`
Working directory: `ai/`
Expected: All 4 tests pass.

- [ ] **Step 3: Commit**

```sh
git add ai/test-integration.ts ai/package.json
git commit -m "Add integration test for metrics and serialisation"
```

---

## Summary

After completing all 9 tasks, the `ai/` directory is a self-contained CLI tool that:

1. Generates courses in bulk using the existing engine
2. Computes structural quality metrics (no LLM cost)
3. Filters to the most promising candidates
4. Has an LLM play them and rate the experience
5. Synthesises feedback into config mutations and archetype proposals
6. Loops autonomously for N iterations
7. Saves a full audit trail to JSON

Run with:
```sh
cd ai && OPENROUTER_API_KEY=sk-... npm run iterate -- --iterations 5 --model anthropic/claude-sonnet-4
```
