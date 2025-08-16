import * as pureRand from 'pure-rand'
import type { Direction, Position, TerrainType, MoveValidation, Tile, SlopeDirection } from '../types/game'

// Simple dice rolling using pure-rand
let rng = pureRand.xoroshiro128plus(Date.now())

export function rollDice(): number {
  const [value, nextRng] = pureRand.uniformIntDistribution(1, 6)(rng)
  rng = nextRng
  return value
}

export function resetRandomSeed(seed: number = Date.now()): void {
  rng = pureRand.xoroshiro128plus(seed)
}

export function getDirectionDeltas(direction: Direction): Position {
  const deltas: Record<Direction, Position> = {
    north: { x: 0, y: -1 },
    south: { x: 0, y: 1 },
    east: { x: 1, y: 0 },
    west: { x: -1, y: 0 },
    northeast: { x: 1, y: -1 },
    northwest: { x: -1, y: -1 },
    southeast: { x: 1, y: 1 },
    southwest: { x: -1, y: 1 },
  }
  return deltas[direction]
}

export function calculateMovement(from: Position, direction: Direction, distance: number): Position {
  const delta = getDirectionDeltas(direction)
  return {
    x: from.x + delta.x * distance,
    y: from.y + delta.y * distance,
  }
}

export function getTerrainModifier(terrain: TerrainType): number {
  switch (terrain) {
    case 'fairway':
      return 1
    case 'sand':
      return -1
    case 'rough':
    case 'water':
    case 'trees':
    case 'slope':
    case 'hole':
    default:
      return 0
  }
}

export function validateMove(from: Position, to: Position, tiles: Tile[][], _distance: number): MoveValidation {
  // Check bounds
  if (to.x < 0 || to.x >= 32 || to.y < 0 || to.y >= 16) {
    return { isValid: false, reason: 'Out of bounds' }
  }

  // Check path for obstacles
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y))
  if (steps === 0) return { isValid: true, finalPosition: to }

  for (let i = 1; i <= steps; i++) {
    const checkX = from.x + Math.round((to.x - from.x) * (i / steps))
    const checkY = from.y + Math.round((to.y - from.y) * (i / steps))

    if (checkX < 0 || checkX >= 32 || checkY < 0 || checkY >= 16) {
      return { isValid: false, reason: 'Path goes out of bounds' }
    }

    const tile = tiles[checkY][checkX]

    // Can't land on water or trees (but can pass over water)
    if (i === steps && (tile.terrain === 'water' || tile.terrain === 'trees')) {
      return { isValid: false, reason: `Cannot land on ${tile.terrain}` }
    }

    // Trees block movement (except from fairway with driver)
    if (tile.terrain === 'trees' && i < steps) {
      const fromTile = tiles[from.y][from.x]
      if (fromTile.terrain !== 'fairway') {
        return { isValid: false, reason: 'Trees block movement', pathBlocked: true }
      }
    }
  }

  return { isValid: true, finalPosition: to }
}

// Handle slope mechanics - ball continues rolling until it reaches non-slope terrain
export function handleSlopeMovement(startPosition: Position, tiles: Tile[][], maxRolls: number = 10): Position {
  let currentPos = { ...startPosition }
  let rollCount = 0

  while (rollCount < maxRolls) {
    const currentTile = tiles[currentPos.y]?.[currentPos.x]
    if (!currentTile || currentTile.terrain !== 'slope' || !currentTile.slopeDirection) {
      break
    }

    // Calculate next position based on slope direction
    const slopeDeltas: Record<SlopeDirection, Position> = {
      n: { x: 0, y: -1 },
      s: { x: 0, y: 1 },
      e: { x: 1, y: 0 },
      w: { x: -1, y: 0 },
      ne: { x: 1, y: -1 },
      nw: { x: -1, y: -1 },
      se: { x: 1, y: 1 },
      sw: { x: -1, y: 1 },
    }

    const delta = slopeDeltas[currentTile.slopeDirection]
    const nextPos = {
      x: currentPos.x + delta.x,
      y: currentPos.y + delta.y,
    }

    // Check bounds
    if (nextPos.x < 0 || nextPos.x >= 32 || nextPos.y < 0 || nextPos.y >= 16) {
      break
    }

    const nextTile = tiles[nextPos.y][nextPos.x]

    // Stop if rolling into water
    if (nextTile.terrain === 'water') {
      break
    }

    // Stop if rolling into trees
    if (nextTile.terrain === 'trees') {
      break
    }

    currentPos = nextPos
    rollCount++

    // Special case: opposing slopes cancel out
    if (nextTile.terrain === 'slope' && nextTile.slopeDirection) {
      const opposingDirections: Record<SlopeDirection, SlopeDirection> = {
        n: 's',
        s: 'n',
        e: 'w',
        w: 'e',
        ne: 'sw',
        sw: 'ne',
        nw: 'se',
        se: 'nw',
      }

      if (opposingDirections[currentTile.slopeDirection] === nextTile.slopeDirection) {
        break
      }
    }
  }

  return currentPos
}

// Check if ball has reached the hole
export function checkHoleCompletion(ballPosition: Position, holePosition: Position): boolean {
  return ballPosition.x === holePosition.x && ballPosition.y === holePosition.y
}

// Calculate if ball overshoots hole by exactly 1 space (special rule)
export function checkHoleOvershoot(
  from: Position,
  to: Position,
  holePosition: Position
): { isOvershoot: boolean; correctedPosition?: Position } {
  // Check if we're moving in a straight line through the hole
  const dx = to.x - from.x
  const dy = to.y - from.y

  // Only check orthogonal and diagonal moves
  if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) {
    return { isOvershoot: false }
  }

  // Check if hole is on the path
  const steps = Math.max(Math.abs(dx), Math.abs(dy))
  if (steps === 0) return { isOvershoot: false }

  for (let i = 1; i <= steps; i++) {
    const checkX = from.x + Math.round((dx * i) / steps)
    const checkY = from.y + Math.round((dy * i) / steps)

    if (checkX === holePosition.x && checkY === holePosition.y) {
      // We're passing through the hole
      const distanceToHole = Math.max(Math.abs(checkX - from.x), Math.abs(checkY - from.y))
      const totalDistance = Math.max(Math.abs(dx), Math.abs(dy))

      // If we overshoot by exactly 1, stop at hole
      if (totalDistance === distanceToHole + 1) {
        return { isOvershoot: true, correctedPosition: holePosition }
      }
    }
  }

  return { isOvershoot: false }
}

export function isAdjacent(pos1: Position, pos2: Position): boolean {
  const dx = Math.abs(pos1.x - pos2.x)
  const dy = Math.abs(pos1.y - pos2.y)
  return dx <= 1 && dy <= 1 && (dx > 0 || dy > 0)
}

export function getDistance(pos1: Position, pos2: Position): number {
  return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y))
}
