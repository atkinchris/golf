import { runLoop } from "./loop.ts";
import type { CliOptions } from "./types.ts";

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    iterations: 5,
    batchSize: 100,
    playCount: 10,
    model: "deepseek/deepseek-v4-flash",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--iterations":
        options.iterations = parseInt(next ?? "5", 10);
        i++;
        break;
      case "--batch-size":
        options.batchSize = parseInt(next ?? "100", 10);
        i++;
        break;
      case "--play-count":
        options.playCount = parseInt(next ?? "10", 10);
        i++;
        break;
      case "--model":
        options.model = next ?? options.model;
        i++;
        break;
      case "--resume":
        options.resume = next;
        i++;
        break;
      case "--apply":
        options.apply = true;
        break;
      case "--help":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
dice-golf AI iteration loop

Usage: npm run iterate -- [options]

Options:
  --iterations <n>   Number of generate-play-evaluate cycles (default: 5)
  --batch-size <n>   Courses generated per iteration (default: 100)
  --play-count <n>   Courses played per iteration after filtering (default: 10)
  --model <slug>     OpenRouter model slug (default: anthropic/claude-sonnet-4)
  --resume <path>    Path to a previous run JSON file to continue from
  --apply            Write the final config back to src/engine/types.ts
  --help             Show this help message

Environment:
  OPENROUTER_API_KEY   Required. Your OpenRouter API key.

Examples:
  npm run iterate -- --iterations 3 --model anthropic/claude-sonnet-4
  npm run iterate -- --resume ai/results/run-1717836000000.json --iterations 2
`);
}

const options = parseArgs(process.argv.slice(2));

console.log("Dice Golf AI - Course Iteration Loop");
console.log("=====================================");
console.log(`Model: ${options.model}`);
console.log(`Iterations: ${options.iterations}`);
console.log(`Batch size: ${options.batchSize}`);
console.log(`Play count: ${options.playCount}`);
if (options.resume) console.log(`Resuming from: ${options.resume}`);
if (options.apply) console.log("Will apply final config to src/engine/types.ts");
console.log("");

runLoop(options).catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
