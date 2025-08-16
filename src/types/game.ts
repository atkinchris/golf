export type TerrainType = 'rough' | 'fairway' | 'sand' | 'water' | 'trees' | 'slope' | 'hole'

export type Direction = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest'

export type SlopeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export interface Position {
  x: number
  y: number
}

export interface Tile {
  position: Position
  terrain: TerrainType
  slopeDirection?: SlopeDirection
}

export interface GameState {
  ballPosition: Position
  currentScore: number
  mulligansRemaining: number
  lastRoll: number | null
  canReroll: boolean
  isTeingOff: boolean
  gamePhase: 'rolling' | 'moving' | 'completed'
  availableDirections: Direction[]
}

export interface Course {
  width: number
  height: number
  tiles: Tile[][]
  holePosition: Position
}

// Movement validation result
export interface MoveValidation {
  isValid: boolean
  reason?: string
  finalPosition?: Position
  pathBlocked?: boolean
}

// Club types for different situations
export type ClubType = 'driver' | 'iron' | 'putter'

export interface ClubRules {
  maxDistance: number
  terrainRestrictions?: TerrainType[]
  terrainBonuses?: Partial<Record<TerrainType, number>>
}

// Game events for testing and state management
export interface GameEvent {
  type: 'dice_rolled' | 'ball_moved' | 'mulligan_used' | 'hole_completed' | 'terrain_entered'
  payload: unknown
}
