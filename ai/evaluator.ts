import type { OpenRouter } from "@openrouter/sdk";
import type { Course, CourseConfig } from "../src/engine/types.ts";
import { serialiseCourse } from "./serialise.ts";
import type { ArchetypeProposal, ConfigProposal, IterationLog, PlayedCourse } from "./types.ts";

// ---- Bounds ----

const CONFIG_BOUNDS: Record<keyof CourseConfig, { min: number; max: number }> = {
  islandSizeMin: { min: 2, max: 8 },
  islandSizeMax: { min: 4, max: 12 },
  treeDensity: { min: 0.05, max: 0.4 },
  sandTrapCount: { min: 0, max: 6 },
  waterProbability: { min: 0.0, max: 1.0 },
  slopeCount: { min: 0, max: 8 },
};

const INT_FIELDS: Set<keyof CourseConfig> = new Set([
  "islandSizeMin",
  "islandSizeMax",
  "sandTrapCount",
  "slopeCount",
]);

// ---- Clamping ----

/** Enforce +/-30% change limit, absolute bounds, and type rounding. */
export function clampProposal(
  field: keyof CourseConfig,
  currentValue: number,
  proposedValue: number,
  _config: CourseConfig,
): number {
  const bounds = CONFIG_BOUNDS[field];

  // Enforce +/-30% change limit
  const maxDelta = Math.abs(currentValue) * 0.3;
  const clamped = Math.max(
    currentValue - maxDelta,
    Math.min(currentValue + maxDelta, proposedValue),
  );

  // Enforce absolute bounds
  let bounded = Math.max(bounds.min, Math.min(bounds.max, clamped));

  // Round appropriately
  if (INT_FIELDS.has(field)) {
    bounded = Math.round(bounded);
  } else {
    bounded = Math.round(bounded * 100) / 100;
  }

  return bounded;
}

// ---- Apply proposals ----

/** Create a new config with proposed values applied. */
export function applyProposals(config: CourseConfig, proposals: ConfigProposal[]): CourseConfig {
  const result = { ...config };
  for (const proposal of proposals) {
    result[proposal.field] = proposal.proposedValue;
  }
  return result;
}

// ---- Prompts ----

const SYSTEM_PROMPT = `You are an expert game designer evaluating a dice golf game.

PROBLEM: The game is not fun because dice rolls dominate player decisions, courses feel samey, and par-6 holes are too easy and dull.

Your job: analyse played courses and propose CourseConfig parameter changes to improve course quality. You also suggest new course archetype ideas.

CourseConfig parameters and their bounds:
- islandSizeMin (int): minimum island size, range 2-8
- islandSizeMax (int): maximum island size, range 4-12
- treeDensity (float): density of trees on the course, range 0.05-0.4
- sandTrapCount (int): number of sand traps, range 0-6
- waterProbability (float): probability of water hazards, range 0.0-1.0
- slopeCount (int): number of slopes on the course, range 0-8

RULES:
- Propose at most 2 config changes per evaluation
- Each change must be within +/-30% of the current value
- Respect the absolute bounds listed above
- Integer fields must have integer values
- Archetype ideas should be specific and describe a distinct course layout pattern

Respond with valid JSON only, in this exact format:
{
  "analysis": "Brief analysis of the played courses and current config",
  "configChanges": [
    {
      "field": "paramName",
      "currentValue": 0,
      "proposedValue": 0,
      "reasoning": "Why this change improves the game"
    }
  ],
  "archetypeIdeas": [
    {
      "name": "archetype-name",
      "description": "What this archetype looks like",
      "keyFeature": "The defining layout characteristic",
      "whyBetter": "Why this would improve gameplay"
    }
  ]
}`;

