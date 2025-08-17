import { TerrainType, Position } from './types'

const TERRAIN_MAP: Record<string, TerrainType> = {
  '•': TerrainType.ROUGH,
  '▨': TerrainType.SAND,
  '~': TerrainType.WATER,
  '■': TerrainType.TREE,
  '▲': TerrainType.SLOPE_N,
  '▼': TerrainType.SLOPE_S,
  '►': TerrainType.SLOPE_E,
  '◄': TerrainType.SLOPE_W,
  '↗': TerrainType.SLOPE_NE,
  '↖': TerrainType.SLOPE_NW,
  '↘': TerrainType.SLOPE_SE,
  '↙': TerrainType.SLOPE_SW,
  '○': TerrainType.HOLE,
  '◉': TerrainType.START,
  ' ': TerrainType.FAIRWAY, // Empty space defaults to fairway
}

/**
 * Parse ASCII grid representation into a 2D terrain array
 * @param gridString ASCII representation of the golf course
 * @returns Object containing grid, start position, and hole position
 */
export function parseGrid(gridString: string): {
  grid: TerrainType[][]
  startPosition: Position
  holePosition: Position
} {
  const lines = gridString
    .split('\n')
    .map(line => line.replace(/^\/\/\s*\d+\s*/, '')) // Remove line numbers
    .filter(line => line.length > 0) // Keep lines with spaces

  const grid: TerrainType[][] = []
  let startPosition: Position | null = null
  let holePosition: Position | null = null

  for (let y = 0; y < lines.length; y++) {
    const line = lines[y]
    const row: TerrainType[] = []

    for (let x = 0; x < line.length; x++) {
      const char = line[x]
      const terrain = TERRAIN_MAP[char] ?? TerrainType.ROUGH

      row.push(terrain)

      if (terrain === TerrainType.START) {
        startPosition = { x, y }
      } else if (terrain === TerrainType.HOLE) {
        holePosition = { x, y }
      }
    }

    grid.push(row)
  }

  if (!startPosition) {
    throw new Error('No start position (◉) found in grid')
  }

  if (!holePosition) {
    throw new Error('No hole position (○) found in grid')
  }

  return {
    grid,
    startPosition,
    holePosition,
  }
}

/**
 * Convert grid back to ASCII representation for debugging
 * @param grid 2D terrain array
 * @param currentPosition Optional current ball position to mark
 * @returns ASCII string representation
 */
export function gridToString(grid: TerrainType[][], currentPosition?: Position): string {
  const reverseMap: Record<TerrainType, string> = {
    [TerrainType.ROUGH]: '•',
    [TerrainType.FAIRWAY]: ' ',
    [TerrainType.SAND]: '▨',
    [TerrainType.WATER]: '~',
    [TerrainType.TREE]: '■',
    [TerrainType.SLOPE_N]: '▲',
    [TerrainType.SLOPE_S]: '▼',
    [TerrainType.SLOPE_E]: '►',
    [TerrainType.SLOPE_W]: '◄',
    [TerrainType.SLOPE_NE]: '↗',
    [TerrainType.SLOPE_NW]: '↖',
    [TerrainType.SLOPE_SE]: '↘',
    [TerrainType.SLOPE_SW]: '↙',
    [TerrainType.HOLE]: '○',
    [TerrainType.START]: '◉',
  }

  return grid
    .map((row, y) =>
      row
        .map((terrain, x) => {
          // Mark current position with * if not on start/hole
          if (currentPosition && currentPosition.x === x && currentPosition.y === y) {
            if (terrain !== TerrainType.START && terrain !== TerrainType.HOLE) {
              return '*'
            }
          }
          return reverseMap[terrain]
        })
        .join('')
    )
    .join('\n')
}
