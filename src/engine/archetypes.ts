import { placeIsland, placeSandPatch, placeTreeCluster, placeWaterBlock } from "./island";
import type { PRNG } from "./prng";
import { type Cell, type CourseConfig, type Position, Terrain } from "./types";

/**
 * Island Hop: 3-4 disconnected fairway islands staggered left-right across
 * vertical thirds. Sand stepping stones between consecutive islands. Tree
 * clusters in rough areas. Optional water hazard beside a mid island.
 */
export function islandHop(
  grid: Cell[][],
  width: number,
  height: number,
  _tee: Position,
  _hole: Position,
  config: CourseConfig,
  rng: PRNG,
): void {
  const islandCount = rng.int(3, 4);
  const sectionH = Math.floor(height / islandCount);

  for (let i = 0; i < islandCount; i++) {
    const isEven = i % 2 === 0;
    const iw = rng.int(config.islandSizeMin, config.islandSizeMax);
    const ih = rng.int(config.islandSizeMin, Math.min(config.islandSizeMax, sectionH - 1));
    const ix = isEven
      ? rng.int(1, Math.max(1, Math.floor(width / 2) - iw))
      : rng.int(Math.floor(width / 2), Math.max(Math.floor(width / 2), width - iw - 1));
    const iy = Math.max(
      0,
      Math.min(
        height - ih,
        sectionH * (islandCount - 1 - i) + rng.int(0, Math.max(0, sectionH - ih)),
      ),
    );

    placeIsland(grid, width, height, { x: ix, y: iy, w: iw, h: ih }, rng);

    // Sand stepping stones between this island and the next
    if (i < islandCount - 1) {
      const sandX = Math.max(0, Math.min(width - 2, ix + Math.floor(iw / 2)));
      const sandY = Math.max(0, Math.min(height - 1, iy + ih));
      placeSandPatch(grid, width, height, sandX, sandY, 2, 1);
    }
  }

  // Tree clusters in rough areas
  for (let t = 0; t < 3; t++) {
    const tx = rng.int(0, width - 2);
    const ty = rng.int(0, height - 2);
    placeTreeCluster(grid, width, height, tx, ty, 2, 2);
  }

  // Optional water hazard beside a mid island
  if (rng.chance(config.waterProbability)) {
    const wx = rng.int(0, Math.max(0, width - 3));
    const wy = rng.int(Math.floor(height / 3), Math.floor((2 * height) / 3));
    placeWaterBlock(grid, width, height, wx, wy, 2, 2);
  }
}

/**
 * Gauntlet: Large tee pad (bottom), large green (top), narrow corridor of
 * fairway (3-4 cells wide) in the middle third. Tree walls flanking the
 * corridor. Water/sand inside the corridor. Sand guard near the hole approach.
 */
