import rand from 'pure-rand'

import { CourseObject, Tile } from '@/types'

interface Course {
  tiles: Tile[]
  objects: CourseObject[]
}

interface Region {
  x: number
  y: number
  rx: number
  ry: number
  tile: Tile
}

function isInRegion(x: number, y: number, region: Region): boolean {
  const { x: cx, y: cy, rx, ry } = region
  return (x - cx) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2 < 1
}

export default function getCourse(width: number, height: number, seed: number): Course {
  const prng = rand.xoroshiro128plus(seed)
  const rngInt = (min: number, max: number) => rand.unsafeUniformIntDistribution(min, max, prng)

  const tee = { x: rngInt(0 + 1, width - 1), y: height - rngInt(2, 10), tile: Tile.Tee }
  const hole = { x: rngInt(0 + 1, width - 1), y: 2, tile: Tile.Hole }
  const objects = [tee, hole]

  const tiles: Tile[] = []
  const regions = [
    { x: hole.x, y: hole.y, rx: rngInt(2, 4), ry: rngInt(2, 4), tile: Tile.Green },
    { x: tee.x, y: tee.y, rx: rngInt(2, 4), ry: rngInt(2, 4), tile: Tile.Green },
  ]

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const overlap = regions.find(region => isInRegion(x, y, region))
      tiles.push(overlap ? overlap.tile : Tile.Fairway)
    }
  }

  return { tiles, objects }
}
