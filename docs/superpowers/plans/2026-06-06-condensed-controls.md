# Condensed controls layout - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Condense the controls area from ~302px to ~172px so the full game fits on an iPhone 17 screen without scrolling.

**Architecture:** Four sequential changes - shrink DirectionPicker buttons, collapse HUD to one row, replace DiceButton with a new ActionColumn component that sits beside the picker in a flex row, then delete the old DiceButton file.

**Tech Stack:** React 18, TypeScript, Vite, inline CSSProperties (no CSS files or modules)

---

### Task 1: Shrink DirectionPicker buttons

**Files:**
- Modify: `src/components/DirectionPicker.tsx`

The arrow buttons and centre cell are currently 56x56px with 4px gaps. Change them to 44x44px with 3px gaps. This reduces the grid height from 176px to 138px.

- [ ] **Step 1: Edit button and gap sizes in DirectionPicker.tsx**

In `src/components/DirectionPicker.tsx`, replace the `styles` object at the bottom of the file:

```tsx
const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    alignItems: "center",
  },
  row: {
    display: "flex",
    gap: "3px",
  },
  arrowButton: {
    width: "44px",
    height: "44px",
    fontSize: "20px",
    border: "2px solid #444",
    borderRadius: "8px",
    background: "#2a2a3e",
    color: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transition: "opacity 0.15s",
  },
  centerCell: {
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #333",
    borderRadius: "8px",
    background: "#1a1a2e",
    color: "#ffd700",
    fontSize: "18px",
    fontWeight: "bold",
  },
  rollValue: {
    fontSize: "18px",
  },
  dot: {
    color: "#555",
    fontSize: "14px",
  },
};
```

- [ ] **Step 2: Type-check**

```sh
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```sh
git add src/components/DirectionPicker.tsx
git commit -m "Shrink direction picker buttons from 56px to 44px"
```

---

### Task 2: Collapse HUD to a single row

**Files:**
- Modify: `src/components/HUD.tsx`

Merge the two-row HUD into one line: score diff on the left, stroke/par in the centre, mulligan dots + terrain + roll value on the right. Reduce vertical padding.

- [ ] **Step 1: Replace HUD.tsx contents**

Replace the entire file `src/components/HUD.tsx` with:

```tsx
import { getBallTerrain } from "../engine/reducer";
import type { GameState } from "../engine/types";
import { Terrain } from "../engine/types";

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
    <div style={styles.container}>
      <div style={styles.row}>
        <span style={styles.score}>
          {state.stroke > 0 ? scoreLabel(state.stroke, state.par) : "–"}
        </span>
        <span style={styles.mid}>
          Str {state.stroke} / Par {state.par}
        </span>
        <span style={styles.right}>
          {"●".repeat(state.mulligansRemaining)}
          {"○".repeat(6 - state.mulligansRemaining)}
          {terrainText && (
            <span style={styles.terrain}> {terrainText}</span>
          )}
          {state.rawRoll !== null && (
            <span style={styles.roll}>
              {" "}
              🎲{state.rawRoll}
              {state.currentRoll !== state.rawRoll && `\u2192${state.currentRoll}`}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "6px 12px",
    background: "#1a1a2e",
    color: "#e0e0e0",
    fontFamily: "system-ui, sans-serif",
    fontSize: "13px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  score: {
    fontWeight: "bold",
    color: "#ffd700",
    minWidth: "28px",
  },
  mid: {
    flex: 1,
    textAlign: "center" as const,
  },
  right: {
    fontSize: "12px",
    color: "#a0a0c0",
    textAlign: "right" as const,
  },
  terrain: {
    color: "#a8e06c",
  },
  roll: {
    color: "#e0e0e0",
  },
};
```

- [ ] **Step 2: Type-check**

```sh
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```sh
git add src/components/HUD.tsx
git commit -m "Collapse HUD to single row"
```

---

### Task 3: Create ActionColumn component

**Files:**
- Create: `src/components/ActionColumn.tsx`

This component replaces DiceButton. It sits to the right of the DirectionPicker in a flex row, matching the picker's height via `align-items: stretch` on the parent. It shows:

- A tall Roll button when phase is `AwaitingRoll`
- A tall Mulligan / Re-roll button when phase is `AwaitingDirection` and a reroll is available
- An invisible same-width placeholder otherwise (so the picker does not jump when the button disappears)

There is no Putt button. Tapping an arrow before rolling already dispatches `PuttChosen` via the existing `handleDirection` logic in App.tsx.

- [ ] **Step 1: Create src/components/ActionColumn.tsx**

