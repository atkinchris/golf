/**
 * Terrain types that can be found on the golf course
 */
export enum TerrainType {
  ROUGH = 'rough', // • - majority terrain, exact roll movement
  FAIRWAY = 'fairway', // ▤ - +1 to roll, can go over trees
  SAND = 'sand', // ▨ - -1 to roll, reduced movement
  WATER = 'water', // ~ - cannot land on, can travel over
  TREES = 'trees', // ■ - cannot land on, cannot travel over (except from fairway)
  TEE = 'tee', // ○ - starting position
  HOLE = 'hole', // ◉ - target position
  SLOPE_N = 'slope_n', // ▲ - slope pointing north
  SLOPE_S = 'slope_s', // ▼ - slope pointing south
  SLOPE_E = 'slope_e', // ► - slope pointing east
  SLOPE_W = 'slope_w', // ◄ - slope pointing west
  SLOPE_NE = 'slope_ne', // slopes can be diagonal too
  SLOPE_NW = 'slope_nw',
  SLOPE_SE = 'slope_se',
  SLOPE_SW = 'slope_sw',
}

/**
 * Represents a position on the grid
 */
export interface Position {
  row: number
  col: number
}

/**
 * Represents a move direction (8-directional)
 */
export interface Direction {
  rowDelta: number
  colDelta: number
}

/**
 * Available club types with different movement characteristics
 */
export enum ClubType {
  DRIVER = 'driver', // 6 spaces, only from fairway, can go over trees
  IRON = 'iron', // 3 spaces, 2 from sand, cannot go over trees
  PUTTER = 'putter', // 1 space, always available
}

/**
 * Current game state
 */
export enum GameState {
  IN_PROGRESS = 'in_progress',
  WON = 'won',
  INVALID_MOVE = 'invalid_move',
}

/**
 * Represents a move made by the player
 */
export interface Move {
  from: Position
  to: Position
  club: ClubType
  diceRoll?: number
  strokeCount: number
  mulliganUsed: boolean
}

/**
 * Complete game state
 */
export interface GolfGameState {
  currentPosition: Position
  moves: Move[]
  strokeCount: number
  mulligansUsed: number
  maxMulligans: number
  gameState: GameState
  par: number
}
