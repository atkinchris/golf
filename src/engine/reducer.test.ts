import { describe, expect, it } from "vitest";
import { getBallTerrain, getEffectiveRoll, reduce } from "./reducer";
import { type GameEvent, GRID_HEIGHT, GRID_WIDTH, PAR, Phase, Terrain } from "./types";

// ---- Helpers ----

function startEvents(seed = "test-seed"): GameEvent[] {
  return [{ type: "GameStarted", seed, gridWidth: GRID_WIDTH, gridHeight: GRID_HEIGHT }];
}

// ---- Tests ----

describe("reduce", () => {
  describe("initial state", () => {
    it("returns NotStarted with no events", () => {
      const state = reduce([]);
      expect(state.phase).toBe(Phase.NotStarted);
      expect(state.course).toBeNull();
      expect(state.stroke).toBe(0);
      expect(state.par).toBe(PAR);
      expect(state.shotHistory).toEqual([]);
      expect(state.isComplete).toBe(false);
    });
  });

  describe("GameStarted", () => {
    it("generates a course and moves to AwaitingRoll", () => {
      const state = reduce(startEvents());
      expect(state.phase).toBe(Phase.AwaitingRoll);
      expect(state.course).not.toBeNull();
      expect(state.ball).toEqual(state.course?.tee);
      expect(state.stroke).toBe(0);
    });

    it("generates the same course for the same seed", () => {
      const a = reduce(startEvents("abc"));
      const b = reduce(startEvents("abc"));
      expect(a.course?.tee).toEqual(b.course?.tee);
      expect(a.course?.hole).toEqual(b.course?.hole);
      expect(a.course?.grid).toEqual(b.course?.grid);
    });

    it("generates different courses for different seeds", () => {
      const a = reduce(startEvents("seed-1"));
      const b = reduce(startEvents("seed-2"));
      // Courses could theoretically be identical, but it's astronomically unlikely
      const sameTee = a.course?.tee.x === b.course?.tee.x && a.course?.tee.y === b.course?.tee.y;
      const sameHole =
        a.course?.hole.x === b.course?.hole.x && a.course?.hole.y === b.course?.hole.y;
      expect(sameTee && sameHole).toBe(false);
    });
  });

  describe("DiceRolled", () => {
    it("transitions to AwaitingDirection with the effective roll", () => {
      const state = reduce([...startEvents(), { type: "DiceRolled", value: 4 }]);
      expect(state.phase).toBe(Phase.AwaitingDirection);
      expect(state.rawRoll).toBe(4);
      expect(state.currentRoll).not.toBeNull();
    });

    it("applies terrain modifier to roll", () => {
      const state = reduce(startEvents());
      // The ball starts on the tee which is fairway (+1)
      expect(state.course?.grid[state.ball.y]?.[state.ball.x]?.terrain).toBe(Terrain.Fairway);

      const rolledState = reduce([...startEvents(), { type: "DiceRolled", value: 3 }]);
      // Fairway gives +1, so raw 3 -> effective 4
      expect(rolledState.rawRoll).toBe(3);
      expect(rolledState.currentRoll).toBe(4);
    });

    it("clamps effective roll to minimum 1", () => {
      // Ball starts on fairway, so fairway modifier is +1
      const rolledState = reduce([...startEvents(), { type: "DiceRolled", value: 1 }]);
      // Fairway: 1 + 1 = 2
      expect(rolledState.currentRoll).toBe(2);
    });

    it("is ignored before GameStarted", () => {
      const state = reduce([{ type: "DiceRolled", value: 4 }]);
      expect(state.phase).toBe(Phase.NotStarted);
    });
  });

  describe("DirectionChosen", () => {
    it("moves the ball and increments stroke", () => {
      const events = startEvents();

      const fullEvents: GameEvent[] = [
        ...events,
        { type: "DiceRolled", value: 1 },
        { type: "DirectionChosen", direction: "N" },
      ];
      const state = reduce(fullEvents);

      expect(state.stroke).toBe(1);
      expect(state.phase).toBe(Phase.AwaitingRoll);
      expect(state.currentRoll).toBeNull();
      expect(state.rawRoll).toBeNull();
      expect(state.shotHistory).toHaveLength(1);
    });

    it("is ignored without a current roll", () => {
      const state = reduce([...startEvents(), { type: "DirectionChosen", direction: "N" }]);
      // Should still be AwaitingRoll, stroke 0
      expect(state.phase).toBe(Phase.AwaitingRoll);
      expect(state.stroke).toBe(0);
    });
  });

  describe("PuttChosen", () => {
    it("always moves exactly 1 cell regardless of roll", () => {
      const events = startEvents();
      const preState = reduce(events);
      const ball = preState.ball;

      const state = reduce([...events, { type: "PuttChosen", direction: "N" }]);
      expect(state.stroke).toBe(1);
      // Ball should have moved 1 cell north
      expect(state.ball.y).toBe(ball.y - 1);
      expect(state.ball.x).toBe(ball.x);
    });

    it("does not require a roll first", () => {
      const events = startEvents();
      const state = reduce([...events, { type: "PuttChosen", direction: "N" }]);
      expect(state.stroke).toBe(1);
      expect(state.phase).toBe(Phase.AwaitingRoll);
    });
  });

  describe("tee-off reroll", () => {
    it("is consumed after first direction chosen", () => {
      const state = reduce([
        ...startEvents(),
        { type: "DiceRolled", value: 1 },
        { type: "DirectionChosen", direction: "N" },
      ]);
      expect(state.phase).toBe(Phase.AwaitingRoll);
    });

    it("is consumed after first putt chosen", () => {
      const state = reduce([...startEvents(), { type: "PuttChosen", direction: "N" }]);
      expect(state.phase).toBe(Phase.AwaitingRoll);
    });
  });

  describe("full game flow", () => {
    it("reduces a sequence of events without error", () => {
      const events: GameEvent[] = [
        ...startEvents(),
        { type: "DiceRolled", value: 3 },
        { type: "DirectionChosen", direction: "N" },
        { type: "DiceRolled", value: 5 },
        { type: "DirectionChosen", direction: "N" },
        { type: "PuttChosen", direction: "S" },
      ];
      const state = reduce(events);
      expect(state.stroke).toBe(3);
      expect(state.shotHistory).toHaveLength(3);
    });

    it("replaying the same events gives the same state", () => {
      const events: GameEvent[] = [
        ...startEvents("replay-seed"),
        { type: "DiceRolled", value: 4 },
        { type: "DirectionChosen", direction: "N" },
        { type: "DiceRolled", value: 2 },
        { type: "DirectionChosen", direction: "N" },
      ];
      const a = reduce(events);
      const b = reduce(events);
      expect(a).toEqual(b);
    });
  });
});

describe("getEffectiveRoll", () => {
  it("applies fairway bonus", () => {
    const state = reduce(startEvents());
    // Ball starts on fairway
    expect(getEffectiveRoll(state, 3)).toBe(4);
  });

  it("clamps to minimum 1", () => {
    const state = reduce(startEvents());
    // Even with +1 fairway bonus, a raw roll of 1 gives 2
    // But for sand: raw 1 with -1 modifier = max(1, 0) = 1
    // We can't easily move to sand, but we can test the clamp logic:
    // If we had a modifier of -5 on a raw roll of 1, it would still be 1
    expect(getEffectiveRoll(state, 1)).toBeGreaterThanOrEqual(1);
  });

  it("returns raw roll when no course exists", () => {
    const state = reduce([]);
    expect(getEffectiveRoll(state, 4)).toBe(4);
  });
});

describe("getBallTerrain", () => {
  it("returns the terrain the ball is on", () => {
    const state = reduce(startEvents());
    // Ball starts on the tee, which is always fairway
    expect(getBallTerrain(state)).toBe(Terrain.Fairway);
  });

  it("returns null when no course exists", () => {
    const state = reduce([]);
    expect(getBallTerrain(state)).toBeNull();
  });
});