export function gauntlet(
  grid: Cell[][],
  width: number,
  height: number,
  _tee: Position,
  _hole: Position,
  config: CourseConfig,
  rng: PRNG,
): void {
  // Tee pad at bottom
  const teeW = rng.int(config.islandSizeMin, config.islandSizeMax);
  const teeH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const teeX = Math.max(0, Math.min(width - teeW, Math.floor(width / 2) - Math.floor(teeW / 2)));
  const teeY = Math.max(0, Math.min(height - teeH, height - teeH - 1));
  placeIsland(grid, width, height, { x: teeX, y: teeY, w: teeW, h: teeH }, rng);

  // Green at top
  const greenW = rng.int(config.islandSizeMin, config.islandSizeMax);
  const greenH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const greenX = Math.max(
    0,
    Math.min(width - greenW, Math.floor(width / 2) - Math.floor(greenW / 2)),
  );
  const greenY = Math.max(0, 1);
  placeIsland(grid, width, height, { x: greenX, y: greenY, w: greenW, h: greenH }, rng);

  // Narrow corridor in the middle
  const corridorW = rng.int(3, 4);
  const corridorX = Math.max(
    0,
    Math.min(width - corridorW, Math.floor(width / 2) - Math.floor(corridorW / 2)),
  );
  const corridorTop = greenY + greenH;
  const corridorBot = teeY;
  const corridorH = Math.max(1, corridorBot - corridorTop);
  placeIsland(
    grid,
    width,
    height,
    { x: corridorX, y: corridorTop, w: corridorW, h: corridorH },
    rng,
  );

  // Tree walls flanking the corridor
  const wallWidth = 2;
  const leftWallX = Math.max(0, corridorX - wallWidth);
  placeTreeCluster(grid, width, height, leftWallX, corridorTop, wallWidth, corridorH);

  const rightWallX = Math.min(width - wallWidth, corridorX + corridorW);
  placeTreeCluster(grid, width, height, rightWallX, corridorTop, wallWidth, corridorH);

  // Water or sand inside the corridor
  if (rng.chance(config.waterProbability)) {
    const hazY = Math.max(corridorTop, Math.floor((corridorTop + corridorBot) / 2));
    placeWaterBlock(grid, width, height, corridorX, hazY, Math.min(2, corridorW), 1);
  } else {
    const hazY = Math.max(corridorTop, Math.floor((corridorTop + corridorBot) / 2));
    placeSandPatch(grid, width, height, corridorX + 1, hazY, 1, 1);
  }

  // Sand guard near the hole approach
  placeSandPatch(grid, width, height, Math.max(0, greenX - 1), greenY + greenH, greenW + 2, 1);
}

/**
 * Split Decision: Wide tee pad (bottom), wide green (top). Central barrier
 * (water 60% or trees 40%) across the middle. Left route and right route
 * with islands above and below the barrier. Sand stepping stones near barrier
 * gaps. Scattered tree clusters.
 */
export function splitDecision(
  grid: Cell[][],
  width: number,
  height: number,
  _tee: Position,
  _hole: Position,
  config: CourseConfig,
  rng: PRNG,
): void {
  // Tee pad at bottom
  const teeW = rng.int(config.islandSizeMin + 1, config.islandSizeMax);
  const teeH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const teeX = Math.max(0, Math.min(width - teeW, Math.floor(width / 2) - Math.floor(teeW / 2)));
  const teeY = Math.max(0, Math.min(height - teeH, height - teeH - 1));
  placeIsland(grid, width, height, { x: teeX, y: teeY, w: teeW, h: teeH }, rng);

  // Green at top
  const greenW = rng.int(config.islandSizeMin + 1, config.islandSizeMax);
  const greenH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const greenX = Math.max(
    0,
    Math.min(width - greenW, Math.floor(width / 2) - Math.floor(greenW / 2)),
  );
  const greenY = Math.max(0, 1);
  placeIsland(grid, width, height, { x: greenX, y: greenY, w: greenW, h: greenH }, rng);

  // Central barrier across the middle
  const barrierY = Math.floor(height / 2) - 1;
  const barrierH = 2;
  const barrierX = 1;
  const barrierW = width - 2;
  const useWater = rng.chance(0.6);

  if (useWater) {
    placeWaterBlock(grid, width, height, barrierX, barrierY, barrierW, barrierH);
  } else {
    // Trees as barrier - place directly
    for (let dy = 0; dy < barrierH; dy++) {
      for (let dx = 0; dx < barrierW; dx++) {
        const bx = barrierX + dx;
        const by = barrierY + dy;
        if (bx >= 0 && bx < width && by >= 0 && by < height) {
          const cell = grid[by]?.[bx];
          if (cell && cell.terrain !== Terrain.Fairway) {
            cell.terrain = Terrain.Trees;
          }
        }
      }
    }
  }

  // Left route: island below and above the barrier
  const leftIslandW = rng.int(config.islandSizeMin, 4);
  const leftIslandH = rng.int(config.islandSizeMin, 4);
  placeIsland(
    grid,
    width,
    height,
    {
      x: 1,
      y: Math.max(0, barrierY - leftIslandH),
      w: leftIslandW,
      h: leftIslandH,
    },
    rng,
  );
  placeIsland(
    grid,
    width,
    height,
    {
      x: 1,
      y: Math.min(height - config.islandSizeMin, barrierY + barrierH),
      w: leftIslandW,
      h: leftIslandH,
    },
    rng,
  );

  // Right route: island below and above the barrier
  const rightIslandW = rng.int(config.islandSizeMin, 4);
  const rightIslandH = rng.int(config.islandSizeMin, 4);
  const rightX = Math.max(0, width - rightIslandW - 1);
  placeIsland(
    grid,
    width,
    height,
    {
      x: rightX,
      y: Math.max(0, barrierY - rightIslandH),
      w: rightIslandW,
      h: rightIslandH,
    },
    rng,
  );
  placeIsland(
    grid,
    width,
    height,
    {
      x: rightX,
      y: Math.min(height - config.islandSizeMin, barrierY + barrierH),
      w: rightIslandW,
      h: rightIslandH,
    },
    rng,
  );

  // Sand stepping stones near barrier edges
  placeSandPatch(grid, width, height, 0, barrierY - 1, 1, 1);
  placeSandPatch(grid, width, height, width - 1, barrierY - 1, 1, 1);

  // Scattered tree clusters
  for (let t = 0; t < 2; t++) {
    const tx = rng.int(0, width - 2);
    const ty = rng.int(0, height - 2);
    placeTreeCluster(grid, width, height, tx, ty, 2, 2);
  }
}

