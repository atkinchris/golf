# Golf Game Engine API Documentation

## Overview

The Golf Game Engine is a complete, deterministic implementation of a paper golf game with command-event architecture. It manages player movement across a 26×16 grid containing various terrain types, handles dice rolling with terrain modifiers, and tracks game state through immutable state transitions.

## Quick Start

```typescript
import { GolfGameEngine } from './src/game'

// Create a new game instance
const engine = new GolfGameEngine()

// Listen to game events
engine.addEventListener((event) => {
  console.log('Game event:', event.type, event)
})

// Start a new game with optional seed for deterministic play
engine.processCommand({ type: 'startGame', seed: 12345 })

// Start a turn (roll dice)
engine.processCommand({ type: 'startTurn', seed: 42 })

// Move the ball using the dice roll
engine.processCommand({ type: 'move', direction: 'north' })

// Or putt (always moves 1 space)
engine.processCommand({ type: 'putt', direction: 'northeast' })

// Use a mulligan to re-roll (6 available per game)
engine.processCommand({ type: 'mulligan', seed: 99 })

// Get current game state
const state = engine.getState()
console.log('Current position:', state.currentPosition)
console.log('Score:', state.score)
console.log('Game over:', state.isGameOver)
```

## Core Classes

### GolfGameEngine

The main game engine that manages all game state and processes commands.

**Methods:**
- `processCommand(command: GameCommand): GameError | null` - Process a game command
- `addEventListener(listener: (event: GameEvent) => void): void` - Listen to game events
- `removeEventListener(listener: (event: GameEvent) => void): void` - Remove event listener
- `getState(): GameState` - Get current game state (readonly)

### Grid

Represents the game board with terrain information.

**Methods:**
- `getCell(position: Position): GridCell | null` - Get terrain at position
- `isValidPosition(position: Position): boolean` - Check if position is on grid
- `findTeePosition(): Position` - Find the starting tee position
- `findHolePosition(): Position` - Find the target hole position

### RulesEngine

Handles game rules, movement validation, and win conditions.

**Methods:**
- `rollDice(terrain: TerrainType): DiceRollResult` - Roll dice with terrain modifiers
- `validateMove(grid, from, direction, distance, isPutt?): MoveValidation` - Validate a move
- `checkWinCondition(grid, position, lastMove?): boolean` - Check if game is won

## Commands

All commands are processed through `engine.processCommand()`:

### startGame
```typescript
{ type: 'startGame', seed?: number, playerStart?: Position }
```
Starts a new game. Optional seed for deterministic play, optional custom start position.

### startTurn
```typescript
{ type: 'startTurn', seed?: number }
```
Rolls dice for the current turn. Seed controls the dice roll result.

### move
```typescript
{ type: 'move', direction: Direction, useRoll?: boolean }
```
Moves the ball in the specified direction using the current dice roll.

### putt
```typescript
{ type: 'putt', direction: Direction }
```
Putts the ball exactly 1 space in the specified direction.

### mulligan
```typescript
{ type: 'mulligan', seed?: number }
```
Uses one of 6 available mulligans to re-roll the dice.

### reset
```typescript
{ type: 'reset' }
```
Resets the game to initial state.

## Events

The engine emits events for all state changes:

- `gameStarted` - Game has started, includes initial position and terrain
- `turnStarted` - New turn started, includes dice roll and available actions
- `playerMoved` - Player moved, includes path taken and final position
- `gameCompleted` - Game finished, includes final score
- `invalidMove` - Move was invalid, includes reason and valid directions
- `mulliganUsed` - Mulligan was used, includes remaining count and new roll
- `puttExecuted` - Putt was executed, includes start and end positions

## Directions

8-directional movement is supported:
- `north`, `south`, `east`, `west`
- `northeast`, `northwest`, `southeast`, `southwest`

## Terrain Types

- **Rough** (`•`) - Standard movement, no modifiers
- **Fairway** (`■`) - +1 to dice roll, can hit over trees
- **Sand Trap** (`▨`) - -1 to dice roll (minimum 0)
- **Water Hazard** (`▤`) - Cannot land in water, can fly over
- **Trees** (`♠`) - Cannot land on trees, cannot fly over except from fairway
- **Slope** (`▲`) - Ball rolls 1 space in slope direction after landing
- **Hole** (`◉`) - Target destination
- **Tee** (`○`) - Starting position

## Game Rules

1. **Dice Rolling**: Roll 1d6, modified by terrain (+1 fairway, -1 sand)
2. **Movement**: Move in straight lines up to dice roll distance
3. **Re-rolling**: One free re-roll when on tee, 6 mulligans per game
4. **Putting**: Always available, moves exactly 1 space
5. **Slopes**: Ball automatically rolls in slope direction after landing
6. **Win Condition**: Reach hole or overshoot by 1 space maximum
7. **Scoring**: Count total number of moves (strokes)

## Error Handling

Commands return `null` on success or a `GameError` object on failure:

```typescript
type GameError = 
  | { type: 'invalidPosition'; position: Position }
  | { type: 'invalidMove'; reason: string }
  | { type: 'gameOver'; reason: string }
  | { type: 'noMulligansLeft' }
  | { type: 'pathBlocked'; blocker: Position }
```

## Deterministic Behavior

The engine uses seeded random number generation to ensure deterministic behavior. The same sequence of commands with the same seeds will always produce identical results, making the engine suitable for replays, testing, and networked multiplayer games.

## TypeScript Support

The engine is written in TypeScript with strict typing and provides comprehensive type definitions for all interfaces, making it easy to integrate with TypeScript projects while providing excellent IDE support and compile-time error checking.