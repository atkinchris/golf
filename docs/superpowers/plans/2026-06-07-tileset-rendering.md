# Tileset Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace solid-colour terrain rendering with greyscale tileset rendering featuring rounded corners, dot grids, and terrain-specific patterns.

**Architecture:** Layered canvas drawing - rough fills everything, then fairway/sand/water are drawn on top with rounded corners using a neighbour-checking algorithm. Trees rendered as icons. All rendering stays in `GameCanvas.tsx` with extracted helper functions.

**Tech Stack:** Canvas 2D API, TypeScript, React

---

### Task 1: Update CELL_SIZE and remove pixelated rendering

**Files:**
- Modify: `src/components/GameCanvas.tsx:20`
- Modify: `src/components/GameCanvas.css:5`

- [ ] **Step 1: Update CELL_SIZE constant**

In `src/components/GameCanvas.tsx`, change line 20:

```typescript
const CELL_SIZE = 64;
```

- [ ] **Step 2: Remove image-rendering: pixelated from CSS**

In `src/components/GameCanvas.css`, remove the `image-rendering: pixelated;` line:

```css
.game-canvas {
  width: 100%;
  max-width: 100%;
  height: auto;
  display: block;
}
```

- [ ] **Step 3: Verify the app still renders (will look huge but functional)**

Run: `npm run dev`

Open in browser - the course should render at 4x the previous size with the same solid colours. The canvas will be 1280x1920 but CSS scales it down to fit.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameCanvas.tsx src/components/GameCanvas.css
git commit -m "Increase cell size to 64px, remove pixelated rendering"
```

---

### Task 2: Replace terrain constants with greyscale palette

**Files:**
- Modify: `src/components/GameCanvas.tsx:6-19`

- [ ] **Step 1: Replace TERRAIN_COLOURS and marker constants**

Replace lines 6-19 in `src/components/GameCanvas.tsx` with:

```typescript
const TERRAIN_COLOURS: Record<Terrain, string> = {
  [Terrain.Rough]: "#f5f5f3",
  [Terrain.Fairway]: "#d4d4d0",
  [Terrain.Sand]: "#e8e8e4",
  [Terrain.Water]: "#4a4a4a",
  [Terrain.Trees]: "#f5f5f3", // trees use rough background (icons drawn separately)
};

const DOT_COLOUR_LIGHT = "#c0c0c0";
const DOT_COLOUR_DARK = "#6a6a6a";
const GRID_LINE_COLOUR = "#5a5a5a";
const HATCH_COLOUR = "#c8c8c4";
const TREE_COLOUR = "#1a1a1a";
const SLOPE_ARROW_COLOUR = "#00000044";
const BALL_COLOUR = "#ffffff";
const BALL_OUTLINE = "#333333";
const TEE_COLOUR = "#1a1a1a";
const HOLE_COLOUR = "#1a1a1a";
const PATH_COLOUR = "#ffffff88";
const CORNER_RADIUS = 24;
```

- [ ] **Step 2: Verify it still compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/GameCanvas.tsx
git commit -m "Replace colour palette with greyscale"
```

---

### Task 3: Implement the corner-rounding utility functions

**Files:**
- Modify: `src/components/GameCanvas.tsx` (add functions before `drawCourse`)

- [ ] **Step 1: Add neighbour-checking and rounded rect path helpers**

Insert these functions above the `drawCourse` function (before line 39):

