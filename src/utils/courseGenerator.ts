import type { Course, Tile, TerrainType, Position, SlopeDirection } from '../types/game'

// Simple course generator - creates a basic course with various terrain types
export function generateBasicCourse(): Course {
  const width = 32
  const height = 16
  const tiles: Tile[][] = []

  // Initialize with rough terrain
  for (let y = 0; y < height; y++) {
    tiles[y] = []
    for (let x = 0; x < width; x++) {
      tiles[y][x] = {
        position: { x, y },
        terrain: 'rough',
      }
    }
  }

  // Add fairway - main path through the course
  const fairwayPath = [
    { start: { x: 1, y: 0 }, end: { x: 5, y: 3 } },
    { start: { x: 5, y: 3 }, end: { x: 12, y: 8 } },
    { start: { x: 12, y: 8 }, end: { x: 20, y: 12 } },
    { start: { x: 20, y: 12 }, end: { x: 28, y: 15 } },
  ]

  fairwayPath.forEach(segment => {
    const steps = Math.max(Math.abs(segment.end.x - segment.start.x), Math.abs(segment.end.y - segment.start.y))

    for (let i = 0; i <= steps; i++) {
      const x = Math.round(segment.start.x + (segment.end.x - segment.start.x) * (i / steps))
      const y = Math.round(segment.start.y + (segment.end.y - segment.start.y) * (i / steps))

      if (x >= 0 && x < width && y >= 0 && y < height) {
        tiles[y][x].terrain = 'fairway'

        // Add some width to fairway
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && tiles[ny][nx].terrain === 'rough') {
              tiles[ny][nx].terrain = 'fairway'
            }
          }
        }
      }
    }
  })

  // Add sand traps
  const sandTraps = [
    { x: 8, y: 4, radius: 2 },
    { x: 15, y: 10, radius: 1 },
    { x: 25, y: 6, radius: 2 },
  ]

  sandTraps.forEach(trap => {
    for (let dx = -trap.radius; dx <= trap.radius; dx++) {
      for (let dy = -trap.radius; dy <= trap.radius; dy++) {
        const x = trap.x + dx
        const y = trap.y + dy
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance <= trap.radius) {
            tiles[y][x].terrain = 'sand'
          }
        }
      }
    }
  })

  // Add water hazards
  const waterHazards = [
    { start: { x: 6, y: 6 }, end: { x: 10, y: 9 } },
    { start: { x: 18, y: 2 }, end: { x: 22, y: 5 } },
  ]

  waterHazards.forEach(hazard => {
    for (let x = hazard.start.x; x <= hazard.end.x; x++) {
      for (let y = hazard.start.y; y <= hazard.end.y; y++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          tiles[y][x].terrain = 'water'
        }
      }
    }
  })

  // Add trees
  const treePositions = [
    { x: 3, y: 7 },
    { x: 4, y: 7 },
    { x: 3, y: 8 },
    { x: 14, y: 4 },
    { x: 15, y: 4 },
    { x: 16, y: 4 },
    { x: 27, y: 8 },
    { x: 28, y: 8 },
    { x: 29, y: 8 },
  ]

  treePositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].terrain = 'trees'
    }
  })

  // Add slopes
  const slopes = [
    { x: 11, y: 6, direction: 'se' as SlopeDirection },
    { x: 17, y: 11, direction: 'ne' as SlopeDirection },
    { x: 23, y: 3, direction: 'sw' as SlopeDirection },
  ]

  slopes.forEach(slope => {
    if (slope.x >= 0 && slope.x < width && slope.y >= 0 && slope.y < height) {
      tiles[slope.y][slope.x].terrain = 'slope'
      tiles[slope.y][slope.x].slopeDirection = slope.direction
    }
  })

  // Set hole position
  const holePosition: Position = { x: 30, y: 14 }
  tiles[holePosition.y][holePosition.x].terrain = 'hole'

  return {
    width,
    height,
    tiles,
    holePosition,
  }
}
