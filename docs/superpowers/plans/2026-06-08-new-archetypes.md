# New Archetypes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new course archetypes (forest-slalom and sloped-amphitheatre) proposed by the AI iteration loop.

**Architecture:** Two new exported functions in `archetypes.ts` following the existing pattern. Registered in `types.ts` (ARCHETYPES array) and `course.ts` (ARCHETYPE_FNS map). Tests in `archetypes.test.ts`.

**Tech Stack:** TypeScript, Vitest

**Design decisions:**
- Forest slalom uses diagonal tree lines across a large fairway to create corridors - directly addresses "dice roll dominates" by making straight-line 6-rolls hit trees
- Sloped amphitheatre uses slopes as a core mechanic around the green - novel use of slopes that no existing archetype focuses on
- Both follow the exact same function signature and grid primitive usage as existing archetypes

---

### Task 1: Register the new archetype names

**Files:**
- Modify: `src/engine/types.ts:48-55`
- Modify: `src/engine/course.ts:1-31`

- [ ] **Step 1: Add archetype names to the ARCHETYPES array**

In `src/engine/types.ts`, change:

```typescript
export const ARCHETYPES = [
  "island-hop",
  "gauntlet",
  "split-decision",
  "dogleg",
  "fortress-green",
] as const;
```

To:

```typescript
export const ARCHETYPES = [
  "island-hop",
  "gauntlet",
  "split-decision",
  "dogleg",
  "fortress-green",
  "forest-slalom",
  "sloped-amphitheatre",
] as const;
```

- [ ] **Step 2: Add placeholder imports and registration in course.ts**

In `src/engine/course.ts`, add to the imports:

```typescript
import { dogleg, forestSlalom, fortressGreen, gauntlet, islandHop, slopedAmphitheatre, splitDecision } from "./archetypes";
```

And add to the `ARCHETYPE_FNS` map:

```typescript
  "forest-slalom": forestSlalom,
  "sloped-amphitheatre": slopedAmphitheatre,
```

- [ ] **Step 3: Verify existing tests still pass**

Run: `npm test`
Expected: Tests fail because `forestSlalom` and `slopedAmphitheatre` don't exist yet. This is expected - we're registering them first so the next tasks can implement them.

- [ ] **Step 4: Commit**

```sh
git add src/engine/types.ts src/engine/course.ts
git commit -m "Register forest-slalom and sloped-amphitheatre archetypes"
```

---

### Task 2: Implement forest-slalom archetype

**Files:**
- Modify: `src/engine/archetypes.ts`
- Modify: `src/engine/archetypes.test.ts`

- [ ] **Step 1: Write the test**

Add to `src/engine/archetypes.test.ts`:

```typescript
import { dogleg, forestSlalom, fortressGreen, gauntlet, islandHop, slopedAmphitheatre, splitDecision } from "./archetypes";
```

And add the test block:

```typescript
describe("forestSlalom", () => {
  it("creates a single large fairway region", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    forestSlalom(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("fs1"));
    const components = countFairwayComponents(grid, 12, 18);
    // Should be mostly one connected fairway with tree barriers cutting into it
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
    // Should have significant tree coverage from the diagonal barriers
    expect(treeCount).toBeGreaterThanOrEqual(12);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/engine/archetypes.test.ts`
Expected: FAIL - `forestSlalom` is not exported / not a function.

- [ ] **Step 3: Implement the archetype**

Add to `src/engine/archetypes.ts`:

