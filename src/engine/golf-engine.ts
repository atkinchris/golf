import {
  GameState,
  Position,
  Direction,
  TerrainType,
  Move,
  MoveResult,
  ClubType,
  DIRECTION_VECTORS,
  SLOPE_DIRECTIONS,
} from './types'
import { parseGrid, gridToString } from './grid-parser'

export class GolfEngine {
  private state: GameState

  constructor(gridString: string, maxMulligans = 6, par = 6) {
    const { grid, startPosition, holePosition } = parseGrid(gridString)

    this.state = {
      grid,
      currentPosition: { ...startPosition },
      holePosition: { ...holePosition },
      startPosition: { ...startPosition },
      moves: [],
      strokeCount: 0,
      mullygansUsed: 0,
      maxMulligans,
      isGameWon: false,
      isGameLost: false,
      par,
    }
  }

  /**
   * Get current game state (read-only copy)
   */
  public getState(): Readonly<GameState> {
    return {
      ...this.state,
      grid: this.state.grid.map(row => [...row]),
      currentPosition: { ...this.state.currentPosition },
      holePosition: { ...this.state.holePosition },
      startPosition: { ...this.state.startPosition },
      moves: this.state.moves.map(move => ({ ...move })),
    }
  }

  /**
   * Check if a position is within grid bounds
   */
  private isInBounds(position: Position): boolean {
    return (
      position.y >= 0 &&
      position.y < this.state.grid.length &&
      position.x >= 0 &&
      position.x < this.state.grid[position.y].length
    )
  }

  /**
   * Get terrain at position
   */
  private getTerrainAt(position: Position): TerrainType {
    if (!this.isInBounds(position)) {
      return TerrainType.WATER // Out of bounds is treated as water
    }
    return this.state.grid[position.y][position.x]
  }

  /**
   * Calculate distance modifiers based on current terrain
   */
  private calculateDistanceModifier(diceRoll: number): number {
    const currentTerrain = this.getTerrainAt(this.state.currentPosition)

    switch (currentTerrain) {
      case TerrainType.FAIRWAY:
      case TerrainType.START: // Start position counts as fairway
        return diceRoll + 1
      case TerrainType.SAND:
        return Math.max(1, diceRoll - 1)
      case TerrainType.ROUGH:
      case TerrainType.WATER:
      case TerrainType.TREE:
      case TerrainType.SLOPE_N:
      case TerrainType.SLOPE_S:
      case TerrainType.SLOPE_E:
      case TerrainType.SLOPE_W:
      case TerrainType.SLOPE_NE:
      case TerrainType.SLOPE_NW:
      case TerrainType.SLOPE_SE:
      case TerrainType.SLOPE_SW:
      case TerrainType.HOLE:
        return diceRoll
    }
  }

  /**
   * Check if movement path is clear
   */
  private isPathClear(from: Position, to: Position, canGoOverTrees: boolean): boolean {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const steps = Math.max(Math.abs(dx), Math.abs(dy))

    if (steps === 0) return true

    const stepX = dx / steps
    const stepY = dy / steps

    // Check each point along the path (excluding start and end)
    for (let i = 1; i < steps; i++) {
      const checkX = Math.round(from.x + stepX * i)
      const checkY = Math.round(from.y + stepY * i)
      const checkPos = { x: checkX, y: checkY }

      if (!this.isInBounds(checkPos)) {
        continue // Can travel over out-of-bounds (water)
      }

      const terrain = this.getTerrainAt(checkPos)

      if (terrain === TerrainType.TREE && !canGoOverTrees) {
        return false
      }
    }

    return true
  }

  /**
   * Check if landing position is valid
   */
  private isValidLanding(position: Position): boolean {
    if (!this.isInBounds(position)) {
      return false // Can't land out of bounds
    }

    const terrain = this.getTerrainAt(position)
    return terrain !== TerrainType.WATER && terrain !== TerrainType.TREE
  }

