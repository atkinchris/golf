# Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the game fit on one portrait screen on mobile (no scroll, controls fixed at bottom) and present a two-pane side-by-side layout on wider screens (canvas left, controls right).

**Architecture:** Add a `useIsWide` hook that returns `true` when `window.innerWidth >= 600`. `App.tsx` consumes it to switch between two sets of inline styles - a mobile column layout and a desktop row layout. No changes to child components.

**Tech Stack:** React 19, TypeScript, Vite, Vitest

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/hooks/useIsWide.ts` | Create | Viewport-width boolean hook, updates on resize |
| `src/hooks/useIsWide.test.ts` | Create | Unit tests for the hook |
| `src/components/App.tsx` | Modify | Consume `useIsWide`, switch layout style sets |

---

### Task 1: Create `useIsWide` hook

**Files:**
- Create: `src/hooks/useIsWide.ts`
- Create: `src/hooks/useIsWide.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useIsWide.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsWide } from "./useIsWide";

describe("useIsWide", () => {
  const setWidth = (width: number) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  beforeEach(() => {
    setWidth(1024);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when window.innerWidth >= 600", () => {
    setWidth(600);
    const { result } = renderHook(() => useIsWide());
    expect(result.current).toBe(true);
  });

  it("returns false when window.innerWidth < 600", () => {
    setWidth(599);
    const { result } = renderHook(() => useIsWide());
    expect(result.current).toBe(false);
  });

  it("updates when the window is resized to narrow", () => {
    setWidth(800);
    const { result } = renderHook(() => useIsWide());
    expect(result.current).toBe(true);

    act(() => {
      setWidth(375);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(false);
  });

  it("updates when the window is resized to wide", () => {
    setWidth(375);
    const { result } = renderHook(() => useIsWide());
    expect(result.current).toBe(false);

    act(() => {
      setWidth(800);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```sh
npx vitest run src/hooks/useIsWide.test.ts
```

Expected: FAIL - `Cannot find module './useIsWide'`

- [ ] **Step 3: Install `@testing-library/react` if not present**

Check `package.json` devDependencies. If `@testing-library/react` is absent:

```sh
npm install --save-dev @testing-library/react
```

- [ ] **Step 4: Create the hook**

Create `src/hooks/useIsWide.ts`:

```ts
import { useEffect, useState } from "react";

const WIDE_BREAKPOINT = 600;

export function useIsWide(): boolean {
  const [isWide, setIsWide] = useState(() => window.innerWidth >= WIDE_BREAKPOINT);

  useEffect(() => {
    function handleResize() {
      setIsWide(window.innerWidth >= WIDE_BREAKPOINT);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isWide;
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```sh
npx vitest run src/hooks/useIsWide.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```sh
git add src/hooks/useIsWide.ts src/hooks/useIsWide.test.ts
git commit -m "Add useIsWide hook"
```

---

### Task 2: Apply responsive layout in `App.tsx`

**Files:**
- Modify: `src/components/App.tsx`

The current layout is a single column (`flexDirection: "column"`) with the canvas container taking `flex: 1`. The goal is:

- **Mobile (narrow, `isWide === false`):** keep the column layout, canvas fills remaining height, controls row and HUD fixed at the bottom. Add `overflow: hidden` and `height: 100dvh` (not just `min-height`) so the viewport is exactly one screen with no scroll.
- **Desktop (wide, `isWide === true`):** switch to a row layout. Left pane: canvas centred, max 400px wide. Right pane: HUD + controls grouped and centred.

There are no automated tests for layout styles (they are visual). Manual verification steps are included.

- [ ] **Step 1: Import `useIsWide` in `App.tsx`**

In `src/components/App.tsx`, add the import after the existing hook imports:

```ts
import { useIsWide } from "../hooks/useIsWide";
```

- [ ] **Step 2: Call the hook inside `App`**

Inside the `App` function, after the existing hook calls (after `useAnimation`):

```ts
const isWide = useIsWide();
```

- [ ] **Step 3: Replace the JSX return with layout-aware markup**

Replace the entire `return (...)` block (lines 102-132) with:

```tsx
  return (
    <div style={isWide ? styles.containerWide : styles.containerMobile}>
      {isWide ? (
        <>
          {/* Left pane: canvas */}
          <div style={styles.canvasPaneWide}>
            <GameCanvas state={state} animatedBall={animatedBall} />
          </div>
          {/* Right pane: controls */}
          <div style={styles.controlsPaneWide}>
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
              <div style={styles.controlsGroupWide}>
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
        </>
      ) : (
        <>
          {/* Canvas fills remaining space */}
          <div style={styles.canvasContainerMobile}>
            <GameCanvas state={state} animatedBall={animatedBall} />
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
        </>
      )}
    </div>
  );
```

- [ ] **Step 4: Replace the `styles` object**

Replace the entire `const styles: Record<string, React.CSSProperties> = { ... }` block with:

```ts
const styles: Record<string, React.CSSProperties> = {
  // --- Mobile layout ---
  containerMobile: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    overflow: "hidden",
    background: "#0f0f23",
  },
  canvasContainerMobile: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    minHeight: 0, // allows flex child to shrink below content size
  },
  // --- Desktop/wide layout ---
  containerWide: {
    display: "flex",
    flexDirection: "row",
    height: "100dvh",
    overflow: "hidden",
    background: "#0f0f23",
  },
  canvasPaneWide: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    minWidth: 0,
    maxWidth: "400px",
  },
  controlsPaneWide: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "16px",
    overflow: "hidden",
  },
  controlsGroupWide: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "8px",
  },
  // --- Shared ---
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

- [ ] **Step 5: Run TypeScript check**

```sh
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run full test suite**

```sh
npm test
```

Expected: all tests pass (engine unit tests + `useIsWide` hook tests).

- [ ] **Step 7: Manual verification - mobile**

```sh
npm run dev
```

Open `http://localhost:5173` in a browser. Use DevTools to emulate a 390x844 (iPhone 14) viewport.

Verify:
- No vertical scrollbar / no scroll possible.
- Canvas fills the top portion of the screen, shrinking to fit with black bars if needed (aspect ratio preserved).
- HUD bar and controls row are visibly at the bottom.
- Tapping arrow buttons works correctly.

- [ ] **Step 8: Manual verification - desktop**

In the same browser, resize to a 1200px wide viewport or switch DevTools to responsive and set width to 800px.

Verify:
- Canvas is in the left half, centred, no wider than 400px.
- HUD + controls are in the right half, grouped and centred.
- No scrolling.

- [ ] **Step 9: Commit**

```sh
git add src/components/App.tsx
git commit -m "Apply responsive two-layout design to App"
```

---

### Task 3: Constrain canvas width on desktop

**Files:**
- Modify: `src/components/GameCanvas.tsx`

On desktop, `canvasPaneWide` has `maxWidth: "400px"` but the `<canvas>` element has `width: "100%"`. This means the canvas will expand to fill the pane up to 400px, which is correct. However, the canvas also needs to not exceed its intrinsic pixel size when scaled up (the intrinsic size is 320px wide). Currently `width: "100%"` with a 400px container would upscale from 320 to 400px - this is acceptable (pixelated scaling already enabled), but if you want to cap it at intrinsic size, use `max-width`.

- [ ] **Step 1: Add `maxWidth` to the canvas element style**

In `src/components/GameCanvas.tsx`, change the `<canvas>` style from:

```ts
style={{
  width: "100%",
  height: "auto",
  imageRendering: "pixelated",
}}
```

to:

```ts
style={{
  width: "100%",
  maxWidth: "100%",
  height: "auto",
  imageRendering: "pixelated",
  display: "block",
}}
```

The `display: "block"` removes the default inline bottom gap that can cause a few pixels of unwanted space below the canvas.

- [ ] **Step 2: Run TypeScript check**

```sh
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```sh
git add src/components/GameCanvas.tsx
git commit -m "Add display:block and maxWidth to canvas element"
```