```typescript
/**
 * Forest Slalom: A single large fairway with diagonal tree lines cutting
 * across it, creating a winding corridor. The player must zig-zag around
 * tree barriers. Sand at gap openings. Optional water on the outside of
 * a bend. Scattered extra trees controlled by treeDensity.
 */
export function forestSlalom(
  grid: Cell[][],
  width: number,
  height: number,
  _tee: Position,
  _hole: Position,
  config: CourseConfig,
  rng: PRNG,
): void {
  // Step 1: Place one large fairway island spanning most of the grid
  const margin = 1;
  placeIsland(
    grid,
    width,
    height,
    { x: margin, y: 2, w: width - margin * 2, h: height - 4 },
    rng,
  );

  // Step 2: Place 3-4 diagonal tree lines across the fairway
  const lineCount = rng.int(3, 4);
  const sectionH = Math.floor((height - 4) / (lineCount + 1));

  for (let i = 0; i < lineCount; i++) {
    const fromLeft = i % 2 === 0;
    const lineY = 3 + sectionH * (i + 1);
    const lineWidth = Math.floor(width * 0.55); // covers just over half the grid

    const startX = fromLeft ? margin : width - margin - lineWidth;

    // Place 2-cell-thick diagonal tree line
    for (let dx = 0; dx < lineWidth; dx++) {
      const x = startX + dx;
      // Slight diagonal: shift y by 1 for every 3-4 cells
      const yOffset = Math.floor(dx / (fromLeft ? 3 : 4)) * (fromLeft ? -1 : 1);
      const y1 = lineY + yOffset;
      const y2 = y1 + 1;

      for (const y of [y1, y2]) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const cell = grid[y]?.[x];
          if (cell && cell.terrain === Terrain.Fairway) {
            cell.terrain = Terrain.Trees;
          }
        }
      }
    }

    // Sand trap at the gap opening (the side without trees)
    const gapX = fromLeft ? Math.min(width - 2, startX + lineWidth) : Math.max(0, startX - 1);
    placeSandPatch(grid, width, height, gapX, lineY, 2, 1);
  }

  // Step 3: Optional water block on the outside of one bend
  if (rng.chance(config.waterProbability)) {
    const bendIndex = rng.int(0, lineCount - 1);
    const fromLeft = bendIndex % 2 === 0;
    const waterY = 3 + sectionH * (bendIndex + 1) + 2;
    const waterX = fromLeft ? rng.int(0, margin) : rng.int(width - 3, width - 1);
    placeWaterBlock(grid, width, height, Math.max(0, waterX), Math.max(0, waterY), 2, 2);
  }

  // Step 4: Extra scattered tree clusters based on treeDensity
  const extraTrees = Math.floor(config.treeDensity * 10);
  for (let t = 0; t < extraTrees; t++) {
    const tx = rng.int(0, width - 2);
    const ty = rng.int(0, height - 2);
    placeTreeCluster(grid, width, height, tx, ty, 2, 1);
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/archetypes.test.ts`
Expected: All tests pass including the new forestSlalom tests.

- [ ] **Step 5: Commit**

```sh
git add src/engine/archetypes.ts src/engine/archetypes.test.ts
git commit -m "Add forest-slalom archetype"
```

---

### Task 3: Implement sloped-amphitheatre archetype

**Files:**
- Modify: `src/engine/archetypes.ts`
- Modify: `src/engine/archetypes.test.ts`

- [ ] **Step 1: Write the test**

Add to `src/engine/archetypes.test.ts`:

```typescript
describe("slopedAmphitheatre", () => {
  it("places slopes around the green area", () => {
    const grid = createGrid(12, 18);
    const { tee, hole } = makeTeeHole();
    slopedAmphitheatre(grid, 12, 18, tee, hole, DEFAULT_COURSE_CONFIG, new PRNG("amp1"));

    let slopeCount = 0;
    // Check the area around the hole for slopes
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/engine/archetypes.test.ts`
Expected: FAIL - `slopedAmphitheatre` is not exported / not a function.

- [ ] **Step 3: Implement the archetype**

Add to `src/engine/archetypes.ts`:

