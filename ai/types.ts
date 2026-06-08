import type { CourseConfig, Direction, Position } from "../src/engine/types.ts";

// ---- Metrics ----

export interface CourseMetrics {
  seed: string;
  optimalStrokes: number;
  routeCount: number;
  branchingFactor: number;
  hazardRelevance: number;
  deadCellRatio: number;
  chokePoints: number;
}

// ---- Play ratings ----

export interface PlayRating {
  strokes: number;
  decisionQuality: 1 | 2 | 3 | 4 | 5;
  tensionMoments: number;
  boringTurns: number;
  notes: string;
}

export interface PlayedCourse {
  seed: string;
  metrics: CourseMetrics;
  rating: PlayRating;
  moves: MoveRecord[];
}

export interface MoveRecord {
  turn: number;
  from: Position;
  roll: number;
  effectiveRoll: number;
  direction: Direction;
  to: Position;
  holedOut: boolean;
  reasoning: string;
}

// ---- Evaluator proposals ----

export interface ConfigProposal {
  field: keyof CourseConfig;
  currentValue: number;
  proposedValue: number;
  reasoning: string;
}

export interface ArchetypeProposal {
  name: string;
  description: string;
  keyFeature: string;
  whyBetter: string;
}

// ---- Iteration log ----

export interface IterationLog {
  iteration: number;
  config: CourseConfig;
  metricsDistribution: {
    mean: Record<string, number>;
    best: Record<string, number>;
  };
  playedCourses: PlayedCourse[];
  proposals: ConfigProposal[];
  archetypeIdeas: ArchetypeProposal[];
}

export interface RunLog {
  startedAt: string;
  model: string;
  iterations: IterationLog[];
  finalConfig: CourseConfig;
  allArchetypeIdeas: ArchetypeProposal[];
}

// ---- CLI options ----

export interface CliOptions {
  iterations: number;
  batchSize: number;
  playCount: number;
  model: string;
  resume?: string;
  apply?: boolean;
}