  /**
   * Apply slope effects, moving ball until it reaches non-slope terrain
   */
  private applySlopes(startPosition: Position): { finalPosition: Position; slopesTriggered: Position[] } {
    let currentPos = { ...startPosition }
    const slopesTriggered: Position[] = []
    const visitedSlopes = new Set<string>()
    const maxIterations = 100 // Prevent infinite loops

    for (let i = 0; i < maxIterations; i++) {
      const terrain = this.getTerrainAt(currentPos)
      const slopeDirection = SLOPE_DIRECTIONS[terrain]

      if (slopeDirection === null) {
        break // No more slopes
      }

      const posKey = `${currentPos.x.toString()},${currentPos.y.toString()}`
      if (visitedSlopes.has(posKey)) {
        // Avoid infinite loops - stop if we've seen this slope before
        break
      }

      visitedSlopes.add(posKey)
      slopesTriggered.push({ ...currentPos })

      const vector = DIRECTION_VECTORS[slopeDirection]
      const nextPos = {
        x: currentPos.x + vector.x,
        y: currentPos.y + vector.y,
      }

      // Check if slope would send ball into water - if so, ignore the slope
      if (this.getTerrainAt(nextPos) === TerrainType.WATER) {
        break
      }

      // If next position is out of bounds or invalid, stop
      if (!this.isInBounds(nextPos) || !this.isValidLanding(nextPos)) {
        break
      }

      currentPos = nextPos
    }

    return { finalPosition: currentPos, slopesTriggered }
  }

  /**
   * Calculate target position based on direction and distance
   */
  private calculateTargetPosition(from: Position, direction: Direction, distance: number): Position {
    const vector = DIRECTION_VECTORS[direction]
    return {
      x: from.x + vector.x * distance,
      y: from.y + vector.y * distance,
    }
  }

  /**
   * Check if ball crosses over hole during movement
   */
  private checkHoleCrossing(from: Position, to: Position): boolean {
    const hole = this.state.holePosition

    // Simple line intersection check
    const dx = to.x - from.x
    const dy = to.y - from.y
    const steps = Math.max(Math.abs(dx), Math.abs(dy))

    if (steps === 0) return false

    const stepX = dx / steps
    const stepY = dy / steps

    for (let i = 0; i <= steps; i++) {
      const checkX = Math.round(from.x + stepX * i)
      const checkY = Math.round(from.y + stepY * i)

      if (checkX === hole.x && checkY === hole.y) {
        return true
      }
    }

    return false
  }

  /**
   * Attempt a move with specified direction and distance
   */
  public attemptMove(direction: Direction, distance: number, useMulligan = false): MoveResult {
    if (this.state.isGameWon || this.state.isGameLost) {
      return { success: false, message: 'Game is already finished' }
    }

    if (useMulligan && this.state.mullygansUsed >= this.state.maxMulligans) {
      return { success: false, message: 'No mulligans remaining' }
    }

    const currentTerrain = this.getTerrainAt(this.state.currentPosition)
    const canGoOverTrees = currentTerrain === TerrainType.FAIRWAY || currentTerrain === TerrainType.START

    // Apply terrain modifiers to distance
    const modifiedDistance = this.calculateDistanceModifier(distance)
    const targetPosition = this.calculateTargetPosition(this.state.currentPosition, direction, modifiedDistance)

    // Check path clearance
    if (!this.isPathClear(this.state.currentPosition, targetPosition, canGoOverTrees)) {
      return { success: false, message: 'Path blocked by trees' }
    }

    // Check landing validity
    if (!this.isValidLanding(targetPosition)) {
      return { success: false, message: 'Cannot land in water or trees' }
    }

    // Check for hole crossing (can overshoot by 1)
    const crossesHole = this.checkHoleCrossing(this.state.currentPosition, targetPosition)
    const distanceToHole =
      Math.abs(targetPosition.x - this.state.holePosition.x) + Math.abs(targetPosition.y - this.state.holePosition.y)

    if (crossesHole && distanceToHole <= 1) {
      // Ball goes in the hole!
      this.executeMove(this.state.currentPosition, this.state.holePosition, direction, modifiedDistance, useMulligan)
      this.state.isGameWon = true
      return {
        success: true,
        newPosition: this.state.holePosition,
        finalPosition: this.state.holePosition,
        message: 'Ball in hole! You win!',
      }
    }

    // Apply slope effects
    const { finalPosition, slopesTriggered } = this.applySlopes(targetPosition)

    // Execute the move
    this.executeMove(this.state.currentPosition, targetPosition, direction, modifiedDistance, useMulligan)

    // Update position to final position after slopes
    this.state.currentPosition = finalPosition

    // Check if final position is the hole
    if (finalPosition.x === this.state.holePosition.x && finalPosition.y === this.state.holePosition.y) {
      this.state.isGameWon = true
      return {
        success: true,
        newPosition: targetPosition,
        finalPosition,
        message: 'Ball in hole! You win!',
        slopesTriggered,
      }
    }

    return {
      success: true,
      newPosition: targetPosition,
      finalPosition,
      slopesTriggered,
    }
  }

