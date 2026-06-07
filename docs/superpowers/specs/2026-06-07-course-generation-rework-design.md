# Course Generation Rework - Island-Based Archetypes

## Goal

Replace the continuous fairway spine algorithm with an archetype-based island layout system that creates navigation puzzles - courses where the core decision is "which route do I take?" rather than "just keep hitting forward."

## Context

The current algorithm generates a single continuous fairway from tee to hole using spine interpolation with widening. Hazards are placed alongside the fairway as incidental obstacles. This produces courses where direction choice is trivial - you always aim roughly towards the hole.

The tabletop reference game uses disconnected fairway islands, large blocking hazards, and multiple viable routes. The digital version should match this feel: blocky grid-aligned shapes, deliberate barriers, and 2-3 plausible paths per hole.

## Architecture

### Public API (unchanged)

```typescript
generateCourse(seed: string, width: number, height: number, config?: CourseConfig): Course
```

Return type `Course` is unchanged: `{ grid, width, height, tee, hole, seed }`.

### Internal structure

- `generateCourse()` remains the entry point
- PRNG selects one of 5 archetypes
- Each archetype is a function that places fairway islands then hazards using shared helpers
- Shared helpers: island placement, water placement (with flood-fill validation), tree clusters, sand, slopes, reachability

### File changes

- `src/engine/course.ts` - rewrite internals, keep public API identical
- `src/engine/types.ts` - update `CourseConfig` defaults
- No changes to `validation.ts`, `reducer.ts`, or UI code

## Archetypes

Five layout archetypes, each creating a distinct routing puzzle. Tee always at the bottom, hole always at the top.

### 1. Island Hop

3-4 disconnected fairway islands staggered left-right across vertical thirds. Player must choose which island to aim for next. Sand between islands as stepping stones.

### 2. The Gauntlet

Tree walls form a narrow corridor (3-4 cells wide) in the mid-section. Water/sand inside the corridor. Thread the needle or go wide through rough.

### 3. Split Decision

Water or trees divide the course left/right with a central barrier. Two distinct routes to the hole, each with different hazards.

### 4. The Dogleg

Fairway bends sharply around a hazard. Cut the corner (risky over water/trees) or play safe around the bend. Tee on one side, corner island in the middle, green on the other side.

### 5. Fortress Green

Large tee area, open approach, but the green is surrounded by sand (ring or partial ring). Easy to reach the area, hard to land on the small green itself.

## Island Placement

Each archetype defines 3-5 zones - rectangular regions of the grid where a fairway island is placed. The PRNG randomises exact position and size within each zone.

- Island sizes: 3x3 to 5x6 cells
- Axis-aligned rectangles with 1-2 cells randomly removed from corners/edges for irregular blocky shapes
- Tee always on an island in the bottom zone; hole always on an island in the top zone
- 1-cell fairway ring around the hole cell

### Reachability constraint

Gap between consecutive islands is at most 7 cells (max roll: d6 of 6 + fairway bonus of 1) in at least one compass direction.

### Tee/hole placement

- Tee: bottom zone, X randomised within middle 80% of grid
- Hole: top zone, X randomised within middle 80% of grid

## Hazard Placement

### Water

- Large blocking shapes: rectangles, L-shapes, or T-shapes built from rectangular sub-blocks
- Acts as a barrier defining the routing puzzle
- Archetype-specific positioning (e.g. Split Decision: across the middle; Dogleg: blocking the shortcut)

### Water invariant

After all water cells are placed, flood-fill from every grid-edge cell through non-water cells. Any non-water cell not reached by the flood-fill is converted to water. This enforces: **no rough (or any non-water terrain) can be enclosed inside water.**

### Trees

- Clusters (2x2, 2x3, 3x3 blocks) and scattered lines/corridors
- Gauntlet archetype uses deliberate wall-like lines flanking the corridor
- Never placed on fairway islands
- Never within 1 cell of the hole
- Can be adjacent to fairway (unlike current algorithm) - this creates the navigation constraint

### Sand

Two roles depending on archetype:

- **Stepping stones** (Island Hop, Split Decision): small 2x2 or 2x3 patches between islands, safe-but-penalised landing
- **Fortress defence** (Fortress Green): ring or partial ring around the green
- **Corridor hazard** (Gauntlet): patches inside the narrow corridor
- Always placed on rough cells (never overwrites fairway)

### Slopes

- 2-4 per hole, on fairway or rough
- Validated to not point into water, trees, or OOB
- Positioned to add approach wrinkles (e.g. slope that could push off an island)

## Generation Steps

1. Initialise PRNG from seed
2. Create empty grid (all rough)
3. Select archetype via PRNG
4. Place tee and hole positions
5. Place fairway islands (archetype function, 3-5 rectangular islands with irregular edges)
6. Place water (archetype-specific large blocking shapes)
7. Validate water invariant (flood-fill, convert enclosed non-water to water)
8. Place trees (clusters and corridors per archetype)
9. Place sand (stepping stones and/or green defence)
10. Place slopes (2-4, validated directions)
11. Protect tee and hole (ensure fairway, no slope)
12. Reachability check (BFS tee to hole, retry with modified seed if unreachable)

## CourseConfig Changes

Removed fields (no longer relevant):

- `fairwayWidthMin`
- `fairwayWidthMax`
- `controlPoints`

New/updated fields:

- `islandCountMin` - minimum islands per hole (default 3)
- `islandCountMax` - maximum islands per hole (default 5)
- `islandSizeMin` - minimum island dimension in cells (default 3)
- `islandSizeMax` - maximum island dimension in cells (default 6)

Retained fields:

- `treeDensity`
- `sandTrapCount`
- `waterProbability`
- `slopeCount`

## Testing

### Preserved tests

- Determinism: same seed produces same course
- Reachability: BFS from tee to hole always passes
- Tee and hole are on fairway with no slope

### New tests

- **Water invariant**: flood-fill from grid edges through non-water; all non-water cells must be visited
- **Island disconnection**: for Island Hop, Split Decision, and Dogleg archetypes, fairway cells form 2+ connected components
- **Archetype distribution**: 100 courses with sequential seeds, all 5 archetypes appear at least once
- **Island reachability**: gap between consecutive islands is at most 7 cells in at least one direction
- **Trees never on fairway**: no cell is both Trees and part of a fairway island
- **Tee/hole zones**: tee Y in bottom third, hole Y in top third

### Removed tests

- Spine-related tests (fairway continuity, control points)
- Tests asserting specific hazard counts from the old algorithm
