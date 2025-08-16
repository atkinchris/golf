import * as pureRand from 'pure-rand'
import type { Direction, Position, TerrainType, MoveValidation, Tile } from '../types/game'

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

export function validateMove(from: Position, to: Position, tiles: Tile[][], distance: number): MoveValidation {
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

export function isAdjacent(pos1: Position, pos2: Position): boolean {
  const dx = Math.abs(pos1.x - pos2.x)
  const dy = Math.abs(pos1.y - pos2.y)
  return dx <= 1 && dy <= 1 && (dx > 0 || dy > 0)
}

export function getDistance(pos1: Position, pos2: Position): number {
  return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y))
}
