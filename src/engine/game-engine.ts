/* eslint-disable @typescript-eslint/no-unnecessary-condition, prefer-const */
import { TerrainType, Position, Direction, ClubType, GameState, GolfGameState, Move } from './types'
import { EXAMPLE_GRID, findTeePosition, findHolePosition, isValidPosition, getTerrainAt } from './grid'

/**
 * 8-directional movement vectors (including diagonals)
 */
export const DIRECTIONS: { [key: string]: Direction } = {
  N: { rowDelta: -1, colDelta: 0 },
  NE: { rowDelta: -1, colDelta: 1 },
  E: { rowDelta: 0, colDelta: 1 },
  SE: { rowDelta: 1, colDelta: 1 },
  S: { rowDelta: 1, colDelta: 0 },
  SW: { rowDelta: 1, colDelta: -1 },
  W: { rowDelta: 0, colDelta: -1 },
  NW: { rowDelta: -1, colDelta: -1 },
}

/**
 * Slope direction mappings
 */
export const SLOPE_DIRECTIONS: { [key in TerrainType]?: Direction } = {
  [TerrainType.SLOPE_N]: DIRECTIONS.N,
  [TerrainType.SLOPE_NE]: DIRECTIONS.NE,
  [TerrainType.SLOPE_E]: DIRECTIONS.E,
  [TerrainType.SLOPE_SE]: DIRECTIONS.SE,
  [TerrainType.SLOPE_S]: DIRECTIONS.S,
  [TerrainType.SLOPE_SW]: DIRECTIONS.SW,
  [TerrainType.SLOPE_W]: DIRECTIONS.W,
  [TerrainType.SLOPE_NW]: DIRECTIONS.NW,
}

/**
 * Golf Game Engine - manages game state and enforces rules
 */
export class GolfGameEngine {
  private grid: TerrainType[][]
  private gameState: GolfGameState
  private teePosition: Position
  private holePosition: Position

  constructor(grid?: TerrainType[][]) {
    this.grid = grid || EXAMPLE_GRID

    const tee = findTeePosition(this.grid)
    const hole = findHolePosition(this.grid)

    if (!tee || !hole) {
      throw new Error('Grid must contain both a tee (○) and hole (◉) position')
    }

    this.teePosition = tee
    this.holePosition = hole

    this.gameState = {
      currentPosition: { ...this.teePosition },
      moves: [],
      strokeCount: 0,
      mulligansUsed: 0,
      maxMulligans: 6,
      gameState: GameState.IN_PROGRESS,
      par: 6,
    }
  }

  /**
   * Get current game state
   */
  public getGameState(): GolfGameState {
    return { ...this.gameState }
  }

  /**
   * Reset the game to initial state
   */
  public reset(): void {
    this.gameState = {
      currentPosition: { ...this.teePosition },
      moves: [],
      strokeCount: 0,
      mulligansUsed: 0,
      maxMulligans: 6,
      gameState: GameState.IN_PROGRESS,
      par: 6,
    }
  }

  /**
   * Simulate a dice roll (1-6)
   */
  public rollDice(): number {
    return Math.floor(Math.random() * 6) + 1
  }

  /**
   * Calculate movement distance based on club, terrain, and dice roll
   */
  private calculateMovementDistance(club: ClubType, currentTerrain: TerrainType, diceRoll?: number): number {
    switch (club) {
      case ClubType.DRIVER:
        if (currentTerrain !== TerrainType.FAIRWAY && currentTerrain !== TerrainType.TEE) {
          return 0 // Driver can only be used from fairway/tee
        }
        return 6

      case ClubType.IRON:
        if (currentTerrain === TerrainType.SAND) {
          return 2
        }
        return 3

      case ClubType.PUTTER:
        return 1

      default:
        // Dice-based movement with terrain modifiers
        if (!diceRoll) return 0

        let distance = diceRoll
        if (currentTerrain === TerrainType.FAIRWAY || currentTerrain === TerrainType.TEE) {
          distance += 1 // +1 on fairway
        } else if (currentTerrain === TerrainType.SAND) {
          distance -= 1 // -1 on sand
        }

        return Math.max(0, distance)
    }
  }

