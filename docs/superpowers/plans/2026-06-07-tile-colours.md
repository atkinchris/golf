# Tile Colours Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the greyscale terrain colour constants in `GameCanvas.tsx` with the coloured palette from the reference images.

**Architecture:** All colour values are defined as named constants at the top of `GameCanvas.tsx` (lines 6-24). No logic changes are needed - only the constant values change. The two generic dot colour constants (`DOT_COLOUR_LIGHT`, `DOT_COLOUR_DARK`) are replaced with per-terrain dot colour constants.

**Tech Stack:** TypeScript, Canvas 2D API, Vitest (no new tests needed - pure constant swap)

---

### Task 1: Replace colour constants and their usages

**Files:**
- Modify: `src/components/GameCanvas.tsx:6-24` (constants block) and dot colour usages at lines 119, 136, 169, 224

- [ ] **Step 1: Replace the constants block**

Open `src/components/GameCanvas.tsx`. Replace lines 6-24 (from `const TERRAIN_COLOURS` through `const PATH_COLOUR`) with:

```typescript
const TERRAIN_COLOURS: Record<Terrain, string> = {
  [Terrain.Rough]: "#f0f0eb",
  [Terrain.Fairway]: "#87ab78",
  [Terrain.Sand]: "#b5993c",
  [Terrain.Water]: "#5b8fcc",
  [Terrain.Trees]: "#f0f0eb",
};
const DOT_COLOUR_ROUGH = "#b8b8b2";
const DOT_COLOUR_FAIRWAY = "#5e8050";
const DOT_COLOUR_SAND = "#8a7028";
const DOT_COLOUR_WATER = "#3a6aaa";
const GRID_LINE_COLOUR = "#3a6aaa";
const HATCH_COLOUR = "#8a7028";
const TREE_COLOUR = "#3a5e2a";
const SLOPE_ARROW_COLOUR = "#3a3a3a";
const BALL_COLOUR = "#ffffff";
const BALL_OUTLINE = "#1a1a1a";
const TEE_COLOUR = "#1a1a1a";
const HOLE_COLOUR = "#1a1a1a";
const PATH_COLOUR = "#1a1a1a66";
```

- [ ] **Step 2: Update rough dot colour usage**

Find the rough dot grid loop (around line 119 after the edit). Change:

```typescript
ctx.fillStyle = DOT_COLOUR_LIGHT;
```

to:

```typescript
ctx.fillStyle = DOT_COLOUR_ROUGH;
```

This is the dot grid drawn over the entire rough base layer.

- [ ] **Step 3: Update fairway dot colour usage**

Find the fairway dot (around line 136 after the edit, inside the fairway loop). Change:

```typescript
ctx.fillStyle = DOT_COLOUR_LIGHT;
```

to:

```typescript
ctx.fillStyle = DOT_COLOUR_FAIRWAY;
```

- [ ] **Step 4: Update sand dot colour usage**

Find the sand dot (around line 169 after the edit, inside the sand loop, after the hatch block). Change:

```typescript
ctx.fillStyle = DOT_COLOUR_LIGHT;
```

to:

```typescript
ctx.fillStyle = DOT_COLOUR_SAND;
```

- [ ] **Step 5: Update water dot colour usage**

Find the water dot (around line 224 after the edit, inside the water loop). Change:

```typescript
ctx.fillStyle = DOT_COLOUR_DARK;
```

to:

```typescript
ctx.fillStyle = DOT_COLOUR_WATER;
```

- [ ] **Step 6: Verify no remaining references to the old constants**

Run:

```sh
grep -n "DOT_COLOUR_LIGHT\|DOT_COLOUR_DARK" src/components/GameCanvas.tsx
```

Expected: no output (zero matches).

- [ ] **Step 7: Run the build and tests**

```sh
npm run build && npm test
```

Expected: build succeeds with no TypeScript errors, all tests pass.

- [ ] **Step 8: Run the linter**

```sh
npm run lint
```

Expected: no errors or warnings.

- [ ] **Step 9: Commit**

```sh
git add src/components/GameCanvas.tsx
git commit -m "Apply colour palette to terrain tiles"
```