  /**
   * Execute a move (internal method)
   */
  private executeMove(
    from: Position,
    to: Position,
    direction: Direction,
    distance: number,
    usedMulligan: boolean
  ): void {
    this.state.strokeCount++

    if (usedMulligan) {
      this.state.mullygansUsed++
    }

    const move: Move = {
      from: { ...from },
      to: { ...to },
      direction,
      distance,
      strokeNumber: this.state.strokeCount,
    }

    this.state.moves.push(move)
    this.state.currentPosition = { ...to }
  }

  /**
   * Putt (always move 1 space, ignoring terrain modifiers)
   */
  public putt(direction: Direction, useMulligan = false): MoveResult {
    if (this.state.isGameWon || this.state.isGameLost) {
      return { success: false, message: 'Game is already finished' }
    }

    if (useMulligan && this.state.mullygansUsed >= this.state.maxMulligans) {
      return { success: false, message: 'No mulligans remaining' }
    }

    // Putt always moves exactly 1 space, regardless of terrain modifiers
    const targetPosition = this.calculateTargetPosition(this.state.currentPosition, direction, 1)

    // Check landing validity
    if (!this.isValidLanding(targetPosition)) {
      return { success: false, message: 'Cannot land in water or trees' }
    }

    // Check for hole crossing (can overshoot by 1)
    const crossesHole = this.checkHoleCrossing(this.state.currentPosition, targetPosition)
    const distanceToHole =
      Math.abs(targetPosition.x - this.state.holePosition.x) +
      Math.abs(targetPosition.y - this.state.holePosition.y)

    if (crossesHole && distanceToHole <= 1) {
      // Ball goes in the hole!
      this.executeMove(this.state.currentPosition, this.state.holePosition, direction, 1, useMulligan)
      this.state.isGameWon = true
      return {
        success: true,
        newPosition: this.state.holePosition,
        finalPosition: this.state.holePosition,
        message: 'Ball in hole! You win!',
      }
    }

    // Apply slope effects
    const { finalPosition, slopesTriggered } = this.applySlopes(targetPosition)

    // Execute the move
    this.executeMove(this.state.currentPosition, targetPosition, direction, 1, useMulligan)

    // Update position to final position after slopes
    this.state.currentPosition = finalPosition

    // Check if final position is the hole
    if (finalPosition.x === this.state.holePosition.x && finalPosition.y === this.state.holePosition.y) {
      this.state.isGameWon = true
      return {
        success: true,
        newPosition: targetPosition,
        finalPosition,
        message: 'Ball in hole! You win!',
        slopesTriggered,
      }
    }

    return {
      success: true,
      newPosition: targetPosition,
      finalPosition,
      slopesTriggered,
    }
  }

  /**
   * Use a specific club
   */
  public useClub(club: ClubType, direction: Direction, distance?: number, useMulligan = false): MoveResult {
    const currentTerrain = this.getTerrainAt(this.state.currentPosition)

    switch (club) {
      case ClubType.DRIVER:
        if (currentTerrain !== TerrainType.FAIRWAY && currentTerrain !== TerrainType.START) {
          return { success: false, message: 'Driver can only be used from fairway' }
        }
        return this.attemptMove(direction, 6, useMulligan)

      case ClubType.IRON:
        const ironDistance = currentTerrain === TerrainType.SAND ? 2 : 3
        return this.attemptMove(direction, ironDistance, useMulligan)

      case ClubType.PUTTER:
        return this.putt(direction, useMulligan)

      default:
        return { success: false, message: 'Invalid club type' }
    }
  }

  /**
   * Reset game to initial state
   */
  public reset(): void {
    this.state.currentPosition = { ...this.state.startPosition }
    this.state.moves = []
    this.state.strokeCount = 0
    this.state.mullygansUsed = 0
    this.state.isGameWon = false
    this.state.isGameLost = false
  }

  /**
   * Get current score relative to par
   */
  public getScore(): number {
    return this.state.strokeCount - this.state.par
  }

  /**
   * Get remaining mulligans
   */
  public getRemainingMulligans(): number {
    return this.state.maxMulligans - this.state.mullygansUsed
  }

  /**
   * Get ASCII representation of current game state
   */
  public toString(): string {
    return gridToString(this.state.grid, this.state.currentPosition)
  }
}
