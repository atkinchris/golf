/**
 * Core types and interfaces for the Golf Game Engine
 */

// Basic position on the grid
export interface Position {
  readonly row: number
  readonly col: number
}

// Direction enumeration for 8-directional movement
export type Direction = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest'

// Terrain types based on the rules
export type TerrainType = 'rough' | 'fairway' | 'sandTrap' | 'waterHazard' | 'trees' | 'slope' | 'hole' | 'tee'

// Grid cell containing terrain type and optional slope direction
export interface GridCell {
  readonly terrain: TerrainType
  readonly slopeDirection?: Direction // Only used when terrain is 'slope'
}

// Readonly grid interface
export interface ReadonlyGrid {
  readonly width: number
  readonly height: number
  getCell(position: Position): GridCell | null
  isValidPosition(position: Position): boolean
}

// Available player actions
export type Action = 'move' | 'putt' | 'mulligan'

// Move record for history tracking
export interface Move {
  readonly fromPosition: Position
  readonly toPosition: Position
  readonly path: readonly Position[]
  readonly diceRoll: number
  readonly modifiedRoll: number
  readonly action: 'move' | 'putt'
  readonly mulliganUsed: boolean
  readonly slopeRolls?: readonly Position[]
}

// Input command types
export type GameCommand =
  | { type: 'startGame'; seed?: number; playerStart?: Position }
  | { type: 'startTurn'; seed?: number }
  | { type: 'move'; direction: Direction; useRoll?: boolean }
  | { type: 'putt'; direction: Direction }
  | { type: 'mulligan'; seed?: number }
  | { type: 'reset' }

// Output event types
export type GameEvent =
  | { type: 'gameStarted'; playerPosition: Position; terrain: TerrainType }
  | { type: 'turnStarted'; diceRoll: number; modifiedRoll: number; availableActions: Action[] }
  | { type: 'playerMoved'; path: readonly Position[]; finalPosition: Position; slopeRoll?: readonly Position[] }
  | { type: 'gameCompleted'; finalScore: number; totalStrokes: number }
  | { type: 'invalidMove'; reason: string; validDirections: readonly Direction[] }
  | { type: 'mulliganUsed'; remaining: number; newRoll: number }
  | { type: 'puttExecuted'; fromPosition: Position; toPosition: Position }

// Complete game state interface
export interface GameState {
  readonly currentPosition: Position
  readonly currentTerrain: TerrainType
  readonly score: number
  readonly mulligansRemaining: number
  readonly isGameOver: boolean
  readonly lastDiceRoll: number | null
  readonly availableDirections: readonly Direction[]
  readonly moveHistory: readonly Move[]
  readonly gameGrid: ReadonlyGrid
  readonly isOnTee: boolean
  readonly canReRoll: boolean // True when on tee and haven't re-rolled yet
}

// Error types
export type GameError =
  | { type: 'invalidPosition'; position: Position }
  | { type: 'invalidMove'; reason: string }
  | { type: 'gameOver'; reason: string }
  | { type: 'noMulligansLeft' }
  | { type: 'pathBlocked'; blocker: Position }

// Direction vectors for movement calculation
export const DIRECTION_VECTORS: Record<Direction, Position> = {
  north: { row: -1, col: 0 },
  south: { row: 1, col: 0 },
  east: { row: 0, col: 1 },
  west: { row: 0, col: -1 },
  northeast: { row: -1, col: 1 },
  northwest: { row: -1, col: -1 },
  southeast: { row: 1, col: 1 },
  southwest: { row: 1, col: -1 },
}

// All possible directions
export const ALL_DIRECTIONS: readonly Direction[] = [
  'north',
  'south',
  'east',
  'west',
  'northeast',
  'northwest',
  'southeast',
  'southwest',
] as const

// Terrain symbol mapping for the test grid
export const TERRAIN_SYMBOLS: Record<string, TerrainType> = {
  '•': 'rough',
  '■': 'fairway',
  '▨': 'sandTrap',
  '▤': 'waterHazard',
  '▲': 'slope', // Note: slope direction needs additional parsing
  '◉': 'hole',
  '○': 'tee',
} as const

// Game constants
export const GAME_CONSTANTS = {
  MAX_MULLIGANS: 6,
  PAR_SCORE: 6,
  DICE_SIDES: 6,
  GRID_WIDTH: 16,
  GRID_HEIGHT: 26,
} as const
