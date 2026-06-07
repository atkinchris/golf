import { generateCourse } from "./course";
import { type GameEvent, type GameState, PAR, Phase, type Terrain } from "./types";
import { getCell, getTerrainModifier, validateMove } from "./validation";

function initialState(): GameState {
  return {
    course: null,
    ball: { x: 0, y: 0 },
    phase: Phase.NotStarted,
    currentRoll: null,
    rawRoll: null,
    stroke: 0,
    par: PAR,
    shotHistory: [],
    isComplete: false,
  };
}

function applyEvent(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case "GameStarted": {
      const course = generateCourse(event.seed, event.gridWidth, event.gridHeight);
      return {
        ...state,
        course,
        ball: { ...course.tee },
        phase: Phase.AwaitingRoll,
        stroke: 0,
        shotHistory: [],
        isComplete: false,
        currentRoll: null,
        rawRoll: null,
      };
    }

    case "DiceRolled": {
      if (!state.course) return state;

      const cell = getCell(state.course, state.ball);
      if (!cell) return state;

      const modifier = getTerrainModifier(cell.terrain);
      const effective = Math.max(1, event.value + modifier);

      return {
        ...state,
        phase: Phase.AwaitingDirection,
        rawRoll: event.value,
        currentRoll: effective,
      };
    }

    case "DirectionChosen": {
      if (!state.course || state.currentRoll === null) return state;

      const result = validateMove(state.course, state.ball, event.direction, state.currentRoll);
      if (!result.valid) return state;

      const from = state.ball;
      const to = result.landingPosition;

      return {
        ...state,
        ball: to,
        phase: result.holesOut ? Phase.HoledOut : Phase.AwaitingRoll,
        stroke: state.stroke + 1,
        currentRoll: null,
        rawRoll: null,
        shotHistory: [...state.shotHistory, { from, to }],
        isComplete: result.holesOut,
      };
    }

    case "PuttChosen": {
      if (!state.course) return state;

      const result = validateMove(state.course, state.ball, event.direction, 1);
      if (!result.valid) return state;

      const from = state.ball;
      const to = result.landingPosition;

      return {
        ...state,
        ball: to,
        phase: result.holesOut ? Phase.HoledOut : Phase.AwaitingRoll,
        stroke: state.stroke + 1,
        currentRoll: null,
        rawRoll: null,
        shotHistory: [...state.shotHistory, { from, to }],
        isComplete: result.holesOut,
      };
    }
  }
}

/** Reduce a full event log into the current game state. */
export function reduce(events: GameEvent[]): GameState {
  let state = initialState();
  for (const event of events) {
    state = applyEvent(state, event);
  }
  return state;
}

/**
 * Get the effective roll for the ball's current terrain.
 * Useful for UI display before the reducer processes the roll.
 */
export function getEffectiveRoll(state: GameState, rawRoll: number): number {
  if (!state.course) return rawRoll;
  const cell = getCell(state.course, state.ball);
  if (!cell) return rawRoll;
  const modifier = getTerrainModifier(cell.terrain);
  return Math.max(1, rawRoll + modifier);
}

/** Get the terrain the ball is currently on. */
export function getBallTerrain(state: GameState): Terrain | null {
  if (!state.course) return null;
  const cell = getCell(state.course, state.ball);
  return cell?.terrain ?? null;
}