```tsx
import { type GameState, Phase } from "../engine/types";

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
    phase === Phase.AwaitingDirection &&
    (teeOffRerollAvailable || mulligansRemaining > 0);

  // When neither action is available, render an invisible placeholder so the
  // DirectionPicker does not shift position.
  const isPlaceholder = !canRoll && !canReroll;

  let rerollLabel = "";
  if (teeOffRerollAvailable) {
    rerollLabel = "Re-roll\n(free)";
  } else if (mulligansRemaining > 0) {
    rerollLabel = `Mulligan\n(${mulligansRemaining} left)`;
  }

  return (
    <div
      style={{
        ...styles.column,
        opacity: isPlaceholder ? 0 : 1,
        pointerEvents: isPlaceholder ? "none" : "auto",
      }}
    >
      {canRoll && (
        <button
          type="button"
          style={{ ...styles.button, ...styles.rollButton }}
          onClick={onRoll}
          disabled={disabled}
        >
          🎲{"\n"}Roll
        </button>
      )}
      {canReroll && (
        <button
          type="button"
          style={{ ...styles.button, ...styles.mulliganButton }}
          onClick={onMulligan}
          disabled={disabled}
        >
          {rerollLabel}
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  column: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  button: {
    flex: 1,
    fontSize: "14px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    whiteSpace: "pre-line",
    lineHeight: "1.3",
  },
  rollButton: {
    background: "#4a90d9",
    color: "#fff",
  },
  mulliganButton: {
    background: "#d4a843",
    color: "#1a1a2e",
  },
};
```

- [ ] **Step 2: Type-check**

```sh
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```sh
git add src/components/ActionColumn.tsx
git commit -m "Add ActionColumn component"
```

---

### Task 4: Wire ActionColumn into App and delete DiceButton

**Files:**
- Modify: `src/components/App.tsx`
- Delete: `src/components/DiceButton.tsx`

Replace the vertical `DirectionPicker` + `DiceButton` stack with a horizontal `DirectionPicker` + `ActionColumn` row. Remove `handlePutt` (it was a stub) and the `DiceButton` import.

- [ ] **Step 1: Update App.tsx**

Replace the entire file `src/components/App.tsx` with:

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { reduce } from "../engine/reducer";
import { type Direction, type GameEvent, GRID_HEIGHT, GRID_WIDTH, Phase } from "../engine/types";
import { useAnimation } from "../hooks/useAnimation";
import { useGameStorage } from "../hooks/useGameStorage";
import { ActionColumn } from "./ActionColumn";
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

  // Calculate cell size based on viewport width
  const cellSize = useMemo(() => {
    if (typeof window === "undefined") return 16;
    const maxWidth = Math.min(window.innerWidth, 480);
    return Math.floor(maxWidth / GRID_WIDTH);
  }, []);

  if (!initialised) return null;

  return (
    <div style={styles.container}>
      <div style={styles.canvasContainer}>
        <GameCanvas state={state} animatedBall={animatedBall} cellSize={cellSize} />
      </div>

      <HUD state={state} />

      {state.phase === Phase.HoledOut ? (
        <div style={styles.gameOver}>
          <div style={styles.gameOverText}>
            Holed out in <strong>{state.stroke}</strong> strokes!
            {state.stroke <= state.par && " 🏆"}
          </div>
          <button type="button" style={styles.newGameButton} onClick={handleNewGame}>
            New Game
          </button>
        </div>
      ) : (
        <div style={styles.controlsRow}>
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
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    background: "#0f0f23",
    maxWidth: "480px",
    margin: "0 auto",
  },
  canvasContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    overflow: "hidden",
  },
  controlsRow: {
    display: "flex",
    alignItems: "stretch",
    gap: "8px",
    padding: "6px 8px 12px",
  },
  gameOver: {
    padding: "24px",
    textAlign: "center" as const,
  },
  gameOverText: {
    color: "#ffd700",
    fontSize: "20px",
    marginBottom: "16px",
    fontFamily: "system-ui, sans-serif",
  },
  newGameButton: {
    padding: "14px 32px",
    fontSize: "16px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "10px",
    background: "#4a90d9",
    color: "#fff",
    cursor: "pointer",
    touchAction: "manipulation",
  },
};
```

- [ ] **Step 2: Delete DiceButton.tsx**

```sh
rm src/components/DiceButton.tsx
```

- [ ] **Step 3: Type-check**

```sh
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Start the dev server and verify visually**

```sh
npm run dev
```

Open the URL in a browser. Check:
- Controls area shows DirectionPicker on the left and Roll button on the right, side by side
- HUD is a single compact row
- Tapping Roll changes the centre cell to show the rolled value and activates arrows
- Tapping an arrow from the start (without rolling) moves the ball one step (putt)
- Mulligan button appears in the right column after rolling (if mulligans remain)
- Right column becomes invisible (no layout shift) when no action is available

- [ ] **Step 5: Commit**

```sh
git add src/components/App.tsx
git rm src/components/DiceButton.tsx
git commit -m "Replace DiceButton with ActionColumn in side-by-side layout"
```