/**
 * Dogleg: Fairway bends sharply around a hazard. Tee pad offset to one side,
 * corner island at mid-height on the same side, hole island offset to the
 * opposite side. Hazard blocking the diagonal shortcut. Sand at the corner.
 * Additional tree clusters and optional water.
 */
export function dogleg(
  grid: Cell[][],
  width: number,
  height: number,
  _tee: Position,
  _hole: Position,
  config: CourseConfig,
  rng: PRNG,
): void {
  const goLeft = rng.chance(0.5);

  // Tee pad offset to one side at the bottom
  const teeW = rng.int(config.islandSizeMin, config.islandSizeMax);
  const teeH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const teeX = goLeft
    ? rng.int(1, Math.max(1, Math.floor(width / 3) - 1))
    : rng.int(
        Math.floor((2 * width) / 3) - teeW + 1,
        Math.max(Math.floor((2 * width) / 3) - teeW + 1, width - teeW - 1),
      );
  const teeY = Math.max(0, Math.min(height - teeH, height - teeH - 1));
  placeIsland(grid, width, height, { x: teeX, y: teeY, w: teeW, h: teeH }, rng);

  // Corner island at mid-height on the same side as tee
  const cornerW = rng.int(config.islandSizeMin, config.islandSizeMax);
  const cornerH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const cornerX = goLeft
    ? rng.int(1, Math.max(1, Math.floor(width / 3)))
    : rng.int(
        Math.floor((2 * width) / 3) - cornerW,
        Math.max(Math.floor((2 * width) / 3) - cornerW, width - cornerW - 1),
      );
  const cornerY = Math.max(
    0,
    Math.min(height - cornerH, Math.floor(height / 2) - Math.floor(cornerH / 2)),
  );
  placeIsland(grid, width, height, { x: cornerX, y: cornerY, w: cornerW, h: cornerH }, rng);

  // Hole island offset to the opposite side at the top
  const holeW = rng.int(config.islandSizeMin, config.islandSizeMax);
  const holeH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const holeX = goLeft
    ? rng.int(Math.floor(width / 2), Math.max(Math.floor(width / 2), width - holeW - 1))
    : rng.int(1, Math.max(1, Math.floor(width / 2) - holeW));
  const holeY = Math.max(0, 1);
  placeIsland(grid, width, height, { x: holeX, y: holeY, w: holeW, h: holeH }, rng);

  // Hazard blocking the diagonal shortcut (centre of grid)
  const hazX = Math.max(0, Math.floor(width / 2) - 1);
  const hazY = Math.max(0, Math.floor(height / 2) - 1);
  if (rng.chance(config.waterProbability)) {
    placeWaterBlock(grid, width, height, hazX, hazY, 3, 3);
  } else {
    placeTreeCluster(grid, width, height, hazX, hazY, 3, 3);
  }

  // Sand at the corner turn
  placeSandPatch(grid, width, height, Math.max(0, cornerX - 1), cornerY + cornerH, 2, 1);

  // Additional tree clusters
  for (let t = 0; t < 2; t++) {
    const tx = rng.int(0, width - 2);
    const ty = rng.int(0, height - 2);
    placeTreeCluster(grid, width, height, tx, ty, 2, 2);
  }

  // Optional water on the far side
  if (rng.chance(config.waterProbability)) {
    const farX = goLeft
      ? rng.int(Math.floor((2 * width) / 3), width - 2)
      : rng.int(0, Math.floor(width / 3));
    const farY = rng.int(Math.floor(height / 3), Math.floor((2 * height) / 3));
    placeWaterBlock(grid, width, height, farX, farY, 2, 2);
  }
}

