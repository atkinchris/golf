export enum TerrainType {
  ROUGH = 'rough', // • - normal movement
  FAIRWAY = 'fairway', // (implicit) - +1 to roll, can go over trees
  SAND = 'sand', // ▨ - -1 to roll
  WATER = 'water', // ~ - can't land, can travel over
  TREE = 'tree', // ■ - can't land, can't travel over (except from fairway)
  SLOPE_N = 'slope_n', // ▲ - ball rolls north
  SLOPE_S = 'slope_s', // ▼ - ball rolls south
  SLOPE_E = 'slope_e', // ► - ball rolls east
  SLOPE_W = 'slope_w', // ◄ - ball rolls west
  SLOPE_NE = 'slope_ne', // ↗ - ball rolls northeast
  SLOPE_NW = 'slope_nw', // ↖ - ball rolls northwest
  SLOPE_SE = 'slope_se', // ↘ - ball rolls southeast
  SLOPE_SW = 'slope_sw', // ↙ - ball rolls southwest
  HOLE = 'hole', // ○ - target
  START = 'start', // ◉ - starting position
}

export enum Direction {
  N = 'north',
  NE = 'northeast',
  E = 'east',
  SE = 'southeast',
  S = 'south',
  SW = 'southwest',
  W = 'west',
  NW = 'northwest',
}

export interface Position {
  x: number
  y: number
}

export interface Move {
  from: Position
  to: Position
  direction: Direction
  distance: number
  strokeNumber: number
}

export enum ClubType {
  DRIVER = 'driver', // 6 spaces, fairway only, can go over trees
  IRON = 'iron', // 3 spaces, anywhere, 2 from sand, can't go over trees
  PUTTER = 'putter', // 1 space, anywhere
}

export interface GameState {
  grid: TerrainType[][]
  currentPosition: Position
  holePosition: Position
  startPosition: Position
  moves: Move[]
  strokeCount: number
  mullygansUsed: number
  maxMulligans: number
  isGameWon: boolean
  isGameLost: boolean
  par: number
}

export interface MoveAttempt {
  direction: Direction
  distance: number
  club: ClubType
}

export interface MoveResult {
  success: boolean
  newPosition?: Position
  finalPosition?: Position // After slopes
  message?: string
  slopesTriggered?: Position[]
}

export const DIRECTION_VECTORS: Record<Direction, Position> = {
  [Direction.N]: { x: 0, y: -1 },
  [Direction.NE]: { x: 1, y: -1 },
  [Direction.E]: { x: 1, y: 0 },
  [Direction.SE]: { x: 1, y: 1 },
  [Direction.S]: { x: 0, y: 1 },
  [Direction.SW]: { x: -1, y: 1 },
  [Direction.W]: { x: -1, y: 0 },
  [Direction.NW]: { x: -1, y: -1 },
}

export const SLOPE_DIRECTIONS: Record<TerrainType, Direction | null> = {
  [TerrainType.SLOPE_N]: Direction.N,
  [TerrainType.SLOPE_S]: Direction.S,
  [TerrainType.SLOPE_E]: Direction.E,
  [TerrainType.SLOPE_W]: Direction.W,
  [TerrainType.SLOPE_NE]: Direction.NE,
  [TerrainType.SLOPE_NW]: Direction.NW,
  [TerrainType.SLOPE_SE]: Direction.SE,
  [TerrainType.SLOPE_SW]: Direction.SW,
  [TerrainType.ROUGH]: null,
  [TerrainType.FAIRWAY]: null,
  [TerrainType.SAND]: null,
  [TerrainType.WATER]: null,
  [TerrainType.TREE]: null,
  [TerrainType.HOLE]: null,
  [TerrainType.START]: null,
}
