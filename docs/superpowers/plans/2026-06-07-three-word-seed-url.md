# Three-Word Seed and URL Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current alphanumeric seed with a human-readable three-word seed (e.g. `brave-copper-wolf`) and expose it via the URL query string `?seed=`.

**Architecture:** `unique-names-generator` produces the seed string. On load, `App.tsx` reads `?seed=` from the URL or generates a fresh seed and writes it with `history.replaceState`. On new game, the URL is updated with `history.pushState`. All other files are unchanged.

**Tech Stack:** React 19, TypeScript, `unique-names-generator`, browser History API, Vitest.

---

### Task 1: Install `unique-names-generator`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```sh
npm install unique-names-generator
```

- [ ] **Step 2: Verify it was added to dependencies**

```sh
grep unique-names-generator package.json
```

Expected output contains: `"unique-names-generator":`

- [ ] **Step 3: Commit**

```sh
git add package.json package-lock.json
git commit -m "Add unique-names-generator dependency"
```

---

### Task 2: Replace `generateSeed` with three-word generator

**Files:**
- Modify: `src/components/App.tsx`

- [ ] **Step 1: Write a failing test for the new seed format**

Create `src/components/App.test.tsx` with:

```tsx
import { describe, expect, it } from "vitest";
import { generateSeed } from "./App";

