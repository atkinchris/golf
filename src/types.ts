export enum Tile {
  Fairway = 0,
  Green = 1,
  Rough = 2,
  Water = 3,
  Tree = 4,
  Hole,
  Tee,
  Shot,
}

export interface CourseObject {
  x: number
  y: number
  tile: Tile
}