function buildUserPrompt(
  playedCourses: PlayedCourse[],
  courses: Course[],
  currentConfig: CourseConfig,
  previousIterations: IterationLog[],
): string {
  const sections: string[] = [];

  sections.push("## Current Config");
  sections.push("```json");
  sections.push(JSON.stringify(currentConfig, null, 2));
  sections.push("```");

  // Previous iterations history
  if (previousIterations.length > 0) {
    sections.push("\n## Previous Iterations");
    sections.push("Learn from these - do not repeat changes that had no positive effect.");
    for (const iter of previousIterations) {
      sections.push(`\n### Iteration ${iter.iteration}`);
      sections.push(`Config: ${JSON.stringify(iter.config)}`);
      sections.push(`Mean metrics: ${JSON.stringify(iter.metricsDistribution.mean)}`);
      if (iter.proposals.length > 0) {
        sections.push("Changes made:");
        for (const p of iter.proposals) {
          sections.push(`  - ${p.field}: ${p.currentValue} -> ${p.proposedValue} (${p.reasoning})`);
        }
      }
    }
  }

  // Played courses
  sections.push("\n## Played Courses");
  for (let i = 0; i < playedCourses.length; i++) {
    const played = playedCourses[i];
    if (!played) continue;
    const course = courses[i];
    sections.push(`\n### Course: ${played.seed}`);

    if (course) {
      sections.push("Grid:");
      sections.push("```");
      sections.push(serialiseCourse(course));
      sections.push("```");
    }

    sections.push(
      `Metrics: optimal=${played.metrics.optimalStrokes}, routes=${played.metrics.routeCount}, branching=${played.metrics.branchingFactor}, hazardRelevance=${played.metrics.hazardRelevance}, deadCells=${played.metrics.deadCellRatio}, chokes=${played.metrics.chokePoints}`,
    );
    sections.push(
      `Play rating: strokes=${played.rating.strokes}, decisionQuality=${played.rating.decisionQuality}/5, tensionMoments=${played.rating.tensionMoments}, boringTurns=${played.rating.boringTurns}`,
    );
    sections.push(`Notes: ${played.rating.notes}`);
  }

  return sections.join("\n");
}

// ---- JSON extraction ----

/** Extract the first JSON object from text, handling prose and markdown fencing. */
function extractJsonObject(text: string): string | null {
  const stripped = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "");
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

// ---- Response parsing ----

interface EvaluatorResponse {
  analysis?: string;
  configChanges?: Array<{
    field?: string;
    currentValue?: number;
    proposedValue?: number;
    reasoning?: string;
  }>;
  archetypeIdeas?: Array<{
    name?: string;
    description?: string;
    keyFeature?: string;
    whyBetter?: string;
  }>;
}

function parseResponse(
  raw: string,
  currentConfig: CourseConfig,
): { proposals: ConfigProposal[]; archetypeIdeas: ArchetypeProposal[] } {
  // Extract the first JSON object using brace-depth matching
  const jsonStr = extractJsonObject(raw);
  if (!jsonStr) {
    throw new SyntaxError("No JSON object found in response");
  }

  const parsed: EvaluatorResponse = JSON.parse(jsonStr);

  // Parse config changes
  const validFields = new Set(Object.keys(CONFIG_BOUNDS));
  const proposals: ConfigProposal[] = [];

  if (Array.isArray(parsed.configChanges)) {
    for (const change of parsed.configChanges.slice(0, 2)) {
      if (
        typeof change.field !== "string" ||
        !validFields.has(change.field) ||
        typeof change.proposedValue !== "number"
      ) {
        continue;
      }

      const field = change.field as keyof CourseConfig;
      const currentValue = currentConfig[field];
      const clampedValue = clampProposal(field, currentValue, change.proposedValue, currentConfig);

      proposals.push({
        field,
        currentValue,
        proposedValue: clampedValue,
        reasoning: change.reasoning ?? "",
      });
    }
  }

  // Parse archetype ideas
  const archetypeIdeas: ArchetypeProposal[] = [];

  if (Array.isArray(parsed.archetypeIdeas)) {
    for (const idea of parsed.archetypeIdeas) {
      if (typeof idea.name !== "string" || typeof idea.description !== "string") {
        continue;
      }

      archetypeIdeas.push({
        name: idea.name,
        description: idea.description,
        keyFeature: idea.keyFeature ?? "",
        whyBetter: idea.whyBetter ?? "",
      });
    }
  }

  return { proposals, archetypeIdeas };
}

// ---- Main evaluate function ----

/** Single LLM call that analyses played courses and proposes config changes and archetype ideas. */
export async function evaluate(
  client: OpenRouter,
  model: string,
  playedCourses: PlayedCourse[],
  courses: Course[],
  currentConfig: CourseConfig,
  previousIterations: IterationLog[],
): Promise<{ proposals: ConfigProposal[]; archetypeIdeas: ArchetypeProposal[] }> {
  const userPrompt = buildUserPrompt(playedCourses, courses, currentConfig, previousIterations);

  const response = await client.chat.send({
    chatRequest: {
      model,
      messages: [
        { role: "system" as const, content: SYSTEM_PROMPT },
        { role: "user" as const, content: userPrompt },
      ],
      temperature: 0.4,
      maxTokens: 4000,
      stream: false,
    },
  });

  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length === 0) {
    console.error("Evaluator: empty response from LLM");
    return { proposals: [], archetypeIdeas: [] };
  }

  try {
    return parseResponse(content, currentConfig);
  } catch (error) {
    console.error("Evaluator: failed to parse LLM response", error);
    console.error("Evaluator: raw response (last 300 chars):", content.slice(-300));
    return { proposals: [], archetypeIdeas: [] };
  }
}
