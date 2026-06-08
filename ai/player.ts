import type { OpenRouter } from "@openrouter/sdk";
import type { ChatMessages } from "@openrouter/sdk/models";
import { PRNG } from "../src/engine/prng.ts";
import type { Course, Direction, Position } from "../src/engine/types.ts";
import { DIRECTIONS, Terrain } from "../src/engine/types.ts";
import { getCell, getTerrainModifier, validateMove } from "../src/engine/validation.ts";
import { serialiseCourse } from "./serialise.ts";
import type { CourseMetrics, MoveRecord, PlayedCourse, PlayRating } from "./types.ts";

// ---- Constants ----

const MAX_STROKES = 10; // par (6) + 4

const SYSTEM_PROMPT = `You are playing a mini-golf board game. Rules:
- Each turn you roll a d6 (1-6). Terrain modifies the roll: fairway +1, sand -1.
- You choose one of 8 compass directions: N, NE, E, SE, S, SW, W, NW.
- The ball moves exactly the effective roll distance in that direction.
- Trees block the path unless you are on fairway (fly over, but cannot land on trees).
- You cannot land in water.
- If the ball's path crosses or lands on the hole, you hole out. Overshoot by at most 1 is OK.
- Slopes push the ball one cell in their direction after landing (chain if consecutive).
- You may putt instead: move exactly 1 cell in any valid direction (ignores the dice roll).

Respond ONLY with JSON: {"direction": "N", "usePutt": false, "reasoning": "brief explanation"}`;

// ---- Helpers ----

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Extract the first JSON object from text that may include markdown fencing or prose. */
function extractJson(text: string): string | null {
  // Strip markdown code fences if present
  const stripped = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "");

  // Find the first { and match to its closing } (handles nesting)
  const start = stripped.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < stripped.length; i++) {
    if (stripped[i] === "{") depth++;
    else if (stripped[i] === "}") depth--;
    if (depth === 0) return stripped.slice(start, i + 1);
  }

  return null;
}

interface ParsedMove {
  direction: Direction;
  usePutt: boolean;
  reasoning: string;
}

/** Parse the LLM's move response, extracting direction and putt flag. */
function parseMove(response: string): ParsedMove | null {
  const json = extractJson(response);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const dir = parsed.direction;
    const usePutt = parsed.usePutt === true;
    const reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning : "";

    if (typeof dir !== "string") return null;
    const upper = dir.toUpperCase() as Direction;
    if (!(DIRECTIONS as readonly string[]).includes(upper)) return null;

    return { direction: upper, usePutt, reasoning };
  } catch {
    return null;
  }
}

/** Find valid directions for a given distance from a position. */
function getValidDirections(course: Course, from: Position, distance: number): Direction[] {
  return DIRECTIONS.filter((dir) => {
    const result = validateMove(course, from, dir, distance);
    return result.valid;
  });
}

/** Format the current game state for the LLM. */
function formatTurnPrompt(
  turn: number,
  ball: Position,
  roll: number,
  effectiveRoll: number,
  terrainName: string,
  validDirs: Direction[],
  puttDirs: Direction[],
  course: Course,
): string {
  const hole = course.hole;
  const dx = hole.x - ball.x;
  const dy = hole.y - ball.y;

  return [
    `Turn ${turn}: Ball at (${ball.x},${ball.y}), terrain: ${terrainName}`,
    `Dice roll: ${roll}, effective: ${effectiveRoll} (modifier: ${effectiveRoll - roll >= 0 ? "+" : ""}${effectiveRoll - roll})`,
    `Hole at (${hole.x},${hole.y}), offset: dx=${dx} dy=${dy}`,
    `Valid directions for roll ${effectiveRoll}: ${validDirs.length > 0 ? validDirs.join(", ") : "NONE"}`,
    `Valid putt directions (distance 1): ${puttDirs.length > 0 ? puttDirs.join(", ") : "NONE"}`,
    `Choose a direction. Respond with JSON: {"direction": "X", "usePutt": false, "reasoning": "..."}`,
  ].join("\n");
}

// ---- Chat helpers ----