```typescript
/** Returns true if the cell at (x, y) is a non-rough filled terrain (not trees). */
function isNonRough(grid: Cell[][], x: number, y: number, width: number, height: number): boolean {
  if (x < 0 || x >= width || y < 0 || y >= height) return false;
  const terrain = grid[y]?.[x]?.terrain;
  return terrain !== undefined && terrain !== Terrain.Rough && terrain !== Terrain.Trees;
}

/** Returns true if the cell at (x, y) has the given terrain type. */
function isSameTerrain(
  grid: Cell[][],
  x: number,
  y: number,
  terrain: Terrain,
  width: number,
  height: number,
): boolean {
  if (x < 0 || x >= width || y < 0 || y >= height) return false;
  return grid[y]?.[x]?.terrain === terrain;
}

/**
 * Traces a rounded rect path for a tile. Corners round only when both
 * adjacent cardinals are rough/trees/OOB.
 */
function roundedTilePath(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  x: number,
  y: number,
  grid: Cell[][],
  width: number,
  height: number,
  cellSize: number,
  radius: number,
): void {
  const topNonRough = isNonRough(grid, x, y - 1, width, height);
  const bottomNonRough = isNonRough(grid, x, y + 1, width, height);
  const leftNonRough = isNonRough(grid, x - 1, y, width, height);
  const rightNonRough = isNonRough(grid, x + 1, y, width, height);

  const rTL = !topNonRough && !leftNonRough ? radius : 0;
  const rTR = !topNonRough && !rightNonRough ? radius : 0;
  const rBL = !bottomNonRough && !leftNonRough ? radius : 0;
  const rBR = !bottomNonRough && !rightNonRough ? radius : 0;

  ctx.beginPath();
  ctx.moveTo(px + rTL, py);
  ctx.lineTo(px + cellSize - rTR, py);
  if (rTR) ctx.arcTo(px + cellSize, py, px + cellSize, py + rTR, rTR);
  else ctx.lineTo(px + cellSize, py);
  ctx.lineTo(px + cellSize, py + cellSize - rBR);
  if (rBR) ctx.arcTo(px + cellSize, py + cellSize, px + cellSize - rBR, py + cellSize, rBR);
  else ctx.lineTo(px + cellSize, py + cellSize);
  ctx.lineTo(px + rBL, py + cellSize);
  if (rBL) ctx.arcTo(px, py + cellSize, px, py + cellSize - rBL, rBL);
  else ctx.lineTo(px, py + cellSize);
  ctx.lineTo(px, py + rTL);
  if (rTL) ctx.arcTo(px, py, px + rTL, py, rTL);
  else ctx.lineTo(px, py);
  ctx.closePath();
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/GameCanvas.tsx
git commit -m "Add corner-rounding utility functions"
```

---

### Task 4: Rewrite drawCourse with layered rendering

**Files:**
- Modify: `src/components/GameCanvas.tsx` (replace the `drawCourse` function)

- [ ] **Step 1: Replace the drawCourse function**

Replace the entire `drawCourse` function (lines 39-89 approximately) with:

```typescript
const LAYER_ORDER: Terrain[] = [Terrain.Fairway, Terrain.Sand, Terrain.Water];

function drawCourse(ctx: CanvasRenderingContext2D, course: Course, cellSize: number) {
  const { grid, width, height } = course;

  // Layer 1: Rough base - fill entire canvas
  ctx.fillStyle = TERRAIN_COLOURS[Terrain.Rough];
  ctx.fillRect(0, 0, width * cellSize, height * cellSize);

  // Dot grid on rough
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      ctx.fillStyle = DOT_COLOUR_LIGHT;
      ctx.beginPath();
      ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Layer 2: Fairway
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y]?.[x]?.terrain !== Terrain.Fairway) continue;
      const px = x * cellSize;
      const py = y * cellSize;
      roundedTilePath(ctx, px, py, x, y, grid, width, height, cellSize, CORNER_RADIUS);
      ctx.fillStyle = TERRAIN_COLOURS[Terrain.Fairway];
      ctx.fill();
      // Dot
      ctx.fillStyle = DOT_COLOUR_LIGHT;
      ctx.beginPath();
      ctx.arc(px + cellSize / 2, py + cellSize / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Layer 3: Sand with diagonal hatch
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y]?.[x]?.terrain !== Terrain.Sand) continue;
      const px = x * cellSize;
      const py = y * cellSize;
      roundedTilePath(ctx, px, py, x, y, grid, width, height, cellSize, CORNER_RADIUS);
      ctx.fillStyle = TERRAIN_COLOURS[Terrain.Sand];
      ctx.fill();
      // Diagonal hatch - use global coordinates for continuity
      ctx.save();
      roundedTilePath(ctx, px, py, x, y, grid, width, height, cellSize, CORNER_RADIUS);
      ctx.clip();
      ctx.strokeStyle = HATCH_COLOUR;
      ctx.lineWidth = 3;
      const hatchSpacing = 10;
      // Draw lines from global y-intercept so they align across tiles
      const startGlobal = Math.floor(px / hatchSpacing) * hatchSpacing;
      for (let gx = startGlobal - cellSize; gx < px + cellSize * 2; gx += hatchSpacing) {
        ctx.beginPath();
        ctx.moveTo(gx, py - (gx - px));
        ctx.lineTo(gx + cellSize, py - (gx - px) + cellSize);
        ctx.stroke();
      }
      ctx.restore();
      // Dot
      ctx.fillStyle = DOT_COLOUR_LIGHT;
      ctx.beginPath();
      ctx.arc(px + cellSize / 2, py + cellSize / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Layer 4: Water - solid fill, grid lines only on outer edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y]?.[x]?.terrain !== Terrain.Water) continue;
      const px = x * cellSize;
      const py = y * cellSize;
      roundedTilePath(ctx, px, py, x, y, grid, width, height, cellSize, CORNER_RADIUS);
      ctx.fillStyle = TERRAIN_COLOURS[Terrain.Water];
      ctx.fill();
    }
  }
  // Water border lines (separate pass to avoid overlap issues)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y]?.[x]?.terrain !== Terrain.Water) continue;
      const px = x * cellSize;
      const py = y * cellSize;
      ctx.save();
      roundedTilePath(ctx, px, py, x, y, grid, width, height, cellSize, CORNER_RADIUS);
      ctx.clip();
      ctx.strokeStyle = GRID_LINE_COLOUR;
      ctx.lineWidth = 1.5;
      if (!isSameTerrain(grid, x, y - 1, Terrain.Water, width, height)) {
        ctx.beginPath();
        ctx.moveTo(px, py + 0.5);
        ctx.lineTo(px + cellSize, py + 0.5);
        ctx.stroke();
      }
      if (!isSameTerrain(grid, x, y + 1, Terrain.Water, width, height)) {
        ctx.beginPath();
        ctx.moveTo(px, py + cellSize - 0.5);
        ctx.lineTo(px + cellSize, py + cellSize - 0.5);
        ctx.stroke();
      }
      if (!isSameTerrain(grid, x - 1, y, Terrain.Water, width, height)) {
        ctx.beginPath();
        ctx.moveTo(px + 0.5, py);
        ctx.lineTo(px + 0.5, py + cellSize);
        ctx.stroke();
      }
      if (!isSameTerrain(grid, x + 1, y, Terrain.Water, width, height)) {
        ctx.beginPath();
        ctx.moveTo(px + cellSize - 0.5, py);
        ctx.lineTo(px + cellSize - 0.5, py + cellSize);
        ctx.stroke();
      }
      ctx.restore();
      // Light dot on water
      ctx.fillStyle = DOT_COLOUR_DARK;
      ctx.beginPath();
      ctx.arc(px + cellSize / 2, py + cellSize / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Layer 5: Tree icons
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y]?.[x]?.terrain !== Terrain.Trees) continue;
      const cx = x * cellSize + cellSize / 2;
      const cy = y * cellSize + cellSize / 2;
      const size = 16;
      ctx.fillStyle = TREE_COLOUR;
      ctx.beginPath();
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx - size * 0.65, cy + size * 0.4);
      ctx.lineTo(cx + size * 0.65, cy + size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(cx - 2, cy + size * 0.4, 4, size * 0.4);
    }
  }

  // Slope arrows
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y]?.[x];
      if (!cell?.slope) continue;
      ctx.fillStyle = SLOPE_ARROW_COLOUR;
      ctx.font = `${cellSize * 0.4}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        DIRECTION_ARROWS[cell.slope] ?? "",
        x * cellSize + cellSize / 2,
        y * cellSize + cellSize / 2,
      );
    }
  }

  // Tee marker (filled black circle)
  ctx.fillStyle = TEE_COLOUR;
  ctx.beginPath();
  ctx.arc(
    course.tee.x * cellSize + cellSize / 2,
    course.tee.y * cellSize + cellSize / 2,
    12,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Hole marker (stroked ring)
  ctx.strokeStyle = HOLE_COLOUR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    course.hole.x * cellSize + cellSize / 2,
    course.hole.y * cellSize + cellSize / 2,
    10,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
}
```

- [ ] **Step 2: Remove the unused LAYER_ORDER constant if linter flags it**

The `LAYER_ORDER` array was defined but the rendering uses explicit layer passes. Remove it if the linter complains, or keep it for documentation. Either way, it should not cause a build error.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`

