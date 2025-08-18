/**
 * Rules engine for golf game mechanics
 */

import { RandomGenerator, createRandomGenerator } from './random'
import { Position, Direction, TerrainType, Move, GAME_CONSTANTS, DIRECTION_VECTORS } from './types'
import { Grid } from './grid'

export interface DiceRollResult {
  roll: number
  modifiedRoll: number
  modifier: number
}

export interface MoveValidation {
  valid: boolean
  reason?: string
  path?: Position[]
  finalPosition?: Position
  slopeRolls?: Position[]
}

export class RulesEngine {
  private rng: RandomGenerator

  constructor(seed?: number) {
    this.rng = createRandomGenerator(seed)
  }

  // Update the random seed
  public updateSeed(seed?: number): void {
    this.rng = createRandomGenerator(seed)
  }

  // Roll dice with terrain modifiers
  public rollDice(terrain: TerrainType): DiceRollResult {
    const baseRoll = this.rng.next(1, GAME_CONSTANTS.DICE_SIDES)
    const modifier = this.getTerrainModifier(terrain)
    const modifiedRoll = Math.max(0, baseRoll + modifier) // Can't go below 0

    return {
      roll: baseRoll,
      modifiedRoll,
      modifier,
    }
  }

  // Get terrain modifier for dice rolls
  private getTerrainModifier(terrain: TerrainType): number {
    switch (terrain) {
      case 'fairway':
        return 1
      case 'sandTrap':
        return -1
      case 'rough':
      case 'tee':
      case 'waterHazard':
      case 'trees':
      case 'slope':
      case 'hole':
        return 0
    }
  }

  // Validate if a move is legal
  public validateMove(
    grid: Grid,
    from: Position,
    direction: Direction,
    distance: number,
    isPutt: boolean = false
  ): MoveValidation {
    // Putt is always 1 space
    if (isPutt && distance !== 1) {
      return { valid: false, reason: 'Putt must move exactly 1 space' }
    }

    const fromTerrain = grid.getTerrain(from)
    if (fromTerrain === null) {
      return { valid: false, reason: 'Invalid starting position' }
    }

    // Calculate the path
    const path = grid.getPathPositions(from, direction, distance)
    if (path.length === 0) {
      return { valid: false, reason: 'No valid path in that direction' }
    }

    const finalPosition = path[path.length - 1]

    // Check if path is clear
    const pathCheck = grid.isPathClear(from, direction, distance, fromTerrain === 'fairway')
    if (!pathCheck.clear) {
      return { valid: false, reason: pathCheck.reason }
    }

    // Handle slope rolling after landing
    const slopeRolls = this.calculateSlopeRolls(grid, finalPosition)
    const actualFinalPosition = slopeRolls.length > 0 ? slopeRolls[slopeRolls.length - 1] : finalPosition

    return {
      valid: true,
      path,
      finalPosition: actualFinalPosition,
      slopeRolls: slopeRolls.length > 0 ? slopeRolls : undefined,
    }
  }

  // Calculate slope rolling after landing on a slope
  private calculateSlopeRolls(grid: Grid, startPosition: Position): Position[] {
    const slopeRolls: Position[] = []
    let currentPosition = startPosition
    const visitedPositions = new Set<string>()

    for (;;) {
      const terrain = grid.getTerrain(currentPosition)
      if (terrain !== 'slope') {
        break
      }

      const slopeDirection = grid.getSlopeDirection(currentPosition)
      if (!slopeDirection) {
        break
      }

      // Check for infinite loops (two arrows pointing at each other)
      const positionKey = `${String(currentPosition.row)},${String(currentPosition.col)}`
      if (visitedPositions.has(positionKey)) {
        break
      }
      visitedPositions.add(positionKey)

      // Calculate next position
      const vector = DIRECTION_VECTORS[slopeDirection]
      const nextPosition = {
        row: currentPosition.row + vector.row,
        col: currentPosition.col + vector.col,
      }

      // Check if next position is valid
      if (!grid.isValidPosition(nextPosition)) {
        break
      }

      const nextTerrain = grid.getTerrain(nextPosition)

      // Don't roll into water (rule from RULES.md)
      if (nextTerrain === 'waterHazard') {
        break
      }

      slopeRolls.push({ ...nextPosition })
      currentPosition = nextPosition

      // If we hit a non-slope, stop rolling
      if (nextTerrain !== 'slope') {
        break
      }
    }

    return slopeRolls
  }

