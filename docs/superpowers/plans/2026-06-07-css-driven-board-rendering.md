# CSS-Driven Board Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the JS window-measurement-based `cellSize` prop and replace it with a fixed
module-level constant, letting CSS scale the canvas to fill the viewport width.

**Architecture:** `CELL_SIZE = 16` is declared as a constant in `GameCanvas.tsx`. The canvas
intrinsic size is always `320x480` px. CSS `width: 100%; height: auto` handles all scaling.
The `cellSize` prop is removed from `GameCanvas` and the corresponding `useMemo` is removed
from `App`.

**Tech Stack:** React 19, TypeScript, Vite, Vitest

---

### Task 1: Remove `cellSize` prop from `GameCanvas` and use a constant

**Files:**
- Modify: `src/components/GameCanvas.tsx`

- [ ] **Step 1: Add `CELL_SIZE` constant and remove the prop**

Replace the `Props` interface and the function signature so `cellSize` is gone, and add the
constant at module level. In `src/components/GameCanvas.tsx`, make these changes:

After the `PATH_COLOUR` constant (line 18), add:

```ts
const CELL_SIZE = 16;
```

Change the `Props` interface from:

```ts
interface Props {
  state: GameState;
  /** Animated ball position (may differ from state.ball during animation). */
  animatedBall: Position | null;
  cellSize: number;
}
```

to:

```ts
interface Props {
  state: GameState;
  /** Animated ball position (may differ from state.ball during animation). */
  animatedBall: Position | null;
}
```

Change the function signature from:

```ts
export function GameCanvas({ state, animatedBall, cellSize }: Props) {
```

to:

```ts
export function GameCanvas({ state, animatedBall }: Props) {
```

- [ ] **Step 2: Replace all `cellSize` usages in `GameCanvas` with `CELL_SIZE`**

In `src/components/GameCanvas.tsx`, replace every occurrence of `cellSize` with `CELL_SIZE`.
This affects:

- `renderCourseToCache` callback: `new OffscreenCanvas(course.width * cellSize, ...)` and the `drawCourse` call and the `[cellSize]` dependency array
- `draw` callback: `drawCourse`, `drawShotPath`, `drawBall` calls and `[..., cellSize, ...]` dependency array
- The `<canvas>` element: `width`, `height` attributes and `maxWidth` style

The `<canvas>` element should become:

```tsx
<canvas
  ref={canvasRef}
  width={state.course.width * CELL_SIZE}
  height={state.course.height * CELL_SIZE}
  style={{
    width: "100%",
    height: "auto",
    imageRendering: "pixelated",
  }}
/>
```

Note: `maxWidth` is removed entirely (no cap - CSS scales freely).

The `renderCourseToCache` callback dependency array changes from `[cellSize]` to `[]` (the
constant never changes).

The `draw` callback dependency array changes from `[state, animatedBall, cellSize, renderCourseToCache]`
to `[state, animatedBall, renderCourseToCache]`.

- [ ] **Step 3: Verify TypeScript compiles**

```sh
npx tsc --noEmit
```

Expected: no errors related to `cellSize` in `GameCanvas.tsx`.

---

### Task 2: Remove `cellSize` from `App`

**Files:**
- Modify: `src/components/App.tsx`

- [ ] **Step 1: Remove the `cellSize` useMemo**

In `src/components/App.tsx`, delete lines 100-104:

```ts
// Calculate cell size based on viewport width
const cellSize = useMemo(() => {
  if (typeof window === "undefined") return 16;
  return Math.floor(window.innerWidth / GRID_WIDTH);
}, []);
```

- [ ] **Step 2: Remove `cellSize` prop from `<GameCanvas>`**

In `src/components/App.tsx`, change:

```tsx
<GameCanvas state={state} animatedBall={animatedBall} cellSize={cellSize} />
```

to:

```tsx
<GameCanvas state={state} animatedBall={animatedBall} />
```

- [ ] **Step 3: Remove unused `useMemo` import if no longer needed**

Check whether `useMemo` is still used elsewhere in `App.tsx` (it is - on line 39: `const state = useMemo(...)`). Leave the import unchanged.

- [ ] **Step 4: Verify TypeScript compiles with no errors**

```sh
npx tsc --noEmit
```

Expected: clean output, no errors.

---

### Task 3: Run tests and commit

**Files:**
- No file changes - verification only, then commit

- [ ] **Step 1: Run the test suite**

```sh
npx vitest run
```

Expected: all tests pass. (No tests cover `cellSize` directly - the engine and validation
tests are unaffected by this change.)

- [ ] **Step 2: Run the dev server and verify visually**

```sh
npm run dev
```

Open the local URL. Resize the browser window. The board should fill the full width at any
viewport size, scaling up and down smoothly. No JS errors in the console.

- [ ] **Step 3: Commit**

```sh
git add src/components/GameCanvas.tsx src/components/App.tsx
git commit -m "Decouple board rendering from window size - use fixed CELL_SIZE constant"
```