  /**
   * Check if a path is clear between two positions
   */
  private isPathClear(from: Position, to: Position, club: ClubType): boolean {
    const fromTerrain = getTerrainAt(this.grid, from)
    if (!fromTerrain) return false

    const canGoOverTrees =
      club === ClubType.DRIVER || fromTerrain === TerrainType.FAIRWAY || fromTerrain === TerrainType.TEE

    // Calculate path using Bresenham's line algorithm
    const dx = Math.abs(to.col - from.col)
    const dy = Math.abs(to.row - from.row)
    const sx = from.col < to.col ? 1 : -1
    const sy = from.row < to.row ? 1 : -1
    let err = dx - dy

    let currentPos = { row: from.row, col: from.col }

    while (currentPos.row !== to.row || currentPos.col !== to.col) {
      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        currentPos.col += sx
      }
      if (e2 < dx) {
        err += dx
        currentPos.row += sy
      }

      // Check if we can pass through this position
      const terrain = getTerrainAt(this.grid, currentPos)
      if (!terrain) return false

      if (terrain === TerrainType.TREES && !canGoOverTrees) {
        return false
      }

      // We can travel over water but not land on it (will be checked separately)
    }

    return true
  }

  /**
   * Check if we can land on the target position
   */
  private canLandOn(position: Position): boolean {
    const terrain = getTerrainAt(this.grid, position)
    if (!terrain) return false

    // Cannot land on water or trees
    return terrain !== TerrainType.WATER && terrain !== TerrainType.TREES
  }

  /**
   * Apply slope effects after landing
   */
  private applySlope(position: Position): Position {
    let currentPos = { ...position }
    const visitedPositions = new Set<string>()

    while (true) {
      const terrain = getTerrainAt(this.grid, currentPos)
      if (terrain === null) break

      const positionKey = `${currentPos.row.toString()},${currentPos.col.toString()}`
      if (visitedPositions.has(positionKey)) {
        // Avoid infinite loops in case of conflicting slopes
        break
      }
      visitedPositions.add(positionKey)

      const slopeDirection = SLOPE_DIRECTIONS[terrain]
      if (!slopeDirection) break

      const nextPos = {
        row: currentPos.row + slopeDirection.rowDelta,
        col: currentPos.col + slopeDirection.colDelta,
      }

      // Check if next position is valid and not water
      if (!isValidPosition(this.grid, nextPos)) break
      const nextTerrain = getTerrainAt(this.grid, nextPos)
      if (!nextTerrain || nextTerrain === TerrainType.WATER) break

      currentPos = nextPos
    }

    return currentPos
  }

  /**
   * Check if ball reaches the hole (including overshoot rule)
   */
  private checkForHole(from: Position, to: Position): boolean {
    // Direct hit on hole
    if (to.row === this.holePosition.row && to.col === this.holePosition.col) {
      return true
    }

    // Check if path crosses over hole and we can overshoot by 1
    const pathCrossesHole = this.pathCrossesPosition(from, to, this.holePosition)
    if (pathCrossesHole) {
      const distanceToHole = Math.abs(to.row - this.holePosition.row) + Math.abs(to.col - this.holePosition.col)
      return distanceToHole <= 1
    }

    return false
  }

  /**
   * Check if a path crosses a specific position
   */
  private pathCrossesPosition(from: Position, to: Position, target: Position): boolean {
    // Simple line intersection check
    const dx = Math.abs(to.col - from.col)
    const dy = Math.abs(to.row - from.row)
    const sx = from.col < to.col ? 1 : -1
    const sy = from.row < to.row ? 1 : -1
    let err = dx - dy

    let currentPos = { row: from.row, col: from.col }

    while (currentPos.row !== to.row || currentPos.col !== to.col) {
      if (currentPos.row === target.row && currentPos.col === target.col) {
        return true
      }

      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        currentPos.col += sx
      }
      if (e2 < dx) {
        err += dx
        currentPos.row += sy
      }
    }

    return false
  }

  /**
   * Make a move with dice roll
   */
  public makeMove(direction: Direction, diceRoll: number, useMulligan: boolean = false): boolean {
    if (this.gameState.gameState !== GameState.IN_PROGRESS) {
      return false
    }

    if (useMulligan && this.gameState.mulligansUsed >= this.gameState.maxMulligans) {
      return false
    }

    const currentTerrain = getTerrainAt(this.grid, this.gameState.currentPosition)
    if (!currentTerrain) return false

    const distance = this.calculateMovementDistance(ClubType.IRON, currentTerrain, diceRoll)
    if (distance === 0) return false

    return this.executeMove(direction, distance, ClubType.IRON, diceRoll, useMulligan)
  }

  /**
   * Make a move with a specific club
   */
  public makeMoveWithClub(direction: Direction, club: ClubType, useMulligan: boolean = false): boolean {
    if (this.gameState.gameState !== GameState.IN_PROGRESS) {
      return false
    }

    if (useMulligan && this.gameState.mulligansUsed >= this.gameState.maxMulligans) {
      return false
    }

    const currentTerrain = getTerrainAt(this.grid, this.gameState.currentPosition)
    if (!currentTerrain) return false

    const distance = this.calculateMovementDistance(club, currentTerrain)
    if (distance === 0) return false

    return this.executeMove(direction, distance, club, undefined, useMulligan)
  }

  /**
   * Execute the actual move
   */
  private executeMove(
    direction: Direction,
    distance: number,
    club: ClubType,
    diceRoll?: number,
    useMulligan: boolean = false
  ): boolean {
    const targetPosition = {
      row: this.gameState.currentPosition.row + direction.rowDelta * distance,
      col: this.gameState.currentPosition.col + direction.colDelta * distance,
    }

    // Check if target position is valid
    if (!isValidPosition(this.grid, targetPosition)) {
      return false
    }

    // Check if path is clear
    if (!this.isPathClear(this.gameState.currentPosition, targetPosition, club)) {
      return false
    }

    // Check if we can land on target position
    if (!this.canLandOn(targetPosition)) {
      return false
    }

    // Check for hole before applying slopes
    const reachedHole = this.checkForHole(this.gameState.currentPosition, targetPosition)

    // Apply slope effects
    const finalPosition = reachedHole ? this.holePosition : this.applySlope(targetPosition)

    // Update game state
    this.gameState.strokeCount++
    if (useMulligan) {
      this.gameState.mulligansUsed++
    }

    const move: Move = {
      from: { ...this.gameState.currentPosition },
      to: finalPosition,
      club,
      diceRoll,
      strokeCount: this.gameState.strokeCount,
      mulliganUsed: useMulligan,
    }

    this.gameState.moves.push(move)
    this.gameState.currentPosition = finalPosition

    // Check if game is won
    if (reachedHole || (finalPosition.row === this.holePosition.row && finalPosition.col === this.holePosition.col)) {
      this.gameState.gameState = GameState.WON
    }

    return true
  }

  /**
   * Get available directions from current position
   */
  public getAvailableDirections(): string[] {
    return Object.keys(DIRECTIONS)
  }

  /**
   * Get current terrain type
   */
  public getCurrentTerrain(): TerrainType | null {
    return getTerrainAt(this.grid, this.gameState.currentPosition)
  }

  /**
   * Check if a specific club can be used from current position
   */
  public canUseClub(club: ClubType): boolean {
    const currentTerrain = this.getCurrentTerrain()
    if (!currentTerrain) return false

    if (club === ClubType.DRIVER) {
      return currentTerrain === TerrainType.FAIRWAY || currentTerrain === TerrainType.TEE
    }

    return true
  }

  /**
   * Get score relative to par
   */
  public getScore(): number {
    return this.gameState.strokeCount - this.gameState.par
  }

  /**
   * Check if game is completed
   */
  public isGameComplete(): boolean {
    return this.gameState.gameState === GameState.WON
  }
}
