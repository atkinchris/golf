# Condensed Controls Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three-section vertical controls stack with a compact two-section layout (single-row HUD + side-by-side DirectionPicker/ActionColumn) that fits an iPhone 17 screen without scrolling.

**Architecture:** Four targeted component edits and one new component. No engine changes. The DirectionPicker already handles putts correctly (tapping an arrow in AwaitingRoll dispatches PuttChosen via App.tsx's handleDirection). The new ActionColumn replaces DiceButton with a tall single-button column that sits beside the picker.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Biome

---

### Task 1: Shrink DirectionPicker buttons from 56px to 44px

**Files:**
- Modify: `src/components/DirectionPicker.tsx:91-137`

- [ ] **Step 1: Apply the size changes**

Replace the `styles` object at the bottom of `src/components/DirectionPicker.tsx`:

```typescript
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
    fontSize: "18px",
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
    fontSize: "16px",
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

- [ ] **Step 2: Run build to verify no type errors**

```sh
npm run build
```

Expected: exits 0 with no TypeScript errors.

- [ ] **Step 3: Commit**

```sh
git add src/components/DirectionPicker.tsx
git commit -m "Shrink direction picker buttons from 56px to 44px"
```

---

### Task 2: Collapse HUD from two rows to one

**Files:**
- Modify: `src/components/HUD.tsx`

- [ ] **Step 1: Rewrite HUD to a single row**

Replace the entire contents of `src/components/HUD.tsx` with:

```typescript
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

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <span style={styles.leftGroup}>
          Str <strong>{state.stroke}</strong> / Par <strong>{state.par}</strong>
          {state.stroke > 0 && (
            <span style={styles.score}> {scoreLabel(state.stroke, state.par)}</span>
          )}
        </span>
        <span style={styles.rightGroup}>
          <span>
            {"●".repeat(state.mulligansRemaining)}
            {"○".repeat(6 - state.mulligansRemaining)}
          </span>
          {terrain && <span style={styles.terrain}>{terrainLabel(terrain)}</span>}
          {state.rawRoll !== null && (
            <span style={styles.roll}>
              🎲<strong>{state.rawRoll}</strong>
              {state.currentRoll !== state.rawRoll && (
                <> &rarr; <strong>{state.currentRoll}</strong></>
              )}
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
  leftGroup: {
    flexShrink: 0,
  },
  score: {
    fontWeight: "bold",
    color: "#ffd700",
  },
  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#aaa",
    fontSize: "12px",
  },
  terrain: {
    color: "#a8e06c",
  },
  roll: {
    color: "#fff",
  },
};
```

- [ ] **Step 2: Run build**

```sh
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```sh
git add src/components/HUD.tsx
git commit -m "Collapse HUD to a single row"
```

---

### Task 3: Create ActionColumn component

**Files:**
- Create: `src/components/ActionColumn.tsx`

The ActionColumn replaces DiceButton. It renders a single tall button beside the direction picker:
- `AwaitingRoll`: Roll button (blue), full picker height
- `AwaitingDirection` + mulligan available: Mulligan/Re-roll button (amber), full picker height
- `AwaitingDirection` + no mulligan: invisible placeholder (same dimensions, opacity 0) so the picker does not shift position
- `HoledOut` / `NotStarted`: returns null

- [ ] **Step 1: Create the file**

Create `src/components/ActionColumn.tsx`:

```typescript
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

  let rerollLabel = "";
  if (phase === Phase.AwaitingDirection && teeOffRerollAvailable) {
    rerollLabel = "Re-roll\n(free)";
  } else if (phase === Phase.AwaitingDirection && mulligansRemaining > 0) {
    rerollLabel = `Mulligan\n(${mulligansRemaining} left)`;
  }

  // Invisible placeholder keeps picker position stable when no action is available
  if (!canRoll && !canReroll) {
    return <div style={{ ...styles.column, opacity: 0, pointerEvents: "none" }} />;
  }

  return (
    <div style={styles.column}>
      {canRoll && (
        <button
          type="button"
          style={{ ...styles.button, ...styles.rollButton }}
          onClick={onRoll}
          disabled={disabled}
          aria-label="Roll dice"
        >
          {"🎲\nRoll"}
        </button>
      )}
      {canReroll && (
        <button
          type="button"
          style={{ ...styles.button, ...styles.mulliganButton }}
          onClick={onMulligan}
          disabled={disabled}
          aria-label={rerollLabel.replace("\n", " ")}
        >
          {rerollLabel}
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  column: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    maxWidth: "120px",
  },
  button: {
    flex: 1,
    width: "100%",
    fontSize: "14px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    whiteSpace: "pre-line",
    lineHeight: "1.4",
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

- [ ] **Step 2: Run build**

```sh
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```sh
git add src/components/ActionColumn.tsx
git commit -m "Add ActionColumn component to replace DiceButton"
```

---

### Task 4: Update App.tsx to use the new side-by-side layout

**Files:**
- Modify: `src/components/App.tsx`

Changes:
1. Swap `DiceButton` import for `ActionColumn`.
2. Remove the `handlePutt` callback (it was a no-op).
3. Replace the `<DirectionPicker> + <DiceButton>` fragment with a `<div style={styles.controlsRow}>` containing `<DirectionPicker>` and `<ActionColumn>`.
4. Remove the `onPutt` prop from the old DiceButton call site.
5. Add `controlsRow` to the styles object.

- [ ] **Step 1: Update the import line**

In `src/components/App.tsx`, replace:

```typescript
import { DiceButton } from "./DiceButton";
```

with:

```typescript
import { ActionColumn } from "./ActionColumn";
```

- [ ] **Step 2: Remove handlePutt**

Remove the entire `handlePutt` callback (lines 88-95 in the original file):

```typescript
  const handlePutt = useCallback(() => {
    // Putt mode: direction arrows now move 1 cell
    // We don't do anything here except indicate putt mode
    // The DirectionPicker handles the actual direction
    // For simplicity, if we're in AwaitingDirection, show putt as moving 1
    // Actually, we need a way for the user to pick putt direction
    // For now, let's make it so clicking putt then clicking a direction sends PuttChosen
  }, []);
```

- [ ] **Step 3: Replace the controls fragment**

Replace:

```typescript
        <>
          <DirectionPicker state={state} onDirection={handleDirection} disabled={isAnimating} />
          <DiceButton
            state={state}
            onRoll={handleRoll}
            onMulligan={handleMulligan}
            onPutt={handlePutt}
            disabled={isAnimating}
          />
        </>
```

with:

```typescript
        <div style={styles.controlsRow}>
          <DirectionPicker state={state} onDirection={handleDirection} disabled={isAnimating} />
          <ActionColumn
            state={state}
            onRoll={handleRoll}
            onMulligan={handleMulligan}
            disabled={isAnimating}
          />
        </div>
```

- [ ] **Step 4: Add controlsRow to the styles object**

In `src/components/App.tsx`, add `controlsRow` to the `styles` object (after the `canvasContainer` entry):

```typescript
  controlsRow: {
    display: "flex",
    alignItems: "stretch",
    gap: "8px",
    padding: "4px 12px 16px",
  },
```

- [ ] **Step 5: Run build and lint**

```sh
npm run build && npm run lint
```

Expected: both exit 0.

- [ ] **Step 6: Commit**

```sh
git add src/components/App.tsx
git commit -m "Wire up side-by-side DirectionPicker + ActionColumn layout in App"
```

---

### Task 5: Delete the now-unused DiceButton component

**Files:**
- Delete: `src/components/DiceButton.tsx`

- [ ] **Step 1: Delete the file**

```sh
git rm src/components/DiceButton.tsx
```

- [ ] **Step 2: Run build and lint to confirm nothing references it**

```sh
npm run build && npm run lint
```

Expected: exits 0. No import of DiceButton remains anywhere.

- [ ] **Step 3: Run existing engine tests to confirm no regressions**

```sh
npm test
```

Expected: all tests pass. (Engine tests cover reducer, validation, course, and prng — none reference UI components.)

- [ ] **Step 4: Commit**

```sh
git commit -m "Remove DiceButton component (replaced by ActionColumn)"
```

---

### Task 6: Visual verification

- [ ] **Step 1: Start the dev server**

```sh
npm run dev
```

Open the printed URL in a browser. Use browser DevTools to set the viewport to 393x852 (iPhone 17).

- [ ] **Step 2: Check each game phase visually**

Verify:
- Phase `AwaitingRoll`: direction grid (44px buttons) on the left, tall blue Roll button on the right, single-row HUD above.
- After tapping Roll — `AwaitingDirection`, mulligan available: grid on the left, amber Mulligan button on the right.
- After using all mulligans — `AwaitingDirection`, no mulligan: grid on the left, invisible placeholder (no visible button) on the right. Picker does not shift.
- Tapping an arrow in `AwaitingRoll` triggers a putt (ball moves 1 cell). No Roll required.
- Whole page fits without scrolling on a 393x852 viewport.

- [ ] **Step 3: Stop dev server**

`Ctrl-C`