/**
 * Fortress Green: Large tee pad (bottom), mid approach island, small green
 * (top). Sand ring around the green. Water flanking the approach on both
 * sides. Tree clusters scattered.
 */
export function fortressGreen(
  grid: Cell[][],
  width: number,
  height: number,
  _tee: Position,
  hole: Position,
  config: CourseConfig,
  rng: PRNG,
): void {
  // Large tee pad at bottom
  const teeW = rng.int(config.islandSizeMin + 1, config.islandSizeMax);
  const teeH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const teeX = Math.max(0, Math.min(width - teeW, Math.floor(width / 2) - Math.floor(teeW / 2)));
  const teeY = Math.max(0, Math.min(height - teeH, height - teeH - 1));
  placeIsland(grid, width, height, { x: teeX, y: teeY, w: teeW, h: teeH }, rng);

  // Mid approach island
  const midW = rng.int(config.islandSizeMin, config.islandSizeMax);
  const midH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const midX = Math.max(0, Math.min(width - midW, Math.floor(width / 2) - Math.floor(midW / 2)));
  const midY = Math.max(0, Math.floor(height / 2) - Math.floor(midH / 2));
  placeIsland(grid, width, height, { x: midX, y: midY, w: midW, h: midH }, rng);

  // Small green near the hole at top
  const greenW = rng.int(config.islandSizeMin, 4);
  const greenH = rng.int(config.islandSizeMin, 4);
  const greenX = Math.max(0, Math.min(width - greenW, hole.x - Math.floor(greenW / 2)));
  const greenY = Math.max(0, Math.min(height - greenH, hole.y - 1));
  placeIsland(grid, width, height, { x: greenX, y: greenY, w: greenW, h: greenH }, rng);

  // Sand ring around the green (placed on rough cells adjacent to the green)
  for (let dy = -1; dy <= greenH; dy++) {
    for (let dx = -1; dx <= greenW; dx++) {
      const sx = greenX + dx;
      const sy = greenY + dy;
      // Only place sand on the border cells (not inside the green rectangle)
      const isInside = dx >= 0 && dx < greenW && dy >= 0 && dy < greenH;
      if (!isInside && sx >= 0 && sx < width && sy >= 0 && sy < height) {
        placeSandPatch(grid, width, height, sx, sy, 1, 1);
      }
    }
  }

  // Water flanking the approach on both sides
  const approachY = midY;
  const waterH = Math.max(1, Math.min(3, greenY - midY));
  placeWaterBlock(grid, width, height, Math.max(0, midX - 3), approachY, 2, waterH);
  placeWaterBlock(grid, width, height, Math.min(width - 2, midX + midW + 1), approachY, 2, waterH);

  // Tree clusters scattered
  for (let t = 0; t < 3; t++) {
    const tx = rng.int(0, width - 2);
    const ty = rng.int(0, height - 2);
    placeTreeCluster(grid, width, height, tx, ty, 2, 2);
  }
}

