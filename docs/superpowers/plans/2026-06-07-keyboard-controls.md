# Keyboard Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add keyboard control so the game can be played with QWEADZXC for directions and S for rolling.

**Architecture:** A new `useKeyboard` hook attaches a single `window` keydown listener, maps keys to game actions, and gates firing on `phase` and `disabled`. `App` calls the hook with its existing callbacks.

**Tech Stack:** React, TypeScript, Vitest

---

## File Map

- Create: `src/hooks/useKeyboard.ts` - the keyboard hook
- Create: `src/hooks/useKeyboard.test.ts` - unit tests for the hook
- Modify: `src/components/App.tsx` - call `useKeyboard`

---

### Task 1: Write and test `useKeyboard`

**Files:**
- Create: `src/hooks/useKeyboard.ts`
- Create: `src/hooks/useKeyboard.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useKeyboard.test.ts`:

```typescript
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Phase } from "../engine/types";
import { useKeyboard } from "./useKeyboard";

describe("useKeyboard", () => {
  let onRoll: ReturnType<typeof vi.fn>;
  let onDirection: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onRoll = vi.fn();
    onDirection = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function fire(key: string) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  }

  describe("direction keys", () => {
    it("calls onDirection with NW when Q is pressed during AwaitingDirection", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("q");
      expect(onDirection).toHaveBeenCalledWith("NW");
    });

    it("calls onDirection with N when W is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("w");
      expect(onDirection).toHaveBeenCalledWith("N");
    });

    it("calls onDirection with NE when E is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("e");
      expect(onDirection).toHaveBeenCalledWith("NE");
    });

    it("calls onDirection with W when A is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("a");
      expect(onDirection).toHaveBeenCalledWith("W");
    });

    it("calls onDirection with E when D is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("d");
      expect(onDirection).toHaveBeenCalledWith("E");
    });

    it("calls onDirection with SW when Z is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("z");
      expect(onDirection).toHaveBeenCalledWith("SW");
    });

    it("calls onDirection with S when X is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("x");
      expect(onDirection).toHaveBeenCalledWith("S");
    });

    it("calls onDirection with SE when C is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("c");
      expect(onDirection).toHaveBeenCalledWith("SE");
    });

    it("does not call onDirection when disabled", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: true, onRoll, onDirection }),
      );
      fire("q");
      expect(onDirection).not.toHaveBeenCalled();
    });

    it("calls onDirection during AwaitingRoll (putt path)", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingRoll, disabled: false, onRoll, onDirection }),
      );
      fire("q");
      expect(onDirection).toHaveBeenCalledWith("NW");
    });
  });

  describe("S key (roll)", () => {
    it("calls onRoll when S is pressed during AwaitingRoll", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingRoll, disabled: false, onRoll, onDirection }),
      );
      fire("s");
      expect(onRoll).toHaveBeenCalled();
    });

    it("does not call onRoll when disabled", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingRoll, disabled: true, onRoll, onDirection }),
      );
      fire("s");
      expect(onRoll).not.toHaveBeenCalled();
    });

    it("does not call onRoll during AwaitingDirection", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("s");
      expect(onRoll).not.toHaveBeenCalled();
    });

    it("does not call onRoll or onDirection during HoledOut", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.HoledOut, disabled: false, onRoll, onDirection }),
      );
      fire("s");
      fire("q");
      expect(onRoll).not.toHaveBeenCalled();
      expect(onDirection).not.toHaveBeenCalled();
    });
  });

  describe("uppercase keys", () => {
    it("handles uppercase Q (Shift held)", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("Q");
      expect(onDirection).toHaveBeenCalledWith("NW");
    });
  });

  describe("unrelated keys", () => {
    it("ignores unrelated keys", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("f");
      expect(onDirection).not.toHaveBeenCalled();
      expect(onRoll).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("removes listener on unmount", () => {
      const spy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      unmount();
      expect(spy).toHaveBeenCalledWith("keydown", expect.any(Function));
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```sh
npx vitest run src/hooks/useKeyboard.test.ts
```

Expected: all tests fail with "Cannot find module './useKeyboard'"

- [ ] **Step 3: Create `src/hooks/useKeyboard.ts`**

```typescript
import { useEffect } from "react";
import type { Direction } from "../engine/types";
import { Phase } from "../engine/types";

interface UseKeyboardOptions {
  phase: Phase;
  disabled: boolean;
  onRoll: () => void;
  onDirection: (dir: Direction) => void;
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  q: "NW",
  w: "N",
  e: "NE",
  a: "W",
  d: "E",
  z: "SW",
  x: "S",
  c: "SE",
};

const DIRECTION_KEYS = new Set(Object.keys(KEY_TO_DIRECTION));
const ROLL_KEY = "s";
const ALL_HANDLED_KEYS = new Set([...DIRECTION_KEYS, ROLL_KEY]);

export function useKeyboard({ phase, disabled, onRoll, onDirection }: UseKeyboardOptions): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const key = event.key.toLowerCase();
      if (!ALL_HANDLED_KEYS.has(key)) return;

      event.preventDefault();

      if (disabled) return;

      if (key === ROLL_KEY) {
        if (phase === Phase.AwaitingRoll) {
          onRoll();
        }
        return;
      }

      const dir = KEY_TO_DIRECTION[key];
      if (dir !== undefined) {
        onDirection(dir);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, disabled, onRoll, onDirection]);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```sh
npx vitest run src/hooks/useKeyboard.test.ts
```

Expected: all tests pass

- [ ] **Step 5: Run full test suite to check for regressions**

```sh
npm test
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```sh
git add src/hooks/useKeyboard.ts src/hooks/useKeyboard.test.ts
git commit -m "Add useKeyboard hook"
```

---

### Task 2: Wire `useKeyboard` into `App`

**Files:**
- Modify: `src/components/App.tsx`

- [ ] **Step 1: Import `useKeyboard` in `App.tsx`**

In `src/components/App.tsx`, add the import after the existing hook imports:

```typescript
import { useKeyboard } from "../hooks/useKeyboard";
```

- [ ] **Step 2: Call the hook inside `App`**

Add this line after the `useAnimation` call (around line 68 of the current file, just after the `const { animatedBall, isAnimating }` line):

```typescript
useKeyboard({ phase: state.phase, disabled: isAnimating, onRoll: handleRoll, onDirection: handleDirection });
```

- [ ] **Step 3: Run the full test suite**

```sh
npm test
```

Expected: all tests pass

- [ ] **Step 4: Build to confirm no type errors**

```sh
npm run build
```

Expected: exits 0 with no TypeScript errors

- [ ] **Step 5: Commit**

```sh
git add src/components/App.tsx
git commit -m "Wire useKeyboard into App"
```
