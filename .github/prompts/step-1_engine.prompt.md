# Golf Game Engine Implementation

You are a TypeScript game engine architect tasked with creating a complete, deterministic golf game engine. Your goal is to build a robust state machine that handles all game mechanics for a grid-based paper golf game without any UI components.

## Context & Requirements

**Game Overview:**
Build a golf game engine that manages player movement across a 26-row × 16-column grid containing various terrain types. Players start at a tee position (○) and must navigate to the hole (◉) while managing dice rolls, terrain effects, and limited mulligans.

**Critical Constraints:**

- **Deterministic behavior**: Identical inputs must always produce identical outputs (essential for replays)
- **Command-Event architecture**: Input commands trigger state changes that emit descriptive events
- **Immutable state**: All state transitions preserve history for debugging and replay
- **No UI**: Pure game logic implementation only

## Technical Stack

- **Language**: TypeScript with strict typing and modern ES2022+ features
- **Testing**: Vitest exclusively (no other testing frameworks)
- **Architecture**: Event-driven state machine pattern
- **Code Quality**: Modular, maintainable, well-documented code

## Game Rules Implementation

You must implement ALL rules from the provided RULES.md file, including:

### Core Mechanics

- **Dice Rolling**: d6 with terrain modifiers (+1 fairway, -1 sand trap)
- **Movement**: 8-directional movement (orthogonal + diagonal)
- **Path Validation**: Straight-line movement with obstacle checking
- **Terrain Effects**: Different movement rules per terrain type

### Special Rules

- **Re-rolling**: One re-roll when teeing off, must use second roll
- **Mulligans**: 6 per game, can re-roll any time
- **Putting**: Always available, moves exactly 1 space
- **Overshooting**: Ball can overshoot hole by 1 space and still count as "in"
- **Slopes**: Ball rolls additional spaces following arrow directions
- **Obstacles**: Trees block movement except from fairway, water cannot be landed on

### Terrain Types & Effects

Map these symbols to your terrain system:

- `•` = Rough (default movement)
- `■` = Fairway (+1 to roll, can hit over trees)
- `▨` = Sand trap (-1 to roll)
- `▲` = Slopes (ball rolls 1 space in arrow direction)
- `◉` = Hole (target destination)
- `▤` = Water hazard (cannot land on, can fly over)
- `○` = Tee (starting position)

## API Design Specification

### Input Commands

Design a discriminated union of command types:

```typescript
type GameCommand =
  | { type: 'startGame'; seed?: number; playerStart: [number, number] }
  | { type: 'startTurn'; seed?: number }
  | { type: 'move'; direction: Direction; useRoll?: boolean }
  | { type: 'putt'; direction: Direction }
  | { type: 'mulligan'; seed?: number }
  | { type: 'reset' }

type Direction = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest'
```

### Output Events

Emit detailed events for every state change:

```typescript
type GameEvent =
  | { type: 'gameStarted'; playerPosition: Position; terrain: TerrainType }
  | { type: 'turnStarted'; diceRoll: number; modifiedRoll: number; availableActions: Action[] }
  | { type: 'playerMoved'; path: Position[]; finalPosition: Position; slopeRoll?: Position[] }
  | { type: 'gameCompleted'; finalScore: number; totalStrokes: number }
  | { type: 'invalidMove'; reason: string; validDirections: Direction[] }
  | { type: 'mulliganUsed'; remaining: number; newRoll: number }
```

### Read-Only State Properties

Provide comprehensive game state access:

```typescript
interface GameState {
  readonly currentPosition: Position
  readonly currentTerrain: TerrainType
  readonly score: number
  readonly mulligansRemaining: number
  readonly isGameOver: boolean
  readonly lastDiceRoll: number | null
  readonly availableDirections: Direction[]
  readonly moveHistory: Move[]
  readonly gameGrid: ReadonlyGrid
  readonly isOnTee: boolean
}
```

## Implementation Structure

Organize your code into these logical modules:

1. **Core Types** (`types.ts`)

   - Grid, Position, Terrain, Command, Event interfaces
   - Direction and Action enums

2. **Grid System** (`grid.ts`)

   - Grid representation and terrain mapping
   - Path validation and obstacle checking
   - Boundary condition handling

3. **Game Engine** (`engine.ts`)

   - Main state machine implementation
   - Command processing and event emission
   - Deterministic dice rolling with seeded random

4. **Rules Engine** (`rules.ts`)

   - Movement calculation with terrain modifiers
   - Slope rolling mechanics
   - Win condition and scoring logic

5. **Test Suite** (`engine.test.ts`)
   - Unit tests for each command type
   - Integration tests for complete game flows
   - Determinism verification tests
   - Edge case handling tests

## Test Grid Layout

Use this exact grid for your test cases (26 rows × 16 columns):

```
01: ••••••••••••••••
02: ••••••••••••■•••
03: ••••••••••■■■■••
04: ••••••••••■■■■■•
05: ••••••••▨▨■■■◉■•
06: ••••••▨▨▨▨■■■■■•
07: •••••▲▲▨▨▨■■■■••
08: ••••••▨▨▨▨■■■■••
09: ••••••▨▨▨▨•■••••
10: •••••■■▲▲•••••••
11: ••••■■■■••••••••
12: •••••■■••▤▤▤▤•••
13: ••••••••▤▤▤▤▤•••
14: •••••••▤▤▤▤▤▤▤•
15: ••••••▤▤▤▤▤▤▤••
16: •••••▤▤▤▤▤▤■■••
17: •••••▤▤▤▤▤▤■■■•
18: ••■■■■■■▤▤▤▤■■■•
19: •■■■■■■■■••■■■■■
20: •■■■■■■■■••■■■■•
21: ••■■○■■■••••■•••
22: ••■■■■■■••••••••
23: ••■■■■••••••••••
24: •••■■•••••••••••
25: ••••••••••••••••
26: ••••••••••••••••
```

## Success Criteria

Your implementation must:

1. **Handle all game scenarios** including edge cases (slopes to water, double slopes, etc.)
2. **Maintain deterministic behavior** across multiple runs with same inputs
3. **Emit detailed events** for every state change with sufficient context
4. **Validate all moves** and provide clear error messages for invalid actions
5. **Track complete game state** including history for debugging
6. **Pass comprehensive tests** covering normal gameplay and edge cases

## Deliverables

Provide complete TypeScript files with:

- Main engine implementation with full state machine
- Comprehensive type definitions for all interfaces
- Grid system with terrain mapping
- Complete Vitest test suite (>90% coverage)
- Brief API documentation with usage examples

Focus on creating clean, maintainable code that exactly implements the paper golf rules while providing a robust foundation for future enhancements.