Open in browser. The course should now render with:
- Off-white background with dot grid
- Light grey fairway regions with rounded corners
- Hatched sand regions with rounded corners
- Dark water regions with border lines only on outer edges
- Small tree icons
- Black circle tee, ring hole

- [ ] **Step 5: Commit**

```bash
git add src/components/GameCanvas.tsx
git commit -m "Implement layered greyscale terrain rendering with rounded corners"
```

---

### Task 5: Update ball and shot path rendering for new style

**Files:**
- Modify: `src/components/GameCanvas.tsx` (the `drawBall` and `drawShotPath` functions)

- [ ] **Step 1: Update ball radius for 64px cells**

The ball `radius` is currently `cellSize * 0.3` which at 64px would be 19.2px - too large. Update `drawBall`:

```typescript
function drawBall(ctx: CanvasRenderingContext2D, pos: Position, cellSize: number) {
  const cx = pos.x * cellSize + cellSize / 2;
  const cy = pos.y * cellSize + cellSize / 2;
  const radius = 8;

  ctx.fillStyle = BALL_COLOUR;
  ctx.strokeStyle = BALL_OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
```

- [ ] **Step 2: Update shot path line width for larger canvas**

Update `drawShotPath` to use a slightly larger dash:

```typescript
function drawShotPath(
  ctx: CanvasRenderingContext2D,
  shotHistory: GameState["shotHistory"],
  cellSize: number,
) {
  if (shotHistory.length === 0) return;

  ctx.strokeStyle = PATH_COLOUR;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);

  for (const shot of shotHistory) {
    ctx.beginPath();
    ctx.moveTo(shot.from.x * cellSize + cellSize / 2, shot.from.y * cellSize + cellSize / 2);
    ctx.lineTo(shot.to.x * cellSize + cellSize / 2, shot.to.y * cellSize + cellSize / 2);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`

Play a shot - the ball should be appropriately sized and the shot path visible.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameCanvas.tsx
git commit -m "Scale ball and shot path rendering for 64px cells"
```

---

### Task 6: Run linter and fix any issues

**Files:**
- Modify: `src/components/GameCanvas.tsx` (if needed)

- [ ] **Step 1: Run Biome lint**

Run: `npx biome check src/components/GameCanvas.tsx`

- [ ] **Step 2: Fix any reported issues**

Common expected issues:
- Unused `LAYER_ORDER` constant - remove it
- Any formatting issues - run `npx biome check --write src/components/GameCanvas.tsx`

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: all tests pass (rendering changes don't affect engine tests)

- [ ] **Step 4: Commit if there were fixes**

```bash
git add src/components/GameCanvas.tsx
git commit -m "Fix lint issues in GameCanvas"
```

---

### Task 7: Final visual verification

**Files:** None (manual check)

- [ ] **Step 1: Run the dev server and play through a full hole**

Run: `npm run dev`

Verify:
- Course renders with greyscale palette
- Rounded corners appear only on outer convex corners of terrain regions
- No gaps between adjacent non-rough terrains of different types
- Water is continuous (no internal grid lines)
- Sand has diagonal hatch (may have alignment issues across tiles - known issue)
- Trees are triangular icons
- Tee is a filled black circle
- Hole is a stroked ring
- Ball renders at correct size
- Shot path is visible
- Slope arrows display correctly
- Rolling and moving works as before

- [ ] **Step 2: Test on mobile viewport**

Open browser dev tools, set viewport to 375px wide. The canvas should scale down via CSS `width: 100%` and remain fully visible.

- [ ] **Step 3: Build for production**

Run: `npm run build`
Expected: no errors
