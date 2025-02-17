import rand from 'pure-rand'

import { CourseObject, Tile } from '@/types'

interface Course {
  tiles: Tile[]
  objects: CourseObject[]
}

const isInCircle = (x: number, y: number, cx: number, cy: number, r: number) => (x - cx) ** 2 + (y - cy) ** 2 < r ** 2

export default function getCourse(width: number, height: number, seed: number): Course {
  const prng = rand.xoroshiro128plus(seed)
  const rngInt = (min: number, max: number) => rand.unsafeUniformIntDistribution(min, max, prng)

  const tee = { x: rngInt(0 + 1, width - 1), y: height - rngInt(2, 10), tile: Tile.Tee }
  const hole = { x: rngInt(0 + 1, width - 1), y: 2, tile: Tile.Hole }
  const objects = [tee, hole]

  const tiles: Tile[] = []
  const circles = [
    { x: hole.x, y: hole.y, r: rngInt(2, 5), type: Tile.Green },
    { x: tee.x, y: tee.y, r: rngInt(2, 5), type: Tile.Green },
  ]

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const overlappingCircle = circles.find(circle => isInCircle(x, y, circle.x, circle.y, circle.r))
      if (overlappingCircle) {
        tiles.push(Tile.Green)
        continue
      }

      tiles.push(Tile.Fairway)
    }
  }

  return { tiles, objects }
}