/**
 * Forest Slalom: A single large fairway with diagonal tree lines cutting
 * across it, creating a winding corridor. The player must zig-zag around
 * tree barriers. Sand at gap openings. Optional water on the outside of
 * a bend. Scattered extra trees controlled by treeDensity.
 */
export function forestSlalom(
  grid: Cell[][],
  width: number,
  height: number,
  _tee: Position,
  _hole: Position,
  config: CourseConfig,
  rng: PRNG,
): void {
  // Step 1: Place one large fairway island spanning most of the grid
  const margin = 1;
  placeIsland(
    grid,
    width,
    height,
    { x: margin, y: 2, w: width - margin * 2, h: height - 4 },
    rng,
  );

  // Step 2: Place 3-4 diagonal tree lines across the fairway
  const lineCount = rng.int(3, 4);
  const sectionH = Math.floor((height - 4) / (lineCount + 1));

  for (let i = 0; i < lineCount; i++) {
    const fromLeft = i % 2 === 0;
    const lineY = 3 + sectionH * (i + 1);
    const lineWidth = Math.floor(width * 0.55);

    const startX = fromLeft ? margin : width - margin - lineWidth;

    // Place 2-cell-thick diagonal tree line
    for (let dx = 0; dx < lineWidth; dx++) {
      const x = startX + dx;
      const yOffset = Math.floor(dx / (fromLeft ? 3 : 4)) * (fromLeft ? -1 : 1);
      const y1 = lineY + yOffset;
      const y2 = y1 + 1;

      for (const y of [y1, y2]) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const cell = grid[y]?.[x];
          if (cell && cell.terrain === Terrain.Fairway) {
            cell.terrain = Terrain.Trees;
          }
        }
      }
    }

    // Sand trap at the gap opening
    const gapX = fromLeft ? Math.min(width - 2, startX + lineWidth) : Math.max(0, startX - 1);
    placeSandPatch(grid, width, height, gapX, lineY, 2, 1);
  }

  // Step 3: Optional water block on the outside of one bend
  if (rng.chance(config.waterProbability)) {
    const bendIndex = rng.int(0, lineCount - 1);
    const fromLeft = bendIndex % 2 === 0;
    const waterY = 3 + sectionH * (bendIndex + 1) + 2;
    const waterX = fromLeft ? rng.int(0, margin) : rng.int(width - 3, width - 1);
    placeWaterBlock(grid, width, height, Math.max(0, waterX), Math.max(0, waterY), 2, 2);
  }

  // Step 4: Extra scattered tree clusters based on treeDensity
  const extraTrees = Math.floor(config.treeDensity * 10);
  for (let t = 0; t < extraTrees; t++) {
    const tx = rng.int(0, width - 2);
    const ty = rng.int(0, height - 2);
    placeTreeCluster(grid, width, height, tx, ty, 2, 1);
  }
}

/**
 * Sloped Amphitheatre: Green sits in a bowl surrounded by inward-facing
 * slopes. Large tee pad at the bottom, mid-approach fairway, small green
 * at top. Slopes around the green push the ball inward - landing on the
 * correct side helps, wrong side pushes past. Sand ring outside the slopes.
 * Water flanking the approach corridor. Tree clusters scattered.
 */
