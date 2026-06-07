# CSS-Driven Board Rendering - Design

## Goal

Decouple board rendering from JavaScript layout logic. The canvas intrinsic size is fixed
at a constant cell size; CSS alone is responsible for scaling it to fill the viewport width.

## Problem

`App.tsx` computes `cellSize` from `window.innerWidth / GRID_WIDTH` once at mount. This
value is passed as a prop through `App` -> `GameCanvas` and used in every canvas draw call
as well as the canvas element's intrinsic dimensions. The result:

- Cell size varies by device
- Rendering depends on a JS measurement of the window
- No resize handling (stale after orientation change)
- `cellSize` flows through multiple components as a prop coupling layout to rendering

## Chosen Approach

**Fixed intrinsic resolution, CSS scaling.**

- `CELL_SIZE = 16` (px) is a module-level constant in `GameCanvas.tsx`
- Canvas intrinsic dimensions are always `GRID_WIDTH * 16` x `GRID_HEIGHT * 16` (320x480)
- CSS `width: 100%; height: auto` scales the canvas to fill its container width
- `imageRendering: pixelated` keeps the grid crisp at any scale
- No `maxWidth` cap (unconstrained scaling for now; desktop layout addressed separately)
- `cellSize` prop is removed entirely from `GameCanvas` and `App`

## Constraints

- Grid dimensions (`GRID_WIDTH = 20`, `GRID_HEIGHT = 30`) come from `engine/types.ts`
- The canvas container already uses `flex: 1` with centred alignment - no change needed
- `OffscreenCanvas` caching is unaffected; it will use `CELL_SIZE` instead of the prop

## Files Changed

| File | Change |
| --- | --- |
| `src/components/GameCanvas.tsx` | Add `CELL_SIZE = 16` constant; remove `cellSize` prop; replace all `cellSize` usages |
| `src/components/App.tsx` | Remove `cellSize` useMemo; remove `cellSize` prop from `<GameCanvas>` |

## Files Unchanged

All other components (`HUD`, `DirectionPicker`, `ActionColumn`), all engine files, all hooks,
all tests.
