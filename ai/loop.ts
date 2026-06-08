import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { OpenRouter } from "@openrouter/sdk";
import type { Course, CourseConfig } from "../src/engine/types.ts";
import { DEFAULT_COURSE_CONFIG } from "../src/engine/types.ts";
import { applyProposals, evaluate } from "./evaluator.ts";
import { filterAndRank, generateAndMeasureBatch } from "./metrics.ts";
import { playGame } from "./player.ts";
import type {
  ArchetypeProposal,
  CliOptions,
  ConfigProposal,
  CourseMetrics,
  IterationLog,
  PlayedCourse,
  RunLog,
} from "./types.ts";

// ---- Helpers ----

/** HTTP status codes that indicate a fatal, non-retryable API problem. */
const FATAL_STATUS_CODES = new Set([401, 402, 403]);

function isFatalApiError(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  if ("statusCode" in error && typeof (error as Record<string, unknown>).statusCode === "number") {
    return FATAL_STATUS_CODES.has((error as Record<string, unknown>).statusCode as number);
  }
  return false;
}

function getFatalErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error != null && typeof error === "object" && "body" in error) {
    return String((error as Record<string, unknown>).body);
  }
  return String(error);
}

function separator(): string {
  return "=".repeat(72);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeMetricsDistribution(batch: { course: Course; metrics: CourseMetrics }[]): {
  mean: Record<string, number>;
  best: Record<string, number>;
} {
  const keys: (keyof CourseMetrics)[] = [
    "optimalStrokes",
    "routeCount",
    "branchingFactor",
    "hazardRelevance",
    "deadCellRatio",
    "chokePoints",
  ];

  const meanValues: Record<string, number> = {};
  const bestValues: Record<string, number> = {};

  for (const key of keys) {
    const values = batch.map((b) => b.metrics[key] as number);
    meanValues[key] = round2(mean(values));

    // "best" = highest for branching/routes/hazardRelevance, lowest for deadCellRatio
    if (key === "deadCellRatio") {
      bestValues[key] = round2(Math.min(...values));
    } else {
      bestValues[key] = round2(Math.max(...values));
    }
  }

  return { mean: meanValues, best: bestValues };
}

function saveRunLog(filePath: string, runLog: RunLog): void {
  writeFileSync(filePath, JSON.stringify(runLog, null, 2));
}

// ---- Main loop ----

export async function runLoop(options: CliOptions): Promise<void> {
  // Validate API key
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("Error: OPENROUTER_API_KEY environment variable is not set.");
    process.exit(1);
  }

  const client = new OpenRouter({ apiKey });

  // Set up results directory
  const resultsDir = join(import.meta.dirname ?? ".", "results");
  mkdirSync(resultsDir, { recursive: true });

  // Resume or start fresh
  let runLog: RunLog;
  let outputPath: string;
  let startIteration: number;
  let config: CourseConfig;

  if (options.resume) {
    const resumeData = readFileSync(options.resume, "utf-8");
    runLog = JSON.parse(resumeData) as RunLog;
    outputPath = options.resume;
    startIteration = runLog.iterations.length + 1;
    config = runLog.finalConfig;
    console.log(`Resuming from ${options.resume}, iteration ${startIteration}`);
    console.log(`Previous config: ${JSON.stringify(config)}`);
  } else {
    config = { ...DEFAULT_COURSE_CONFIG };
    outputPath = join(resultsDir, `run-${Date.now()}.json`);
    startIteration = 1;
    runLog = {
      startedAt: new Date().toISOString(),
      model: options.model,
      iterations: [],
      finalConfig: config,
      allArchetypeIdeas: [],
    };
  }

  const startingConfig = { ...config };

  console.log(separator());
  console.log(
    `Starting loop: ${options.iterations} iterations, batch=${options.batchSize}, play=${options.playCount}`,
  );
  console.log(`Model: ${options.model}`);
  console.log(`Output: ${outputPath}`);
  console.log(separator());

  for (let i = startIteration; i <= options.iterations; i++) {
    console.log(`\n${separator()}`);
    console.log(`ITERATION ${i}/${options.iterations}`);
    console.log(`Config: ${JSON.stringify(config)}`);
    console.log(separator());

    // Step a: Generate batch
    console.log(`\nGenerating ${options.batchSize} courses...`);
    const batch = generateAndMeasureBatch(options.batchSize, i, config);

    // Step b: Log metrics distribution
    const distribution = computeMetricsDistribution(batch);
    console.log(`Metrics (mean): ${JSON.stringify(distribution.mean)}`);
    console.log(`Metrics (best): ${JSON.stringify(distribution.best)}`);

    // Step c: Filter to top N
    let filtered = filterAndRank(batch, options.playCount);
    console.log(`Filtered: ${filtered.length} courses passed (of ${batch.length})`);

    // Step d: Fallback if none pass
    if (filtered.length === 0) {
      console.log("No courses passed filtering - falling back to top 3 by branching factor");
      const sorted = [...batch].sort(
        (a, b) => b.metrics.branchingFactor - a.metrics.branchingFactor,
      );
      filtered = sorted.slice(0, 3);
    }

    // Step e: Play each filtered course
    const playedCourses: PlayedCourse[] = [];
    const courses: Course[] = [];

    for (const entry of filtered) {
      console.log(`\nPlaying course ${entry.course.seed}...`);
      try {
        const played = await playGame(client, options.model, entry.course, entry.metrics);
        playedCourses.push(played);
        courses.push(entry.course);
        console.log(
          `  Result: ${played.rating.strokes} strokes, decision quality ${played.rating.decisionQuality}/5`,
        );
      } catch (error: unknown) {
        if (isFatalApiError(error)) {
          console.error(`\nFatal API error: ${getFatalErrorMessage(error)}`);
          saveRunLog(outputPath, runLog);
          console.error(`Progress saved to ${outputPath}`);
          process.exit(1);
        }
        console.error(
          `  Error playing ${entry.course.seed}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    // Step f: Skip evaluation if no courses played
    if (playedCourses.length === 0) {
      console.log("\nNo courses played successfully - skipping evaluation");

      const iterLog: IterationLog = {
        iteration: i,
        config: { ...config },
        metricsDistribution: distribution,
        playedCourses: [],
        proposals: [],
        archetypeIdeas: [],
      };
      runLog.iterations.push(iterLog);
      runLog.finalConfig = config;
      saveRunLog(outputPath, runLog);
      console.log(`Progress saved to ${outputPath}`);
      continue;
    }

    // Log average decision quality
    const avgDecisionQuality = round2(mean(playedCourses.map((p) => p.rating.decisionQuality)));
    console.log(`\nAverage decision quality: ${avgDecisionQuality}/5`);

    // Step g: Evaluate
    console.log("\nEvaluating...");
    let proposals: ConfigProposal[];
    let archetypeIdeas: ArchetypeProposal[];
    try {
      const result = await evaluate(
        client,
        options.model,
        playedCourses,
        courses,
        config,
        runLog.iterations,
      );
      proposals = result.proposals;
      archetypeIdeas = result.archetypeIdeas;
    } catch (error: unknown) {
      if (isFatalApiError(error)) {
        console.error(`\nFatal API error: ${getFatalErrorMessage(error)}`);
        saveRunLog(outputPath, runLog);
        console.error(`Progress saved to ${outputPath}`);
        process.exit(1);
      }
      console.error("  Evaluation failed:", error instanceof Error ? error.message : error);
      proposals = [];
      archetypeIdeas = [];
    }

    // Step h: Apply proposals
    const nextConfig = applyProposals(config, proposals);

    // Step i: Log proposals and archetype ideas
    if (proposals.length > 0) {
      console.log("\nProposals:");
      for (const p of proposals) {
        console.log(`  ${p.field}: ${p.currentValue} -> ${p.proposedValue} (${p.reasoning})`);
      }
    } else {
      console.log("\nNo config changes proposed");
    }

    if (archetypeIdeas.length > 0) {
      console.log("\nArchetype ideas:");
      for (const a of archetypeIdeas) {
        console.log(`  ${a.name}: ${a.description}`);
      }
    }

    // Step j: Record iteration
    const iterLog: IterationLog = {
      iteration: i,
      config: { ...config },
      metricsDistribution: distribution,
      playedCourses,
      proposals,
      archetypeIdeas,
    };
    runLog.iterations.push(iterLog);
    runLog.finalConfig = nextConfig;
    runLog.allArchetypeIdeas.push(...archetypeIdeas);

    // Step k: Save progress
    saveRunLog(outputPath, runLog);
    console.log(`\nProgress saved to ${outputPath}`);

    // Update config for next iteration
    config = nextConfig;
  }

  // ---- Final summary ----

  console.log(`\n${separator()}`);
  console.log("FINAL SUMMARY");
  console.log(separator());

  console.log("\nStarting config:");
  console.log(JSON.stringify(startingConfig, null, 2));

  console.log("\nFinal config:");
  console.log(JSON.stringify(runLog.finalConfig, null, 2));

  console.log(`\nTotal archetype ideas: ${runLog.allArchetypeIdeas.length}`);
  for (const a of runLog.allArchetypeIdeas) {
    console.log(`  ${a.name}: ${a.description}`);
  }

  // Top 5 courses by decision quality
  const allPlayed = runLog.iterations.flatMap((iter) => iter.playedCourses);
  const topCourses = [...allPlayed]
    .sort((a, b) => b.rating.decisionQuality - a.rating.decisionQuality)
    .slice(0, 5);

  if (topCourses.length > 0) {
    console.log("\nTop 5 courses by decision quality:");
    for (const c of topCourses) {
      console.log(
        `  seed=${c.seed} quality=${c.rating.decisionQuality}/5 strokes=${c.rating.strokes} (?seed=${c.seed})`,
      );
    }
  }

  console.log(`\nResults saved to ${outputPath}`);
}
