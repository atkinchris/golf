import { TerrainType } from './types'

/**
 * Converts the visual grid representation to terrain types
 * • = ROUGH
 * ▤ = FAIRWAY
 * ▨ = SAND
 * ~ = WATER
 * ■ = TREES
 * ○ = TEE (starting position)
 * ◉ = HOLE (target)
 * ▲ = SLOPE_N (points north)
 */
export const EXAMPLE_GRID: TerrainType[][] = [
  // Row 1: 01 •••• •••• •••• ••••
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
  ],

  // Row 2: 02 •••• •••• •••• ■•••
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
  ],

  // Row 3: 03 •••• •••• •••■ ■■■•
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
  ],

  // Row 4: 04 •••• •••• •••■ ■■■■
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
  ],

  // Row 5: 05 •••• •••• •▨▨■ ■■◉■
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.HOLE,
    TerrainType.TREES,
  ],

  // Row 6: 06 •••• •••• ▨▨▨▨ ■■■■
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
  ],

  // Row 7: 07 •••• •••▲ ▲▨▨▨ ■■■•
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.SLOPE_N,
    TerrainType.SLOPE_N,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
  ],

  // Row 8: 08 •••• •••• ▨▨▨▨ ■■■•
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
  ],

  // Row 9: 09 •••• •••• ▨▨▨▨ •■••
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.SAND,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
  ],

  // Row 10: 10 •••• •••■ ■▲▲• ••••
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.SLOPE_N,
    TerrainType.SLOPE_N,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
  ],

  // Row 11: 11 •••• ••■■ ■■•• ••••
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
  ],

  // Row 12: 12 •••• •••■ ■••▤ ▤▤▤•
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.ROUGH,
  ],

  // Row 13: 13 •••• •••• ••▤▤ ▤▤▤•
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.ROUGH,
  ],

  // Row 14: 14 •••• •••• •▤▤▤ ▤▤▤▤
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
  ],

  // Row 15: 15 •••• •••• ▤▤▤▤ ▤▤▤•
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.ROUGH,
  ],

  // Row 16: 16 •••• •••▤ ▤▤▤▤ ▤■■•
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
  ],

  // Row 17: 17 •••• •••▤ ▤▤▤▤ ▤■■■
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
  ],

  // Row 18: 18 ••■■ ■■■■ ▤▤▤▤ ■■■•
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.FAIRWAY,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
  ],

  // Row 19: 19 •■■■ ■■■■ ■••■ ■■■■
  [
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
  ],

  // Row 20: 20 •■■■ ■■■■ ■••■ ■■■•
  [
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
  ],

  // Row 21: 21 ••■■ ○■■■ •••• •■••
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TEE,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
  ],

  // Row 22: 22 ••■■ ■■■■ •••• ••••
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
  ],

  // Row 23: 23 ••■■ ■■■• •••• ••••
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
  ],

  // Row 24: 24 •••■ ■••• •••• ••••
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.TREES,
    TerrainType.TREES,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
  ],

  // Row 25: 25 •••• •••• •••• ••••
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
  ],

  // Row 26: 26 •••• •••• •••• ••••
  [
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
    TerrainType.ROUGH,
  ],
]

/**
 * Find the tee position (starting position) on the grid
 */
export function findTeePosition(grid: TerrainType[][]): { row: number; col: number } | null {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === TerrainType.TEE) {
        return { row, col }
      }
    }
  }
  return null
}

/**
 * Find the hole position (target) on the grid
 */
export function findHolePosition(grid: TerrainType[][]): { row: number; col: number } | null {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === TerrainType.HOLE) {
        return { row, col }
      }
    }
  }
  return null
}

/**
 * Check if a position is within the grid bounds
 */
export function isValidPosition(grid: TerrainType[][], position: { row: number; col: number }): boolean {
  return position.row >= 0 && position.row < grid.length && position.col >= 0 && position.col < grid[0].length
}

/**
 * Get terrain type at a specific position
 */
export function getTerrainAt(grid: TerrainType[][], position: { row: number; col: number }): TerrainType | null {
  if (!isValidPosition(grid, position)) {
    return null
  }
  return grid[position.row][position.col]
}