```typescript
/**
 * Sloped Amphitheatre: Green sits in a bowl surrounded by inward-facing
 * slopes. Large tee pad at the bottom, mid-approach fairway, small green
 * at top. Slopes around the green push the ball inward - landing on the
 * correct side helps, wrong side pushes past. Sand ring outside the slopes.
 * Water flanking the approach corridor. Tree clusters scattered.
 */
export function slopedAmphitheatre(
  grid: Cell[][],
  width: number,
  height: number,
  _tee: Position,
  hole: Position,
  config: CourseConfig,
  rng: PRNG,
): void {
  // Step 1: Large tee pad at bottom
  const teeW = rng.int(config.islandSizeMin + 1, config.islandSizeMax);
  const teeH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const teeX = Math.max(0, Math.min(width - teeW, Math.floor(width / 2) - Math.floor(teeW / 2)));
  const teeY = Math.max(0, Math.min(height - teeH, height - teeH - 1));
  placeIsland(grid, width, height, { x: teeX, y: teeY, w: teeW, h: teeH }, rng);

  // Step 2: Mid-approach fairway
  const midW = rng.int(config.islandSizeMin, config.islandSizeMax);
  const midH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const midX = Math.max(0, Math.min(width - midW, Math.floor(width / 2) - Math.floor(midW / 2)));
  const midY = Math.max(0, Math.floor(height * 0.45) - Math.floor(midH / 2));
  placeIsland(grid, width, height, { x: midX, y: midY, w: midW, h: midH }, rng);

  // Step 3: Green area around the hole - wider than fortress-green for the slope bowl
  const greenW = rng.int(config.islandSizeMin + 1, Math.min(config.islandSizeMax, 6));
  const greenH = rng.int(config.islandSizeMin + 1, Math.min(config.islandSizeMax, 5));
  const greenX = Math.max(1, Math.min(width - greenW - 1, hole.x - Math.floor(greenW / 2)));
  const greenY = Math.max(1, Math.min(height - greenH, hole.y - 1));
  placeIsland(grid, width, height, { x: greenX, y: greenY, w: greenW, h: greenH }, rng);

  // Step 4: Place inward-facing slopes around the green perimeter
  // Slopes on fairway cells just inside the green edge, pointing toward the hole
  const slopePositions: { x: number; y: number; dir: "N" | "S" | "E" | "W" | "NE" | "NW" | "SE" | "SW" }[] = [];

  // Top edge - slopes pointing south (toward hole)
  for (let dx = 0; dx < greenW; dx++) {
    slopePositions.push({ x: greenX + dx, y: greenY, dir: "S" });
  }
  // Bottom edge - slopes pointing north
  for (let dx = 0; dx < greenW; dx++) {
    slopePositions.push({ x: greenX + dx, y: greenY + greenH - 1, dir: "N" });
  }
  // Left edge - slopes pointing east
  for (let dy = 1; dy < greenH - 1; dy++) {
    slopePositions.push({ x: greenX, y: greenY + dy, dir: "E" });
  }
  // Right edge - slopes pointing west
  for (let dy = 1; dy < greenH - 1; dy++) {
    slopePositions.push({ x: greenX + greenW - 1, y: greenY + dy, dir: "W" });
  }

  // Place slopes, skipping the hole cell itself
  for (const sp of slopePositions) {
    if (sp.x === hole.x && sp.y === hole.y) continue;
    if (sp.x < 0 || sp.x >= width || sp.y < 0 || sp.y >= height) continue;
    const cell = grid[sp.y]?.[sp.x];
    if (cell && cell.terrain === Terrain.Fairway) {
      cell.slope = sp.dir;
    }
  }

  // Step 5: Sand ring outside the green
  for (let dy = -1; dy <= greenH; dy++) {
    for (let dx = -1; dx <= greenW; dx++) {
      const sx = greenX + dx;
      const sy = greenY + dy;
      const isInside = dx >= 0 && dx < greenW && dy >= 0 && dy < greenH;
      if (!isInside && sx >= 0 && sx < width && sy >= 0 && sy < height) {
        placeSandPatch(grid, width, height, sx, sy, 1, 1);
      }
    }
  }

  // Step 6: Water flanking the approach corridor
  const approachY = midY;
  const waterH = Math.max(1, Math.min(3, greenY - midY));
  placeWaterBlock(grid, width, height, Math.max(0, midX - 3), approachY, 2, waterH);
  placeWaterBlock(grid, width, height, Math.min(width - 2, midX + midW + 1), approachY, 2, waterH);

  // Step 7: Tree clusters scattered
  for (let t = 0; t < 3; t++) {
    const tx = rng.int(0, width - 2);
    const ty = rng.int(0, height - 2);
    placeTreeCluster(grid, width, height, tx, ty, 2, 2);
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/archetypes.test.ts`
Expected: All tests pass including the new slopedAmphitheatre tests.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: All tests pass. The course generation tests should still pass because `generateCourse` picks archetypes randomly and the reachability check will retry if a generated course is unreachable.

- [ ] **Step 6: Commit**

```sh
git add src/engine/archetypes.ts src/engine/archetypes.test.ts
git commit -m "Add sloped-amphitheatre archetype"
```
