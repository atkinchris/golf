# Dice Golf - Design Spec

## Overview

A browser-based implementation of the Dice Golf tabletop game. Single player, one hole per game, with randomised course generation and an event-sourced state engine.

See `RULES.md` for the game rules this implementation follows.

## Platform and Tooling

- **Runtime:** Browser (HTML/JS)
- **Language:** TypeScript
- **UI framework:** React
- **Rendering:** Canvas 2D
- **Build tool:** Vite

## Architecture

Three layers with strict separation of concerns:

### Layer 1: Game Engine (pure TypeScript, no React)

Pure functions with no DOM or React dependencies. Fully unit-testable in isolation.

- `reduce(events) -> GameState` - the core state machine
- `validateMove(state, direction) -> MoveResult` - path checking and landing validation
- `generateCourse(seed, config?) -> Course` - deterministic course generation
- Seeded PRNG for deterministic randomness

### Layer 2: React Shell

Thin React layer managing:

- The event log (source of truth, held in state)
- Dispatching new events from player interactions
- UI chrome: HUD, direction picker, dice controls
- Passing derived game state to the canvas renderer

### Layer 3: Canvas Renderer and Animation

A React component owning a `<canvas>` element:

- **Static layer** (drawn once, cached): course terrain, slope arrows, tee/hole markers
- **Dynamic layer** (per-frame during animation): ball position, shot path lines
- **Animation controller**: detects state transitions, interpolates ball position over ~400ms using `requestAnimationFrame`. Idle when no animation is active.

Slope chains animate as a sequence: ball moves to landing cell, pauses, rolls to slope destination. Multiple slopes chain with the same pattern.

## Event Types

Every player action is recorded as an immutable event. The event log is the single source of truth for game state.

```text
GameStarted        { seed: string, gridWidth: number, gridHeight: number }
DiceRolled         { value: number }        -- raw d6 result (1-6)
MulliganUsed       { }                      -- triggers a re-roll
DirectionChosen    { direction: Direction }  -- one of N|NE|E|SE|S|SW|W|NW
PuttChosen         { direction: Direction }  -- always moves exactly 1 cell
```

Design principles:

- Rolling and moving are separate events (player rolls, sees result, then picks direction)
- `PuttChosen` is distinct from `DirectionChosen` (putt always moves 1, ignoring any roll)
- Terrain modifiers, slope resolution, path validation, and scoring are computed by the reducer - not stored as events
- Only player decisions are events

## Game State

Derived from events by the reducer. Never mutated directly.

```text
GameState {
  course: Course
  ball: { x: number, y: number }
  phase: AwaitingRoll | AwaitingDirection | HoledOut
  currentRoll: number | null        -- effective roll after terrain modifier
  rawRoll: number | null            -- the die face before modifier
  stroke: number                    -- current stroke count (starts at 0)
  mulligansRemaining: number        -- starts at 6
  teeOffRerollAvailable: boolean    -- true until first stroke is committed
  par: number                       -- always 6
  shotHistory: Array<{ from, to }> -- for drawing path lines on canvas
  isComplete: boolean
}
```

### State Machine

```text
AwaitingRoll -> AwaitingDirection -> AwaitingRoll -> ... -> HoledOut
     ^               |
     |-- (mulligan)--|
```

- **AwaitingRoll:** Player must roll the dice (or choose to putt without rolling). On stroke 1, a free re-roll is available.
- **AwaitingDirection:** A roll is active. Player picks one of 8 directions, or chooses to putt. Player may also use a mulligan to re-roll: `MulliganUsed` transitions back to `AwaitingRoll`, and the next `DiceRolled` returns to `AwaitingDirection` with the new roll. The player must use the second roll.
- **HoledOut:** Ball is in the hole. Game over. Display score.

## Course Model

### Grid

```text
Cell {
  terrain: Rough | Fairway | Sand | Water | Trees
  slope: Direction | null
}

Course {
  grid: Cell[][]             -- 2D array, grid[y][x]
  width: number              -- 20
  height: number             -- 30
  tee: { x: number, y: number }
  hole: { x: number, y: number }
  seed: string
}
```

Fixed grid size: **20 wide x 30 tall**. The hole runs top-to-bottom (tee near bottom, hole near top).

### Terrain Effects

| Terrain | Roll modifier | Can land? | Can fly over?     | Notes                           |
| ------- | ------------- | --------- | ----------------- | ------------------------------- |
| Rough   | +0            | Yes       | Yes               | Default terrain                 |
| Fairway | +1            | Yes       | Yes               | Includes the green              |
| Sand    | -1            | Yes       | Yes               | Effective roll clamped to min 1 |
| Water   | n/a           | No        | Yes               |                                 |
| Trees   | n/a           | No        | Only from fairway |                                 |

### Path Validation

When the player picks a direction with effective distance `d`:

1. For each cell from position 1 to `d` along the direction vector:
   - If cell is out of bounds -> blocked
   - If cell is Trees and player is NOT on Fairway -> blocked (entire path, not just landing)
   - If it's the landing cell (position `d`): Trees -> blocked, Water -> blocked
