// ---- Directions ----

export const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const DIRECTION_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  N: { dx: 0, dy: -1 },
  NE: { dx: 1, dy: -1 },
  E: { dx: 1, dy: 0 },
  SE: { dx: 1, dy: 1 },
  S: { dx: 0, dy: 1 },
  SW: { dx: -1, dy: 1 },
  W: { dx: -1, dy: 0 },
  NW: { dx: -1, dy: -1 },
};

// ---- Terrain ----

export enum Terrain {
  Rough = "rough",
  Fairway = "fairway",
  Sand = "sand",
  Water = "water",
  Trees = "trees",
}

export interface Cell {
  terrain: Terrain;
  slope: Direction | null;
}

// ---- Course ----

export interface Position {
  x: number;
  y: number;
}

export interface Course {
  grid: Cell[][];
  width: number;
  height: number;
  tee: Position;
  hole: Position;
  seed: string;
}

export interface CourseConfig {
  fairwayWidthMin: number;
  fairwayWidthMax: number;
  controlPoints: number;
  treeDensity: number;
  sandTrapCount: number;
  waterProbability: number;
  slopeCount: number;
}

export const DEFAULT_COURSE_CONFIG: CourseConfig = {
  fairwayWidthMin: 3,
  fairwayWidthMax: 5,
  controlPoints: 1,
  treeDensity: 0.15,
  sandTrapCount: 2,
  waterProbability: 0.5,
  slopeCount: 3,
};

export const GRID_WIDTH = 12;
export const GRID_HEIGHT = 18;
export const PAR = 6;

// ---- Events ----

export interface GameStartedEvent {
  type: "GameStarted";
  seed: string;
  gridWidth: number;
  gridHeight: number;
}

export interface DiceRolledEvent {
  type: "DiceRolled";
  value: number; // raw d6 result 1-6
}

export interface DirectionChosenEvent {
  type: "DirectionChosen";
  direction: Direction;
}

export interface PuttChosenEvent {
  type: "PuttChosen";
  direction: Direction;
}

export type GameEvent =
  | GameStartedEvent
  | DiceRolledEvent
  | DirectionChosenEvent
  | PuttChosenEvent;

// ---- Game State ----

export enum Phase {
  NotStarted = "not_started",
  AwaitingRoll = "awaiting_roll",
  AwaitingDirection = "awaiting_direction",
  HoledOut = "holed_out",
}

export interface ShotRecord {
  from: Position;
  to: Position;
}

export interface GameState {
  course: Course | null;
  ball: Position;
  phase: Phase;
  currentRoll: number | null; // effective roll after terrain modifier
  rawRoll: number | null; // die face before modifier
  stroke: number;
  par: number;
  shotHistory: ShotRecord[];
  isComplete: boolean;
}

// ---- Move validation ----

export interface MoveValid {
  valid: true;
  landingPosition: Position;
  holesOut: boolean;
  slopeChain: Position[]; // intermediate positions from slope rolls
}

export interface MoveInvalid {
  valid: false;
  reason: string;
}

export type MoveResult = MoveValid | MoveInvalid;