async function chatCompletion(
  client: OpenRouter,
  model: string,
  messages: ChatMessages[],
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const result = await client.chat.send({
    chatRequest: {
      model,
      messages,
      temperature,
      maxTokens,
      stream: false,
    },
  });

  const content = result.choices[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

// ---- Rating ----

async function rateGame(
  client: OpenRouter,
  model: string,
  messages: ChatMessages[],
  moves: MoveRecord[],
  holed: boolean,
): Promise<PlayRating> {
  const movesSummary = moves
    .map(
      (m) =>
        `Turn ${m.turn}: (${m.from.x},${m.from.y})->${m.direction}${m.effectiveRoll === 1 ? "(putt)" : `(${m.effectiveRoll})`}->(${m.to.x},${m.to.y})${m.holedOut ? " HOLED!" : ""}`,
    )
    .join("\n");

  const ratingPrompt = [
    `The game is over. ${holed ? `Holed out in ${moves.length} strokes.` : `Failed to hole out after ${moves.length} strokes.`}`,
    `\nMove summary:\n${movesSummary}`,
    `\nRate this course as a play experience. Respond ONLY with JSON:`,
    `{"strokes": ${moves.length}, "decisionQuality": <1-5>, "tensionMoments": <count>, "boringTurns": <count>, "notes": "brief notes"}`,
  ].join("\n");

  const ratingMessages: ChatMessages[] = [...messages, { role: "user", content: ratingPrompt }];

  const response = await chatCompletion(client, model, ratingMessages, 0.2, 200);

  const json = extractJson(response);
  if (!json) {
    return {
      strokes: moves.length,
      decisionQuality: 3,
      tensionMoments: 0,
      boringTurns: 0,
      notes: "Failed to parse rating response",
    };
  }

  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return {
      strokes: typeof parsed.strokes === "number" ? parsed.strokes : moves.length,
      decisionQuality: clamp(
        typeof parsed.decisionQuality === "number" ? Math.round(parsed.decisionQuality) : 3,
        1,
        5,
      ) as 1 | 2 | 3 | 4 | 5,
      tensionMoments:
        typeof parsed.tensionMoments === "number" ? Math.round(parsed.tensionMoments) : 0,
      boringTurns: typeof parsed.boringTurns === "number" ? Math.round(parsed.boringTurns) : 0,
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
    };
  } catch {
    return {
      strokes: moves.length,
      decisionQuality: 3,
      tensionMoments: 0,
      boringTurns: 0,
      notes: "Failed to parse rating response",
    };
  }
}

// ---- Main game loop ----

/** Have an LLM play through a course, choosing directions each turn. */
export async function playGame(
  client: OpenRouter,
  model: string,
  course: Course,
  metrics: CourseMetrics,
): Promise<PlayedCourse> {
  const rng = new PRNG(`play-${course.seed}`);
  const moves: MoveRecord[] = [];
  let ball: Position = { ...course.tee };
  let holed = false;

  const messages: ChatMessages[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Here is the course:\n\n${serialiseCourse(course)}\n\nYou are at the tee (O). Get the ball to the hole (H). I will tell you your dice roll each turn.`,
    },
  ];

  for (let turn = 1; turn <= MAX_STROKES; turn++) {
    // Roll dice
    const roll = rng.int(1, 6);
    const cell = getCell(course, ball);
    const terrain = cell?.terrain ?? Terrain.Rough;
    const modifier = getTerrainModifier(terrain);
    const effectiveRoll = clamp(roll + modifier, 1, 6);

    // Compute valid directions
    const validDirs = getValidDirections(course, ball, effectiveRoll);
    const puttDirs = getValidDirections(course, ball, 1);

    // Format turn prompt
    const turnPrompt = formatTurnPrompt(
      turn,
      ball,
      roll,
      effectiveRoll,
      terrain,
      validDirs,
      puttDirs,
      course,
    );

    messages.push({ role: "user", content: turnPrompt });

    // Ask LLM
    const response = await chatCompletion(client, model, messages, 0.3, 150);
    messages.push({ role: "assistant" as const, content: response });

    // Parse and validate move
    const parsed = parseMove(response);

    let chosenDir: Direction;
    let usePutt: boolean;
    let reasoning: string;

    if (parsed) {
      usePutt = parsed.usePutt;
      reasoning = parsed.reasoning;
      const dirs = usePutt ? puttDirs : validDirs;

      if (dirs.includes(parsed.direction)) {
        chosenDir = parsed.direction;
      } else if (dirs.length > 0) {
        // LLM chose an invalid direction - fall back
        chosenDir = dirs[0] ?? "N";
        reasoning = `[fallback: ${parsed.direction} invalid] ${reasoning}`;
      } else {
        // No valid directions for chosen mode - try the other mode
        usePutt = !usePutt;
        const altDirs = usePutt ? puttDirs : validDirs;
        chosenDir = altDirs[0] ?? "N";
        reasoning = `[fallback: no valid moves in chosen mode] ${reasoning}`;
      }
    } else {
      // Parse failed entirely - fall back
      usePutt = false;
      if (validDirs.length > 0) {
        chosenDir = validDirs[0] ?? "N";
      } else if (puttDirs.length > 0) {
        chosenDir = puttDirs[0] ?? "N";
        usePutt = true;
      } else {
        chosenDir = "N";
      }
      reasoning = `[fallback: failed to parse LLM response] ${response.slice(0, 80)}`;
    }

    const distance = usePutt ? 1 : effectiveRoll;
    const moveResult = validateMove(course, ball, chosenDir, distance);

    if (moveResult.valid) {
      const record: MoveRecord = {
        turn,
        from: { ...ball },
        roll,
        effectiveRoll: distance,
        direction: chosenDir,
        to: moveResult.landingPosition,
        holedOut: moveResult.holesOut,
        reasoning,
      };
      moves.push(record);

      ball = moveResult.landingPosition;

      if (moveResult.holesOut) {
        holed = true;
        break;
      }
    } else {
      // Should not happen after fallback logic, but record a stalled turn
      moves.push({
        turn,
        from: { ...ball },
        roll,
        effectiveRoll: distance,
        direction: chosenDir,
        to: { ...ball },
        holedOut: false,
        reasoning: `[stuck: ${moveResult.reason}] ${reasoning}`,
      });
    }
  }

  const rating = await rateGame(client, model, messages, moves, holed);

  return {
    seed: course.seed,
    metrics,
    rating,
    moves,
  };
}