describe("generateSeed", () => {
  it("produces a three-word hyphenated string", () => {
    const seed = generateSeed();
    const parts = seed.split("-");
    expect(parts).toHaveLength(3);
    parts.forEach((p) => expect(p.length).toBeGreaterThan(0));
  });

  it("produces different seeds on repeated calls", () => {
    const seeds = new Set(Array.from({ length: 20 }, () => generateSeed()));
    expect(seeds.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Export `generateSeed` from `App.tsx` so the test can import it**

In `src/components/App.tsx`, change:

```ts
function generateSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}
```

to:

```ts
export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}
```

- [ ] **Step 3: Run the tests to confirm current behaviour (they should pass shape-wise or fail on length)**

```sh
npm test -- --reporter=verbose 2>&1 | head -40
```

Expected: the `three-word hyphenated` test fails because the current seed has 1 part, not 3.

- [ ] **Step 4: Replace the implementation**

In `src/components/App.tsx`, update the import block at the top of the file to add:

```ts
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";
```

Then replace the `generateSeed` function body:

```ts
export function generateSeed(): string {
  return uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals], separator: "-" });
}
```

- [ ] **Step 5: Run the tests**

```sh
npm test -- --reporter=verbose 2>&1 | head -40
```

Expected: both `generateSeed` tests pass.

- [ ] **Step 6: Run the full test suite to check for regressions**

```sh
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```sh
git add src/components/App.tsx src/components/App.test.tsx
git commit -m "Replace generateSeed with three-word unique-names-generator"
```

---

### Task 3: Read seed from URL on load; write seed to URL when absent

**Files:**
- Modify: `src/components/App.tsx`

The goal: when the app mounts, if `?seed=` is present in the URL, use that seed. If absent, generate a seed and write it to the URL with `history.replaceState` (no navigation, no new history entry).

- [ ] **Step 1: Write failing tests for URL seed reading**

Add to `src/components/App.test.tsx`:

```tsx
import { getSeedFromUrl, writeSeedToUrl } from "./App";

describe("getSeedFromUrl", () => {
  it("returns the seed from a query string", () => {
    expect(getSeedFromUrl("?seed=brave-copper-wolf")).toBe("brave-copper-wolf");
  });

  it("returns null when no seed param is present", () => {
    expect(getSeedFromUrl("")).toBeNull();
    expect(getSeedFromUrl("?foo=bar")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```sh
npm test -- --reporter=verbose 2>&1 | head -40
```

Expected: `getSeedFromUrl` not defined.

- [ ] **Step 3: Add `getSeedFromUrl` and `writeSeedToUrl` to `App.tsx`**

Add these exported helpers below the `generateSeed` function in `src/components/App.tsx`:

```ts
export function getSeedFromUrl(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("seed");
}

export function writeSeedToUrl(seed: string, replace: boolean): void {
  const url = new URL(window.location.href);
  url.searchParams.set("seed", seed);
  if (replace) {
    history.replaceState(null, "", url.toString());
  } else {
    history.pushState(null, "", url.toString());
  }
}
```

- [ ] **Step 4: Run the tests**

```sh
npm test -- --reporter=verbose 2>&1 | head -40
```

Expected: `getSeedFromUrl` tests pass.

- [ ] **Step 5: Wire URL reading into the initialisation effect in `App.tsx`**

Replace the existing `useEffect` that loads or starts a game (lines 22-37):

```tsx
useEffect(() => {
  if (initialised) return;
  const urlSeed = getSeedFromUrl(window.location.search);
  if (urlSeed) {
    // URL has a seed - check if saved game matches it
    const savedSeed =
      loadedEvents && loadedEvents.length > 0
        ? (loadedEvents.find((e) => e.type === "GameStarted") as { type: "GameStarted"; seed: string } | undefined)
            ?.seed ?? null
        : null;
    if (savedSeed === urlSeed) {
      setEvents(loadedEvents!);
    } else {
      setEvents([{ type: "GameStarted", seed: urlSeed, gridWidth: GRID_WIDTH, gridHeight: GRID_HEIGHT }]);
    }
  } else if (loadedEvents && loadedEvents.length > 0) {
    // Restore saved game and reflect its seed in the URL
    const savedSeed = (
      loadedEvents.find((e) => e.type === "GameStarted") as { type: "GameStarted"; seed: string } | undefined
    )?.seed;
    if (savedSeed) writeSeedToUrl(savedSeed, true);
    setEvents(loadedEvents);
  } else {
    // No saved game, no URL seed - generate fresh
    const seed = generateSeed();
    writeSeedToUrl(seed, true);
    setEvents([{ type: "GameStarted", seed, gridWidth: GRID_WIDTH, gridHeight: GRID_HEIGHT }]);
  }
  setInitialised(true);
}, [loadedEvents, initialised]);
```

- [ ] **Step 6: Run the full test suite**

```sh
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```sh
git add src/components/App.tsx src/components/App.test.tsx
git commit -m "Read seed from URL on load; write seed to URL when absent"
```

---

### Task 4: Update URL on new game

**Files:**
- Modify: `src/components/App.tsx`

When the player starts a new game, generate a seed, update the URL with `pushState`, and start the game.

- [ ] **Step 1: Update `handleNewGame` in `App.tsx`**

Replace the existing `handleNewGame` callback:

```tsx
const handleNewGame = useCallback(() => {
  const seed = generateSeed();
  writeSeedToUrl(seed, false);
  setEvents([{ type: "GameStarted", seed, gridWidth: GRID_WIDTH, gridHeight: GRID_HEIGHT }]);
}, []);
```

- [ ] **Step 2: Run the full test suite**

```sh
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Start the dev server and manually verify end-to-end**

```sh
npm run dev
```

Check the following manually in a browser:

1. Open `http://localhost:5173/golf/` - URL should redirect to something like `http://localhost:5173/golf/?seed=brave-copper-wolf`
2. The seed in the URL should be three hyphen-separated words
3. Reload the page with the same URL - same course loads
4. Click "New Game" - URL changes to a new three-word seed
5. Press the browser back button - previous seed's URL is restored and that course loads

- [ ] **Step 4: Commit**

```sh
git add src/components/App.tsx
git commit -m "Update URL with pushState on new game"
```

---

### Task 5: Build check and tidy

**Files:**
- Read: `src/components/App.tsx` (final state)

- [ ] **Step 1: Run the linter**

```sh
npm run lint
```

If there are auto-fixable issues:

```sh
npm run lint:fix
git add src/components/App.tsx src/components/App.test.tsx
git commit -m "Lint fixes"
```

- [ ] **Step 2: Run the full build**

```sh
npm run build
```

Expected: exits with code 0, no TypeScript errors.

- [ ] **Step 3: Run tests one final time**

```sh
npm test
```

Expected: all tests pass.
