import rand from 'pure-rand'

import { CourseObject, Tile } from '@/types'

interface Course {
  tiles: Tile[]
  objects: CourseObject[]
}

export default function getCourse(width: number, height: number, seed: number): Course {
  const prng = rand.xoroshiro128plus(seed)
  const rngInt = (min: number, max: number) => rand.unsafeUniformIntDistribution(min, max, prng)

  const tiles = Array.from({ length: width * height }, () => 0)

  const tee = { x: rngInt(0 + 1, width - 1), y: height - rngInt(2, 10), tile: Tile.Tee }
  const hole = { x: rngInt(0 + 1, width - 1), y: 2, tile: Tile.Hole }

  const objects = [tee, hole]

  return { tiles, objects }
}
