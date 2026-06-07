# CSS Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract all inline React style objects into plain CSS files and replace JS-driven responsive layout with CSS media queries.

**Architecture:** One CSS file per component, imported via standard Vite CSS imports. Mobile-first layout with a single `@media (min-width: 600px)` breakpoint. App.tsx collapses from two JSX branches into one unified markup structure that CSS rearranges.

**Tech Stack:** Plain CSS, React 19, Vite 6

---

### Task 1: Global reset CSS and index.html cleanup

**Files:**
- Create: `src/index.css`
- Modify: `index.html`
- Modify: `src/index.tsx`

- [ ] **Step 1: Create `src/index.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  padding: 0;
  height: 100%;
}
```

- [ ] **Step 2: Import `index.css` from `src/index.tsx`**

Change `src/index.tsx` to:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 3: Remove inline `<style>` block from `index.html`**

Change `index.html` to:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>Dice Golf</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```sh
git add src/index.css src/index.tsx index.html
git commit -m "Move global reset from index.html to index.css"
```

---

### Task 2: GameCanvas CSS extraction

**Files:**
- Create: `src/components/GameCanvas.css`
- Modify: `src/components/GameCanvas.tsx`

- [ ] **Step 1: Create `src/components/GameCanvas.css`**

```css
.game-canvas {
  width: 100%;
  max-width: 100%;
  height: auto;
  image-rendering: pixelated;
  display: block;
}
```

- [ ] **Step 2: Update `GameCanvas.tsx`**

Add the CSS import at the top of the file, after the existing imports:

```tsx
import "./GameCanvas.css";
```

Replace the inline `style` on the `<canvas>` element. Change:

```tsx
    <canvas
      ref={canvasRef}
      width={state.course.width * CELL_SIZE}
      height={state.course.height * CELL_SIZE}
      style={{
        width: "100%",
        maxWidth: "100%",
        height: "auto",
        imageRendering: "pixelated",
        display: "block",
      }}
    />
```

To:

```tsx
    <canvas
      ref={canvasRef}
      width={state.course.width * CELL_SIZE}
      height={state.course.height * CELL_SIZE}
      className="game-canvas"
    />
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```sh
git add src/components/GameCanvas.css src/components/GameCanvas.tsx
git commit -m "Extract GameCanvas styles to CSS"
```

---

### Task 3: HUD CSS extraction

**Files:**
- Create: `src/components/HUD.css`
- Modify: `src/components/HUD.tsx`

- [ ] **Step 1: Create `src/components/HUD.css`**

```css
.hud {
  padding: 6px 12px;
  background: #1a1a2e;
  color: #e0e0e0;
  font-family: system-ui, sans-serif;
  font-size: 13px;
}

.hud-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.hud-score {
  font-weight: bold;
  color: #ffd700;
  min-width: 28px;
}

.hud-mid {
  flex: 1;
  text-align: center;
}

.hud-right {
  font-size: 12px;
  color: #a0a0c0;
  text-align: right;
}

.hud-terrain {
  color: #a8e06c;
}

.hud-roll {
  color: #e0e0e0;
}
```

- [ ] **Step 2: Update `HUD.tsx`**

Replace the entire file with:

```tsx
import { getBallTerrain } from "../engine/reducer";
import type { GameState } from "../engine/types";
import { Terrain } from "../engine/types";
import "./HUD.css";

interface Props {
  state: GameState;
}

function terrainLabel(terrain: Terrain | null): string {
  switch (terrain) {
    case Terrain.Fairway:
      return "Fairway (+1)";
    case Terrain.Sand:
      return "Sand (-1)";
    case Terrain.Rough:
      return "Rough";
    default:
      return "";
  }
}

function scoreLabel(strokes: number, par: number): string {
  const diff = strokes - par;
  if (diff === 0) return "Par";
  if (diff < 0) return `${diff}`;
  return `+${diff}`;
}

