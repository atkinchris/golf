# Golf Game State Machine Development Prompt

You are tasked with creating a TypeScript state machine for a dice-based golf game. This game is played on a grid and involves strategic movement through different terrain types to reach the hole with the lowest score possible.

## Core Requirements

Create a **deterministic state machine** in TypeScript that manages all game logic. The same sequence of inputs must always produce identical outputs. Do not implement any UI or graphics - focus solely on the game engine and logic.

## Game Grid Specifications

- Grid size: 16 columns (horizontal) × 26 rows (vertical)
- Grid uses 1-based indexing (columns 1-16, rows 1-26)
- Each cell contains one terrain type
- Player starts at a designated tee position
- Goal is to reach the hole position

## Terrain Types and Effects

### Rough (•)

- Default terrain covering majority of the grid
- Move exactly the rolled distance
- No movement modifiers

### Fairway (○)

- Preferred terrain for strategic play
- **+1 bonus** to dice roll distance
- Only terrain that allows hitting **over trees**
- Enables use of Driver (6-space move)

### Sand Trap (▨)

- Penalizes movement capability
- **-1 penalty** to dice roll distance
- Iron moves reduced from 3 to 2 spaces

### Water Hazard (~)

- **Cannot land on water** (invalid move)
- **Can fly over water** during movement path

### Trees (■)

- **Cannot land on trees** (invalid move)
- **Cannot fly over trees** except when hitting from fairway

### Slopes (▲▼◄►)

- Arrow indicates roll direction after landing
- Ball automatically rolls 1 space in arrow direction
- **Chain rolling**: Continue rolling if new space also has slope
- **Safety rules**:
  - Ignore slope if it points toward water
  - Stop after first movement if two slopes point at each other

## Movement Rules and Club Types

### Dice Rolling (1-6)

- Roll d6 to determine base movement distance
- Apply terrain modifiers (fairway +1, sand -1)
- **Tee-off re-roll**: One free re-roll when starting, must use second result
- **Mulligans**: 6 per game, can re-roll any shot, must use second result

### Club Selection

- **Driver**: 6 spaces, only from fairway, can go over trees
- **Iron**: 3 spaces (2 from sand), cannot go over trees, usable anywhere
- **Putter**: Always 1 space, usable from any terrain, always available

### Movement Mechanics

- **8-directional movement**: orthogonal and diagonal
- **Straight-line paths**: All movement follows direct lines
- **Path validation**: Entire path must be clear of obstacles
- **Reverse direction**: Can move opposite to previous shot if needed

### Hole Scoring

- **Overshoot rule**: Can overshoot hole by exactly 1 space and still score
- **Path crossing**: If movement path crosses hole, can choose to score or continue
- **Par system**: Each hole has par of 6 strokes

## State Machine Requirements

### Core State Tracking

```typescript
interface GameState {
  // Grid and positions
  grid: TerrainType[][]
  playerPosition: Position
  holePosition: Position
  teePosition: Position

  // Game progress
  currentStroke: number
  totalScore: number
  isGameComplete: boolean
  isGameWon: boolean

  // Move history for determinism
  moveHistory: Move[]

  // Resources
  mulligansRemaining: number
  canRerollTeeShot: boolean
}
```

### Required Methods

- `rollDice(): number` - Generate dice roll (1-6)
- `calculateMoveDistance(roll: number, terrain: TerrainType): number` - Apply terrain modifiers
- `validateMovePath(from: Position, to: Position, fromTerrain: TerrainType): boolean` - Check path legality
- `executeMove(direction: Direction, distance: number): GameState` - Perform movement
- `handleSlope(position: Position): Position` - Process slope effects
- `checkHoleScored(path: Position[]): boolean` - Determine if hole was reached
- `useMulligan(newRoll: number): GameState` - Apply mulligan re-roll
- `resetGame(): GameState` - Initialize new game state

### Movement Validation Logic

- Verify destination is within grid bounds
- Ensure no landing on water or trees
- Check path clearance (trees blocking unless from fairway)
- Validate club selection matches current terrain restrictions

## Example Grid Layout

```
// Use this as reference for terrain symbol meanings:
// • = Rough, ○ = Fairway, ▨ = Sand, ~ = Water, ■ = Trees
// ▲▼◄► = Slopes, ◉ = Hole position

01 •••• •••• •••• ••••
02 •••• •••• •••• ■•••
03 •••• •••• •••■ ■■■•
04 •••• •••• •••■ ■■■■
05 •••• •••• •▨▨■ ■■◉■
06 •••• •••• ▨▨▨▨ ■■■■
07 •••• •••▲ ▲▨▨▨ ■■■•
08 •••• •••• ▨▨▨▨ ■■■•
09 •••• •••• ▨▨▨▨ •■••
10 •••• •••■ ■▲▲• ••••
11 •••• ••■■ ■■•• ••••
12 •••• •••■ ■••▤ ▤▤▤•
13 •••• •••• ••▤▤ ▤▤▤•
14 •••• •••• •▤▤▤ ▤▤▤▤
15 •••• •••• ▤▤▤▤ ▤▤▤•
16 •••• •••▤ ▤▤▤▤ ▤■■•
17 •••• •••▤ ▤▤▤▤ ▤■■■
18 ••■■ ■■■■ ▤▤▤▤ ■■■•
19 •■■■ ■■■■ ■••■ ■■■■
20 •■■■ ■■■■ ■••■ ■■■•
21 ••■■ ○■■■ •••• •■••
22 ••■■ ■■■■ •••• ••••
23 ••■■ ■■■• •••• ••••
24 •••■ ■••• •••• ••••
25 •••• •••• •••• ••••
26 •••• •••• •••• ••••
```

## Testing Requirements

Create comprehensive unit tests covering:

- **Terrain effects**: Verify all movement modifiers apply correctly
- **Movement validation**: Test path blocking and clearance rules
- **Slope mechanics**: Ensure proper chaining and safety rules
- **Hole scoring**: Validate overshoot and path-crossing logic
- **Determinism**: Same input sequences produce identical results
- **Edge cases**: Grid boundaries, invalid moves, resource depletion
- **Club restrictions**: Driver from fairway only, iron limitations
- **Mulligan usage**: Proper tracking and application

## Deliverables

1. Complete TypeScript state machine with all game logic
2. Comprehensive type definitions for all game entities
3. Full test suite with >90% coverage
4. Example usage demonstrating a complete game playthrough
5. Documentation explaining the API and game flow

Focus on clean, maintainable code with clear separation of concerns. The state machine should be easily extensible for future features while maintaining the core deterministic behavior.