  // Check if the game is won (ball is in hole or within 1 space overshoot)
  public checkWinCondition(grid: Grid, ballPosition: Position, lastMove?: Move): boolean {
    const holePosition = grid.findHolePosition()

    // Direct hit on hole
    if (ballPosition.row === holePosition.row && ballPosition.col === holePosition.col) {
      return true
    }

    // Check overshoot rule - if last move crossed over hole and ended within 1 space
    if (lastMove && this.didCrossHole(lastMove.path, holePosition)) {
      const distance = grid.getDistance(ballPosition, holePosition)
      return distance <= 1
    }

    return false
  }

  // Check if a path crossed over the hole
  private didCrossHole(path: readonly Position[], holePosition: Position): boolean {
    return path.some(pos => pos.row === holePosition.row && pos.col === holePosition.col)
  }

  // Get all valid directions from a position
  public getValidDirections(grid: Grid, from: Position, maxDistance: number): Direction[] {
    const validDirections: Direction[] = []
    const fromTerrain = grid.getTerrain(from)

    if (!fromTerrain) {
      return validDirections
    }

    for (const direction of Object.keys(DIRECTION_VECTORS) as Direction[]) {
      // Check if we can move at least 1 space in this direction
      const validation = this.validateMove(grid, from, direction, Math.min(1, maxDistance))
      if (validation.valid) {
        validDirections.push(direction)
      }
    }

    return validDirections
  }

  // Calculate final score
  public calculateScore(moveHistory: readonly Move[]): number {
    return moveHistory.length
  }

  // Check if position is on tee
  public isOnTee(grid: Grid, position: Position): boolean {
    const terrain = grid.getTerrain(position)
    return terrain === 'tee'
  }

  // Check if a putt move can sink the ball
  public canPuttToHole(grid: Grid, from: Position): Direction | null {
    const holePosition = grid.findHolePosition()

    // Check all directions for a 1-space putt to hole
    for (const direction of Object.keys(DIRECTION_VECTORS) as Direction[]) {
      const validation = this.validateMove(grid, from, direction, 1, true)
      if (validation.valid && validation.finalPosition) {
        const finalPos = validation.slopeRolls
          ? validation.slopeRolls[validation.slopeRolls.length - 1]
          : validation.finalPosition

        if (finalPos.row === holePosition.row && finalPos.col === holePosition.col) {
          return direction
        }
      }
    }

    return null
  }

  // Get terrain movement bonus for display
  public getTerrainMovementInfo(terrain: TerrainType): {
    modifier: number
    description: string
  } {
    switch (terrain) {
      case 'fairway':
        return { modifier: 1, description: '+1 to roll, can hit over trees' }
      case 'sandTrap':
        return { modifier: -1, description: '-1 to roll' }
      case 'rough':
        return { modifier: 0, description: 'Standard movement' }
      case 'waterHazard':
        return { modifier: 0, description: 'Cannot land in water' }
      case 'trees':
        return { modifier: 0, description: 'Cannot land on trees' }
      case 'slope':
        return { modifier: 0, description: 'Ball rolls in slope direction' }
      case 'hole':
        return { modifier: 0, description: 'Target destination' }
      case 'tee':
        return { modifier: 0, description: 'Starting position' }
      default:
        return { modifier: 0, description: 'Unknown terrain' }
    }
  }
}