export function HUD({ state }: Props) {
  const terrain = getBallTerrain(state);
  const terrainText = terrain ? terrainLabel(terrain) : null;

  return (
    <div className="hud">
      <div className="hud-row">
        <span className="hud-score">
          {state.stroke > 0 ? scoreLabel(state.stroke, state.par) : "\u2013"}
        </span>
        <span className="hud-mid">
          Str {state.stroke} / Par {state.par}
        </span>
        <span className="hud-right">
          {"\u25cf".repeat(state.mulligansRemaining)}
          {"\u25cb".repeat(6 - state.mulligansRemaining)}
          {terrainText && <span className="hud-terrain"> {terrainText}</span>}
          {state.rawRoll !== null && (
            <span className="hud-roll">
              {" "}
              \ud83c\udfb2{state.rawRoll}
              {state.currentRoll !== state.rawRoll && `\u2192${state.currentRoll}`}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```sh
git add src/components/HUD.css src/components/HUD.tsx
git commit -m "Extract HUD styles to CSS"
```

---

### Task 4: DirectionPicker CSS extraction

**Files:**
- Create: `src/components/DirectionPicker.css`
- Modify: `src/components/DirectionPicker.tsx`

- [ ] **Step 1: Create `src/components/DirectionPicker.css`**

```css
.direction-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
}

.direction-row {
  display: flex;
  gap: 3px;
}

.arrow-button {
  width: 44px;
  height: 44px;
  font-size: 20px;
  border: 2px solid #444;
  border-radius: 8px;
  background: #2a2a3e;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
  cursor: pointer;
}

.arrow-button:disabled {
  opacity: 0.25;
  cursor: default;
}

.direction-centre {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #333;
  border-radius: 8px;
  background: #1a1a2e;
  color: #ffd700;
  font-size: 18px;
  font-weight: bold;
}

.direction-dot {
  color: #555;
  font-size: 14px;
}
```

- [ ] **Step 2: Update `DirectionPicker.tsx`**

Replace the entire file with:

```tsx
import { useMemo } from "react";
import { DIRECTIONS, type Direction, type GameState } from "../engine/types";
import { validateMove } from "../engine/validation";
import "./DirectionPicker.css";

interface Props {
  state: GameState;
  onDirection: (dir: Direction) => void;
  disabled: boolean;
}

const GRID_LAYOUT: (Direction | null)[][] = [
  ["NW", "N", "NE"],
  ["W", null, "E"],
  ["SW", "S", "SE"],
];

const ARROW_SYMBOLS: Record<Direction, string> = {
  N: "\u2191",
  NE: "\u2197",
  E: "\u2192",
  SE: "\u2198",
  S: "\u2193",
  SW: "\u2199",
  W: "\u2190",
  NW: "\u2196",
};

const ROW_KEYS = ["top", "mid", "bot"] as const;

export function DirectionPicker({ state, onDirection, disabled }: Props) {
  const validDirections = useMemo(() => {
    if (!state.course) return new Set<Direction>();

    const distance = state.currentRoll ?? 1;
    const valid = new Set<Direction>();

    for (const dir of DIRECTIONS) {
      const result = validateMove(state.course, state.ball, dir, distance);
      if (result.valid) valid.add(dir);
    }

    return valid;
  }, [state.course, state.ball, state.currentRoll]);

  return (
    <div className="direction-grid">
      {GRID_LAYOUT.map((row, rowIdx) => (
        <div key={ROW_KEYS[rowIdx]} className="direction-row">
          {row.map((dir) => {
            if (dir === null) {
              return (
                <div key="centre" className="direction-centre">
                  {state.currentRoll !== null ? (
                    <span>{state.currentRoll}</span>
                  ) : (
                    <span className="direction-dot">{"\u25cf"}</span>
                  )}
                </div>
              );
            }

            const isValid = validDirections.has(dir);
            const isDisabled = disabled || !isValid;

            return (
              <button
                type="button"
                key={dir}
                className="arrow-button"
                disabled={isDisabled}
                onClick={() => onDirection(dir)}
                aria-label={`Hit ${dir}`}
              >
                {ARROW_SYMBOLS[dir]}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```sh
git add src/components/DirectionPicker.css src/components/DirectionPicker.tsx
git commit -m "Extract DirectionPicker styles to CSS"
```

---

### Task 5: ActionColumn CSS extraction

**Files:**
- Create: `src/components/ActionColumn.css`
- Modify: `src/components/ActionColumn.tsx`

- [ ] **Step 1: Create `src/components/ActionColumn.css`**

```css
.action-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.action-column--hidden {
  opacity: 0;
  pointer-events: none;
}

.action-button {
  flex: 1;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  white-space: pre-line;
  line-height: 1.3;
}

.action-button--roll {
  background: #4a90d9;
  color: #fff;
}

.action-button--mulligan {
  background: #d4a843;
  color: #1a1a2e;
}
```

- [ ] **Step 2: Update `ActionColumn.tsx`**

Replace the entire file with:

```tsx
import { type GameState, Phase } from "../engine/types";
import "./ActionColumn.css";

interface Props {
  state: GameState;
  onRoll: () => void;
  onMulligan: () => void;
  disabled: boolean;
}

export function ActionColumn({ state, onRoll, onMulligan, disabled }: Props) {
  const { phase, teeOffRerollAvailable, mulligansRemaining } = state;

  if (phase === Phase.HoledOut || phase === Phase.NotStarted) {
    return null;
  }

  const canRoll = phase === Phase.AwaitingRoll;
  const canReroll =
    phase === Phase.AwaitingDirection && (teeOffRerollAvailable || mulligansRemaining > 0);

  const isPlaceholder = !canRoll && !canReroll;

  let rerollLabel = "";
  if (teeOffRerollAvailable) {
    rerollLabel = "Re-roll\n(free)";
  } else if (mulligansRemaining > 0) {
    rerollLabel = `Mulligan\n(${mulligansRemaining} left)`;
  }

  return (
    <div className={`action-column${isPlaceholder ? " action-column--hidden" : ""}`}>
      {canRoll && (
        <button
          type="button"
          className="action-button action-button--roll"
          onClick={onRoll}
          disabled={disabled}
        >
          {"\ud83c\udfb2"}{"\n"}Roll
        </button>
      )}
      {canReroll && (
        <button
          type="button"
          className="action-button action-button--mulligan"
          onClick={onMulligan}
          disabled={disabled}
        >
          {rerollLabel}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```sh
git add src/components/ActionColumn.css src/components/ActionColumn.tsx
git commit -m "Extract ActionColumn styles to CSS"
```

---

### Task 6: App CSS extraction and responsive layout refactor

This is the largest task. It replaces the dual JSX branches and `useIsWide` hook with
a single markup structure driven by CSS media queries.

**Files:**
- Create: `src/components/App.css`
- Modify: `src/components/App.tsx`
- Delete: `src/hooks/useIsWide.ts`
- Delete: `src/hooks/useIsWide.test.ts`

- [ ] **Step 1: Create `src/components/App.css`**

```css
/* ---- Mobile-first base layout (column) ---- */

.app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: #0f0f23;
}

.canvas-pane {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 0;
}

.controls-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 6px 8px 12px;
}

/* ---- Desktop layout (row) ---- */

@media (min-width: 600px) {
  .app {
    flex-direction: row;
  }

  .canvas-pane {
    flex: 0 1 400px;
    min-height: auto;
    min-width: 0;
  }

  .controls-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    overflow: hidden;
  }

  .controls-row {
    flex-direction: row;
    align-items: center;
    padding: 0;
  }
}

/* ---- Game over panel ---- */

.game-over {
  padding: 24px;
  text-align: center;
}

.game-over-text {
  color: #ffd700;
  font-size: 20px;
  margin-bottom: 16px;
  font-family: system-ui, sans-serif;
}

.new-game-button {
  padding: 14px 32px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  background: #4a90d9;
  color: #fff;
  cursor: pointer;
  touch-action: manipulation;
}
```

- [ ] **Step 2: Update `App.tsx`**

Replace the entire file with:

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { reduce } from "../engine/reducer";
import { type Direction, type GameEvent, GRID_HEIGHT, GRID_WIDTH, Phase } from "../engine/types";
import { useAnimation } from "../hooks/useAnimation";
import { useGameStorage } from "../hooks/useGameStorage";
import { ActionColumn } from "./ActionColumn";
import "./App.css";
import { DirectionPicker } from "./DirectionPicker";
import { GameCanvas } from "./GameCanvas";
import { HUD } from "./HUD";

function generateSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function App() {
  const { loadedEvents, saveEvents, recordCompletion } = useGameStorage();
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [initialised, setInitialised] = useState(false);

  // Load saved game or start new
  useEffect(() => {
    if (initialised) return;
    if (loadedEvents && loadedEvents.length > 0) {
      setEvents(loadedEvents);
    } else {
      setEvents([
        {
          type: "GameStarted",
          seed: generateSeed(),
          gridWidth: GRID_WIDTH,
          gridHeight: GRID_HEIGHT,
        },
      ]);
    }
    setInitialised(true);
  }, [loadedEvents, initialised]);

  // Derive state from events
  const state = useMemo(() => reduce(events), [events]);

  // Animation
  const { animatedBall, isAnimating } = useAnimation(state.ball);

  // Auto-save on every event change
  useEffect(() => {
    if (events.length > 0) {
      saveEvents(events);
    }
  }, [events, saveEvents]);

  // Record completion
  useEffect(() => {
    if (state.isComplete && state.course) {
      recordCompletion(state.course.seed, state.stroke, state.par);
    }
  }, [state.isComplete, state.course, state.stroke, state.par, recordCompletion]);

  const dispatch = useCallback((event: GameEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const handleRoll = useCallback(() => {
    const value = Math.floor(Math.random() * 6) + 1;
    dispatch({ type: "DiceRolled", value });
  }, [dispatch]);

  const handleMulligan = useCallback(() => {
    dispatch({ type: "MulliganUsed" });
    // Immediately roll after mulligan
    setTimeout(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      dispatch({ type: "DiceRolled", value });
    }, 50);
  }, [dispatch]);

  const handleDirection = useCallback(
    (direction: Direction) => {
      if (state.phase === Phase.AwaitingDirection) {
        dispatch({ type: "DirectionChosen", direction });
      } else {
        // Tap an arrow before rolling = putt
        dispatch({ type: "PuttChosen", direction });
      }
    },
    [dispatch, state.phase],
  );

  const handleNewGame = useCallback(() => {
    const newEvents: GameEvent[] = [
      {
        type: "GameStarted",
        seed: generateSeed(),
        gridWidth: GRID_WIDTH,
        gridHeight: GRID_HEIGHT,
      },
    ];
    setEvents(newEvents);
  }, []);

  if (!initialised) return null;

  return (
    <div className="app">
      <div className="canvas-pane">
        <GameCanvas state={state} animatedBall={animatedBall} />
      </div>
      <div className="controls-pane">
        <HUD state={state} />
        {state.phase === Phase.HoledOut ? (
          <div className="game-over">
            <div className="game-over-text">
              Holed out in <strong>{state.stroke}</strong> strokes!
              {state.stroke <= state.par && " \ud83c\udfc6"}
            </div>
            <button type="button" className="new-game-button" onClick={handleNewGame}>
              New Game
            </button>
          </div>
        ) : (
          <div className="controls-row">
            <DirectionPicker state={state} onDirection={handleDirection} disabled={isAnimating} />
            <ActionColumn
              state={state}
              onRoll={handleRoll}
              onMulligan={handleMulligan}
              disabled={isAnimating}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Delete `useIsWide` hook and test**

```sh
rm src/hooks/useIsWide.ts src/hooks/useIsWide.test.ts
```

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: No errors (no remaining references to `useIsWide`)

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: All tests pass. The engine tests (`prng`, `reducer`, `validation`, `course`) are unaffected. The `useIsWide` test file has been deleted so it will not run.

- [ ] **Step 6: Run build**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 7: Commit**

```sh
git add -A
git commit -m "Replace JS layout with CSS media queries, delete useIsWide"
```
