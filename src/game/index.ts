/**
 * Golf Game Engine - Public API
 *
 * A complete, deterministic golf game engine that implements the paper golf rules
 * with command-event architecture and immutable state management.
 */

// Export main engine class
export { GolfGameEngine } from './engine'

// Export supporting classes
export { Grid } from './grid'
export { RulesEngine } from './rules'

// Export all types and interfaces
export type {
  Position,
  Direction,
  TerrainType,
  GridCell,
  ReadonlyGrid,
  Action,
  Move,
  GameCommand,
  GameEvent,
  GameState,
  GameError,
} from './types'

// Export constants
export { DIRECTION_VECTORS, ALL_DIRECTIONS, TERRAIN_SYMBOLS, GAME_CONSTANTS } from './types'

// Export random utilities
export { createRandomGenerator } from './random'
export type { RandomGenerator } from './random'

/**
 * Quick Start Example:
 *
 * ```typescript
 * import { GolfGameEngine } from './golf-engine'
 *
 * const engine = new GolfGameEngine()
 *
 * // Listen to game events
 * engine.addEventListener((event) => {
 *   console.log('Game event:', event)
 * })
 *
 * // Start a new game
 * engine.processCommand({ type: 'startGame', seed: 12345 })
 *
 * // Start a turn (roll dice)
 * engine.processCommand({ type: 'startTurn', seed: 42 })
 *
 * // Move the ball
 * engine.processCommand({ type: 'move', direction: 'north' })
 *
 * // Or putt instead
 * engine.processCommand({ type: 'putt', direction: 'northeast' })
 *
 * // Use a mulligan to re-roll
 * engine.processCommand({ type: 'mulligan', seed: 99 })
 *
 * // Get current game state
 * const state = engine.getState()
 * console.log('Current position:', state.currentPosition)
 * console.log('Score:', state.score)
 * console.log('Game over:', state.isGameOver)
 * ```
 */
