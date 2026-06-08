# AI Course Iteration Loop

An autonomous tool that generates courses, has an LLM play them, and iterates on the generation config to find more interesting course designs.

## Problem

The dice golf game is not fun. Dice rolls dominate player decisions, courses are samey, and par-6 is easy or dull. This tool uses an LLM-in-the-loop to explore the `CourseConfig` parameter space and propose new course archetypes.

## How it works

Each iteration:

1. **Generate** a batch of courses with the current config (default 100)
2. **Measure** structural metrics - optimal path length, route diversity, branching factor, hazard relevance
3. **Filter** to the most promising candidates (default top 10)
4. **Play** each candidate via an LLM, which chooses directions each turn and rates the experience
5. **Evaluate** - a second LLM call synthesises across all played courses and proposes config changes + new archetype ideas
6. **Mutate** - apply the proposed changes (clamped to +/-30% per field, max 2 changes per iteration)
7. **Repeat** for N iterations

Results are saved to JSON after each iteration, so progress is never lost.

## Setup

Requires Node.js 20+ and an [OpenRouter](https://openrouter.ai) API key.

```sh
cd ai
npm install
```

## Usage

```sh
OPENROUTER_API_KEY=sk-or-... npm run iterate -- [options]
```

### Options

| Flag | Default | Description |
| --- | --- | --- |
| `--iterations` | 5 | Number of generate-play-evaluate cycles |
| `--batch-size` | 100 | Courses generated per iteration |
| `--play-count` | 10 | Courses played per iteration (after filtering) |
| `--model` | `anthropic/claude-sonnet-4` | OpenRouter model slug |
| `--resume` | - | Path to a previous run JSON to continue from |
| `--help` | - | Show help |

### Examples

Run 5 iterations with the default model:

```sh
OPENROUTER_API_KEY=sk-or-... npm run iterate
```

Cheaper/faster run with a smaller model:

```sh
OPENROUTER_API_KEY=sk-or-... npm run iterate -- --iterations 3 --batch-size 50 --play-count 5 --model anthropic/claude-haiku-3.5
```

Resume a previous run for 2 more iterations:

```sh
OPENROUTER_API_KEY=sk-or-... npm run iterate -- --resume results/run-1717836000000.json --iterations 2
```

## Output

Results are saved to `results/run-{timestamp}.json` (gitignored). Each run file contains:

- The config used at each iteration
- Metrics distributions per batch
- Every course played, with move-by-move records and LLM ratings
- Config change proposals with reasoning
- New archetype ideas

The final summary also prints the top-rated course seeds, which you can play in the browser by appending `?seed=...` to the game URL.

## Metrics

Computed per course with no LLM cost (BFS/graph analysis):

| Metric | What it measures |
| --- | --- |
| `optimalStrokes` | Minimum strokes to hole out (BFS shortest path) |
| `routeCount` | Distinct near-optimal paths (within +1 of optimal) |
| `branchingFactor` | Average valid directions per cell along the optimal path |
| `hazardRelevance` | % of hazards adjacent to a viable route |
| `deadCellRatio` | % of non-rough cells that are unreachable |
| `chokePoints` | Cells where all routes converge |

Courses are rejected if they have fewer than 3 optimal strokes, only 1 route, a branching factor below 1.5, or more than 50% dead cells.

## Tests

```sh
npm test
```

Verifies metrics computation, grid serialisation, batch generation, filtering, and deterministic reproducibility. Does not require an API key.
