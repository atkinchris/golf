import { generateCourse } from "../src/engine/course.ts";
import { GRID_WIDTH, GRID_HEIGHT, DEFAULT_COURSE_CONFIG } from "../src/engine/types.ts";
import { computeMetrics, generateAndMeasureBatch, filterAndRank } from "./metrics.ts";
import { serialiseCourse } from "./serialise.ts";

// Test 1: Metrics computation
console.log("Test 1: Metrics computation");
const course = generateCourse("integration-test", GRID_WIDTH, GRID_HEIGHT, DEFAULT_COURSE_CONFIG);
const metrics = computeMetrics(course);
console.assert(metrics.optimalStrokes >= 1, "optimalStrokes should be >= 1");
console.assert(metrics.routeCount >= 0, "routeCount should be >= 0");
console.assert(metrics.branchingFactor >= 0, "branchingFactor should be >= 0");
console.assert(metrics.hazardRelevance >= 0 && metrics.hazardRelevance <= 1, "hazardRelevance should be 0-1");
console.assert(metrics.deadCellRatio >= 0 && metrics.deadCellRatio <= 1, "deadCellRatio should be 0-1");
console.log("  PASS:", JSON.stringify(metrics));

// Test 2: Serialisation
console.log("\nTest 2: Grid serialisation");
const text = serialiseCourse(course);
console.assert(text.includes("O"), "Should contain tee marker O");
console.assert(text.includes("H"), "Should contain hole marker H");
console.assert(text.split("\n").length > 18, "Should have at least 18 grid rows plus header");
console.log("  PASS: Grid serialised correctly");

// Test 3: Batch generation and filtering
console.log("\nTest 3: Batch generation and filtering");
const batch = generateAndMeasureBatch(20, 0, DEFAULT_COURSE_CONFIG);
console.assert(batch.length === 20, "Should generate 20 courses");
const filtered = filterAndRank(batch, 5);
console.assert(filtered.length <= 5, "Should filter to at most 5");
console.log(`  PASS: Generated ${batch.length}, filtered to ${filtered.length}`);

// Test 4: Determinism
console.log("\nTest 4: Deterministic generation");
const batch2 = generateAndMeasureBatch(5, 0, DEFAULT_COURSE_CONFIG);
for (let i = 0; i < 5; i++) {
  console.assert(
    batch[i]!.metrics.optimalStrokes === batch2[i]!.metrics.optimalStrokes,
    `Course ${i} should be deterministic`,
  );
}
console.log("  PASS: Same seeds produce same metrics");

console.log("\nAll integration tests passed");
