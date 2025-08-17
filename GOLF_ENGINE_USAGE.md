# Golf Engine Example Usage

This demonstrates how to use the golf engine that was implemented based on the instructions in `.github/prompts/engine.prompt.md`.

## Basic Usage

```typescript
import { GolfEngine, Direction, EXAMPLE_GRID } from './src/engine'

// Create a new game with the example grid
const engine = new GolfEngine(EXAMPLE_GRID)

// Get initial game state
const initialState = engine.getState()
console.log('Starting position:', initialState.currentPosition)
console.log('Hole position:', initialState.holePosition)
console.log('Par:', initialState.par)
console.log('Mulligans available:', engine.getRemainingMulligans())

// Display the grid
console.log('\nCourse layout:')
console.log(engine.toString())

// Make moves
console.log('\nMaking moves...')

// Move southwest (with fairway bonus from start position)
const move1 = engine.attemptMove(Direction.SW, 3)
console.log('Move 1:', move1.success ? 'Success' : 'Failed -', move1.message)

// Use putter for precise movement
const move2 = engine.putt(Direction.S)
console.log('Move 2 (putt):', move2.success ? 'Success' : 'Failed -', move2.message)

// Check game state
const currentState = engine.getState()
console.log('\nGame state:')
console.log('Current position:', currentState.currentPosition)
console.log('Strokes taken:', currentState.strokeCount)
console.log('Score vs par:', engine.getScore())
console.log('Game won:', currentState.isGameWon)

// Display updated grid with ball position
console.log('\nCurrent course state:')
console.log(engine.toString())
```

## Features Implemented

- **Deterministic state machine**: Same inputs always produce same outputs
- **Grid parsing**: Convert ASCII representation to game grid
- **Movement system**: 8-directional movement with distance calculation
- **Terrain effects**:
  - Fairway: +1 to roll
  - Sand: -1 to roll (minimum 1)
  - Water: Cannot land in
  - Trees: Cannot land on, block path (except from fairway)
  - Slopes: Ball rolls until reaching non-slope terrain
- **Club system**:
  - Driver: 6 spaces, fairway only, can go over trees
  - Iron: 3 spaces (2 from sand), cannot go over trees
  - Putter: Exactly 1 space, ignores terrain modifiers
- **Game mechanics**:
  - 6 Mulligans per course for re-rolling
  - Win condition: Ball reaches hole (can overshoot by 1)
  - Scoring system (strokes vs par)
  - Path validation and collision detection

## Running Tests

```bash
npm test
```

All 19 comprehensive tests pass, covering:
- Grid parsing edge cases
- Movement validation
- Terrain effects
- Club restrictions
- Slope mechanics
- Win/lose conditions
- Mulligan system
- Game state management