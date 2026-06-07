# Dice Golf

A browser-based implementation of the Dice Golf tabletop game. Roll a d6, pick a direction, and try to hole out under par on a randomly generated course.

## How to play

1. **Roll** the dice to get your distance (1-6).
2. **Pick a direction** using the 8-directional arrows. Invalid directions are dimmed.
3. The ball moves that many cells in your chosen direction. You can always **putt** (move 1 cell) instead.
4. Get the ball in the hole in as few strokes as possible. Par is 6.

### Terrain

| Terrain | Effect                                                           |
| ------- | ---------------------------------------------------------------- |
| Fairway | +1 to your roll. Can hit over trees.                             |
| Rough   | No modifier.                                                     |
| Sand    | -1 to your roll (minimum 1).                                     |
| Water   | Cannot land on. Can fly over.                                    |
| Trees   | Cannot land on. Cannot fly over unless hitting from the fairway. |
| Slopes  | Ball rolls 1 extra cell in the arrow's direction on landing.     |

### Re-rolls

- On your tee-off shot, you get one free re-roll.

See `RULES.md` for the full rules.

## Development

Requires Node.js 20+.

```sh
npm install
npm run dev
```

### Scripts

| Script             | Description                             |
| ------------------ | --------------------------------------- |
| `npm run dev`      | Start the Vite dev server               |
| `npm run build`    | Type-check and build for production     |
| `npm run preview`  | Preview the production build            |
| `npm run lint`     | Check linting and formatting with Biome |
| `npm run lint:fix` | Auto-fix linting and formatting issues  |
| `npm run format`   | Format all files                        |

## Architecture

The game is built around an **event-sourced state engine**. Every player action is recorded as an immutable event. The full game state is derived by reducing the event log - no mutable state.

```text
Event log: [GameStarted, DiceRolled(4), DirectionChosen(NE), ...]
                              |
                      reduce(events) -> GameState
```

This gives serialisation, undo, and replay essentially for free.

### Project structure

```text
src/
  engine/          Pure TypeScript, no React. Fully unit-testable.
    types.ts       Type definitions, enums, constants
    prng.ts        Seeded PRNG (mulberry32) for deterministic courses
    reducer.ts     Event-sourced state machine
    validation.ts  Path checking, slope chains, overshoot rule
    course.ts      Deterministic course generation
  components/      React UI layer
    App.tsx         Top-level wiring and event dispatch
    GameCanvas.tsx  Canvas 2D renderer (cached static + animated dynamic layer)
    HUD.tsx         Stroke count, terrain, roll display
    DirectionPicker.tsx  8-directional arrow controls
    ActionColumn.tsx  Roll button
  hooks/
    useAnimation.ts    Ball position interpolation between state changes
    useGameStorage.ts  localStorage save/load and game history
```

### Course generation

Courses are generated deterministically from a seed string. The algorithm places a tee and hole, generates a curved fairway spine with random control points (creating doglegs), widens it, then scatters trees, sand traps, water hazards, and slopes. A reachability check ensures the hole is always completable.

The generation parameters (fairway width, tree density, trap count, etc.) are exposed as a `CourseConfig` object for tuning.