export function slopedAmphitheatre(
  grid: Cell[][],
  width: number,
  height: number,
  _tee: Position,
  hole: Position,
  config: CourseConfig,
  rng: PRNG,
): void {
  // Step 1: Large tee pad at bottom
  const teeW = rng.int(config.islandSizeMin + 1, config.islandSizeMax);
  const teeH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const teeX = Math.max(0, Math.min(width - teeW, Math.floor(width / 2) - Math.floor(teeW / 2)));
  const teeY = Math.max(0, Math.min(height - teeH, height - teeH - 1));
  placeIsland(grid, width, height, { x: teeX, y: teeY, w: teeW, h: teeH }, rng);

  // Step 2: Mid-approach fairway
  const midW = rng.int(config.islandSizeMin, config.islandSizeMax);
  const midH = rng.int(config.islandSizeMin, config.islandSizeMax);
  const midX = Math.max(0, Math.min(width - midW, Math.floor(width / 2) - Math.floor(midW / 2)));
  const midY = Math.max(0, Math.floor(height * 0.45) - Math.floor(midH / 2));
  placeIsland(grid, width, height, { x: midX, y: midY, w: midW, h: midH }, rng);

  // Step 3: Green area around the hole - wider for the slope bowl
  const greenW = rng.int(config.islandSizeMin + 1, Math.min(config.islandSizeMax, 6));
  const greenH = rng.int(config.islandSizeMin + 1, Math.min(config.islandSizeMax, 5));
  const greenX = Math.max(1, Math.min(width - greenW - 1, hole.x - Math.floor(greenW / 2)));
  const greenY = Math.max(1, Math.min(height - greenH, hole.y - 1));
  placeIsland(grid, width, height, { x: greenX, y: greenY, w: greenW, h: greenH }, rng);

  // Step 4: Place inward-facing slopes around the green perimeter
  type Dir = "N" | "S" | "E" | "W";
  const slopePositions: { x: number; y: number; dir: Dir }[] = [];

  // Top edge - slopes pointing south
  for (let dx = 0; dx < greenW; dx++) {
    slopePositions.push({ x: greenX + dx, y: greenY, dir: "S" });
  }
  // Bottom edge - slopes pointing north
  for (let dx = 0; dx < greenW; dx++) {
    slopePositions.push({ x: greenX + dx, y: greenY + greenH - 1, dir: "N" });
  }
  // Left edge - slopes pointing east
  for (let dy = 1; dy < greenH - 1; dy++) {
    slopePositions.push({ x: greenX, y: greenY + dy, dir: "E" });
  }
  // Right edge - slopes pointing west
  for (let dy = 1; dy < greenH - 1; dy++) {
    slopePositions.push({ x: greenX + greenW - 1, y: greenY + dy, dir: "W" });
  }

  for (const sp of slopePositions) {
    if (sp.x === hole.x && sp.y === hole.y) continue;
    if (sp.x < 0 || sp.x >= width || sp.y < 0 || sp.y >= height) continue;
    const cell = grid[sp.y]?.[sp.x];
    if (cell && cell.terrain === Terrain.Fairway) {
      cell.slope = sp.dir;
    }
  }

  // Step 5: Sand ring outside the green
  for (let dy = -1; dy <= greenH; dy++) {
    for (let dx = -1; dx <= greenW; dx++) {
      const sx = greenX + dx;
      const sy = greenY + dy;
      const isInside = dx >= 0 && dx < greenW && dy >= 0 && dy < greenH;
      if (!isInside && sx >= 0 && sx < width && sy >= 0 && sy < height) {
        placeSandPatch(grid, width, height, sx, sy, 1, 1);
      }
    }
  }

  // Step 6: Water flanking the approach corridor
  const approachY = midY;
  const waterH = Math.max(1, Math.min(3, greenY - midY));
  placeWaterBlock(grid, width, height, Math.max(0, midX - 3), approachY, 2, waterH);
  placeWaterBlock(grid, width, height, Math.min(width - 2, midX + midW + 1), approachY, 2, waterH);

  // Step 7: Tree clusters scattered
  for (let t = 0; t < 3; t++) {
    const tx = rng.int(0, width - 2);
    const ty = rng.int(0, height - 2);
    placeTreeCluster(grid, width, height, tx, ty, 2, 2);
  }
}