2. **Overshoot rule:** If the hole falls on the path at position `p` where `p < d` and `d - p <= 1`, the ball goes in. If `d - p > 1`, the ball goes over the hole.
3. After landing, resolve slope chain:
   - If landing cell has a slope, move ball 1 cell in slope direction
   - Repeat if new cell also has a slope
   - Stop if: slope points into water (ignore slope), two slopes face each other (stop after first), new cell has no slope

## Course Generation

Deterministic from a seed value. The algorithm uses a seeded PRNG throughout.

### Parameters (CourseConfig)

Extracted as a configuration object for later tuning and presets:

```text
CourseConfig {
  fairwayWidthMin: number       -- default 3
  fairwayWidthMax: number       -- default 5
  controlPoints: number         -- default 2-3 (for fairway curves)
  treeDensity: number           -- 0-1, default ~0.3
  sandTrapCount: number         -- default 2-3
  waterProbability: number      -- 0-1, default 0.5
  slopeCount: number            -- default 3-6
}
```

### Algorithm

1. **Place tee and hole.** Tee near row 25-27, hole near row 3-5. Both within the middle 60% of width.

2. **Generate fairway spine.** Pick 2-3 random control points between tee and hole. Interpolate a smooth curve (Catmull-Rom or quadratic Bezier segments). This creates doglegs and gentle curves.

3. **Widen the fairway.** Expand the spine to 3-5 cells wide, varying along the length. Wider near the tee (tee box) and hole (green). Narrower in the middle.

4. **Fill base terrain.** Everything not fairway is Rough.

5. **Place trees.** Along grid edges (2-4 cells deep). Clusters in the rough, especially where the fairway curves (forcing players to stay on the fairway through doglegs). Never on or directly adjacent to the fairway.

6. **Place sand traps.** 2-3 per hole: 1-2 greenside bunkers adjacent to the hole area, 1 fairway bunker along the fairway edge in the middle section. Each trap is a cluster of 2-4 cells.

7. **Place water hazards.** 50% chance. Either a pond (4-8 cells adjacent to fairway, middle third) or a stream (thin perpendicular line crossing the fairway). Must leave a valid path.

8. **Place slopes.** 3-6 slope cells in rough and fairway edges. Direction points "downhill" (away from elevated areas or towards water). Avoid slopes pointing at each other or into water.

9. **Validate.** Pathfinding check to confirm the hole is reachable from the tee. Regenerate with modified seed if not.

## Mobile Portrait Layout

Designed for single-thumb play on a portrait mobile screen.

```text
+---------------------+
|                     |
|                     |
|    Course Canvas    |
|    (top ~2/3,       |
|     aspect-fit)     |
|                     |
|                     |
+---------------------+
|  Stroke: 3  Par: 6  |  <- HUD bar (1-2 rows)
|  Mulligans: 5/6     |
+---------------------+
|                     |
|      NW  N  NE      |
|       W  *  E       |  <- Direction picker (3x3 grid)
|      SW  S  SE      |
|                     |
|    [ Roll Dice ]    |  <- Primary action button
|                     |
+---------------------+
```

- **Canvas** scales to fill available width, maintaining 20:30 aspect ratio
- **HUD bar** is compact - stroke count, par, mulligans remaining, current roll result
- **Direction picker** is a 3x3 grid of large touch targets (minimum 44x44px). Centre cell shows current roll value. The 8 surrounding cells are directional arrows. Invalid directions are dimmed but always visible.
- **Roll button** at the very bottom - easiest thumb target. Label changes contextually: "Roll", "Re-roll (free)", "Use Mulligan (5 left)"
- **Putt button** secondary action beside or above the roll button

## Serialisation and Storage

### Save Format

```json
{
  "version": 1,
  "events": [
    { "type": "GameStarted", "seed": "abc123", "gridWidth": 20, "gridHeight": 30 },
    { "type": "DiceRolled", "value": 4 },
    { "type": "DirectionChosen", "direction": "N" }
  ]
}
```

The course is regenerated from the seed. Full game state is derived by reducing events. A typical completed game is 15-20 events (a few hundred bytes).

### Storage

`localStorage` with two keys:

- `golf:current` - in-progress game (auto-saved after every event)
- `golf:history` - array of completed games with scores

### Replay

Step through the event log with a delay between events. The animation controller handles visual transitions. No special replay infrastructure needed.

## Project Structure

```text
src/
  engine/
    types.ts            -- Event, GameState, Course, Cell, Terrain, Direction
    reducer.ts          -- reduce(events) -> GameState
    validation.ts       -- validateMove, path checking, overshoot logic
    course.ts           -- generateCourse(seed, config) -> Course
    prng.ts             -- seeded PRNG
  components/
    App.tsx             -- top-level, holds event log, dispatches events
    GameCanvas.tsx      -- canvas rendering, static + dynamic layers
    HUD.tsx             -- score, mulligans, roll display
    DirectionPicker.tsx -- 8-direction arrow controls
    DiceButton.tsx      -- roll / re-roll / mulligan button
  hooks/
    useAnimation.ts     -- interpolates ball position between state changes
    useGameStorage.ts   -- localStorage save/load
  index.tsx             -- entry point
```

The `engine/` directory has zero React imports. Pure TypeScript functions only.
