import { useCallback, useEffect, useRef } from "react";
import type { Cell, Course, GameState, Position } from "../engine/types";
import { Terrain } from "../engine/types";
import "./GameCanvas.css";

const TERRAIN_COLOURS: Record<Terrain, string> = {
  [Terrain.Rough]: "#f5f5f3",
  [Terrain.Fairway]: "#d4d4d0",
  [Terrain.Sand]: "#e8e8e4",
  [Terrain.Water]: "#4a4a4a",
  [Terrain.Trees]: "#f5f5f3",
};

const DOT_COLOUR_LIGHT = "#c0c0c0";
const DOT_COLOUR_DARK = "#6a6a6a";
const GRID_LINE_COLOUR = "#5a5a5a";
const HATCH_COLOUR = "#c8c8c4";
const TREE_COLOUR = "#1a1a1a";
const SLOPE_ARROW_COLOUR = "#3a3a3a";
const BALL_COLOUR = "#ffffff";
const BALL_OUTLINE = "#1a1a1a";
const TEE_COLOUR = "#1a1a1a";
const HOLE_COLOUR = "#1a1a1a";
const PATH_COLOUR = "#1a1a1a66";
const CORNER_RADIUS = 24;
const CELL_SIZE = 64;

interface Props {
  state: GameState;
  /** Animated ball position (may differ from state.ball during animation). */
  animatedBall: Position | null;
}

/** Rotation angle in radians for each slope direction (0 = pointing up/North). */
const DIRECTION_ANGLES: Record<string, number> = {
  N:  0,
  NE: Math.PI * 0.25,
  E:  Math.PI * 0.5,
  SE: Math.PI * 0.75,
  S:  Math.PI,
  SW: Math.PI * 1.25,
  W:  Math.PI * 1.5,
  NW: Math.PI * 1.75,
};

/** Returns true if the cell at (x, y) is a non-rough filled terrain (not trees). */
function isNonRough(grid: Cell[][], x: number, y: number, width: number, height: number): boolean {
  if (x < 0 || x >= width || y < 0 || y >= height) return false;
  const terrain = grid[y]?.[x]?.terrain;
  return terrain !== undefined && terrain !== Terrain.Rough && terrain !== Terrain.Trees;
}

/** Returns true if the cell at (x, y) has the given terrain type. */
function isSameTerrain(
  grid: Cell[][],
  x: number,
  y: number,
  terrain: Terrain,
  width: number,
  height: number,
): boolean {
  if (x < 0 || x >= width || y < 0 || y >= height) return false;
  return grid[y]?.[x]?.terrain === terrain;
}

/**
 * Traces a rounded rect path for a tile. Corners round only when both
 * adjacent cardinals are rough/trees/OOB.
 */
function roundedTilePath(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  x: number,
  y: number,
  grid: Cell[][],
  width: number,
  height: number,
  cellSize: number,
  radius: number,
): void {
  const topNonRough = isNonRough(grid, x, y - 1, width, height);
  const bottomNonRough = isNonRough(grid, x, y + 1, width, height);
  const leftNonRough = isNonRough(grid, x - 1, y, width, height);
  const rightNonRough = isNonRough(grid, x + 1, y, width, height);

  const rTL = !topNonRough && !leftNonRough ? radius : 0;
  const rTR = !topNonRough && !rightNonRough ? radius : 0;
  const rBL = !bottomNonRough && !leftNonRough ? radius : 0;
  const rBR = !bottomNonRough && !rightNonRough ? radius : 0;

  ctx.beginPath();
  ctx.moveTo(px + rTL, py);
  ctx.lineTo(px + cellSize - rTR, py);
  if (rTR) ctx.arcTo(px + cellSize, py, px + cellSize, py + rTR, rTR);
  else ctx.lineTo(px + cellSize, py);
  ctx.lineTo(px + cellSize, py + cellSize - rBR);
  if (rBR) ctx.arcTo(px + cellSize, py + cellSize, px + cellSize - rBR, py + cellSize, rBR);
  else ctx.lineTo(px + cellSize, py + cellSize);
  ctx.lineTo(px + rBL, py + cellSize);
  if (rBL) ctx.arcTo(px, py + cellSize, px, py + cellSize - rBL, rBL);
  else ctx.lineTo(px, py + cellSize);
  ctx.lineTo(px, py + rTL);
  if (rTL) ctx.arcTo(px, py, px + rTL, py, rTL);
  else ctx.lineTo(px, py);
  ctx.closePath();
}

function drawCourse(ctx: CanvasRenderingContext2D, course: Course, cellSize: number) {
  const { grid, width, height } = course;

  // Layer 1: Rough base - fill entire canvas
  ctx.fillStyle = TERRAIN_COLOURS[Terrain.Rough];
  ctx.fillRect(0, 0, width * cellSize, height * cellSize);

  // Dot grid on rough
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      ctx.fillStyle = DOT_COLOUR_LIGHT;
      ctx.beginPath();
      ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Layer 2: Fairway
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y]?.[x]?.terrain !== Terrain.Fairway) continue;
      const px = x * cellSize;
      const py = y * cellSize;
      roundedTilePath(ctx, px, py, x, y, grid, width, height, cellSize, CORNER_RADIUS);
      ctx.fillStyle = TERRAIN_COLOURS[Terrain.Fairway];
      ctx.fill();
      // Dot
      ctx.fillStyle = DOT_COLOUR_LIGHT;
      ctx.beginPath();
      ctx.arc(px + cellSize / 2, py + cellSize / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Layer 3: Sand with diagonal hatch
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y]?.[x]?.terrain !== Terrain.Sand) continue;
      const px = x * cellSize;
      const py = y * cellSize;
      roundedTilePath(ctx, px, py, x, y, grid, width, height, cellSize, CORNER_RADIUS);
      ctx.fillStyle = TERRAIN_COLOURS[Terrain.Sand];
      ctx.fill();
      // Diagonal hatch - use global coordinates for continuity
      ctx.save();
      roundedTilePath(ctx, px, py, x, y, grid, width, height, cellSize, CORNER_RADIUS);
      ctx.clip();
      ctx.strokeStyle = HATCH_COLOUR;
      ctx.lineWidth = 3;
      const hatchSpacing = 10;
      // Draw lines from global y-intercept so they align across tiles
      const startGlobal = Math.floor(px / hatchSpacing) * hatchSpacing;
      for (let gx = startGlobal - cellSize; gx < px + cellSize * 2; gx += hatchSpacing) {
        ctx.beginPath();
        ctx.moveTo(gx, py - (gx - px));
        ctx.lineTo(gx + cellSize, py - (gx - px) + cellSize);
        ctx.stroke();
      }
      ctx.restore();
      // Dot
      ctx.fillStyle = DOT_COLOUR_LIGHT;
      ctx.beginPath();
      ctx.arc(px + cellSize / 2, py + cellSize / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Layer 4: Water - solid fill, grid lines only on outer edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y]?.[x]?.terrain !== Terrain.Water) continue;
      const px = x * cellSize;
      const py = y * cellSize;
      roundedTilePath(ctx, px, py, x, y, grid, width, height, cellSize, CORNER_RADIUS);
      ctx.fillStyle = TERRAIN_COLOURS[Terrain.Water];
      ctx.fill();
    }
  }
  // Water border lines (separate pass to avoid overlap issues)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y]?.[x]?.terrain !== Terrain.Water) continue;
      const px = x * cellSize;
      const py = y * cellSize;
      ctx.save();
      roundedTilePath(ctx, px, py, x, y, grid, width, height, cellSize, CORNER_RADIUS);
      ctx.clip();
      ctx.strokeStyle = GRID_LINE_COLOUR;
      ctx.lineWidth = 1.5;
      if (!isSameTerrain(grid, x, y - 1, Terrain.Water, width, height)) {
        ctx.beginPath();
        ctx.moveTo(px, py + 0.5);
        ctx.lineTo(px + cellSize, py + 0.5);
        ctx.stroke();
      }
      if (!isSameTerrain(grid, x, y + 1, Terrain.Water, width, height)) {
        ctx.beginPath();
        ctx.moveTo(px, py + cellSize - 0.5);
        ctx.lineTo(px + cellSize, py + cellSize - 0.5);
        ctx.stroke();
      }
      if (!isSameTerrain(grid, x - 1, y, Terrain.Water, width, height)) {
        ctx.beginPath();
        ctx.moveTo(px + 0.5, py);
        ctx.lineTo(px + 0.5, py + cellSize);
        ctx.stroke();
      }
      if (!isSameTerrain(grid, x + 1, y, Terrain.Water, width, height)) {
        ctx.beginPath();
        ctx.moveTo(px + cellSize - 0.5, py);
        ctx.lineTo(px + cellSize - 0.5, py + cellSize);
        ctx.stroke();
      }
      ctx.restore();
      // Light dot on water
      ctx.fillStyle = DOT_COLOUR_DARK;
      ctx.beginPath();
      ctx.arc(px + cellSize / 2, py + cellSize / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Layer 5: Tree icons (two stacked triangles, pine silhouette)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y]?.[x]?.terrain !== Terrain.Trees) continue;
      const cx = x * cellSize + cellSize / 2;
      const cy = y * cellSize + cellSize / 2;
      const size = 16;
      ctx.fillStyle = TREE_COLOUR;
      // Upper triangle
      ctx.beginPath();
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx - size * 0.55, cy - size * 0.15);
      ctx.lineTo(cx + size * 0.55, cy - size * 0.15);
      ctx.closePath();
      ctx.fill();
      // Lower triangle - slightly wider, apex overlaps upper base
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.5);
      ctx.lineTo(cx - size * 0.7, cy + size * 0.55);
      ctx.lineTo(cx + size * 0.7, cy + size * 0.55);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Slope arrows (geometric: shaft + arrowhead, rotated per direction)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y]?.[x];
      if (!cell?.slope) continue;
      const angle = DIRECTION_ANGLES[cell.slope];
      if (angle === undefined) continue;

      const cx = x * cellSize + cellSize / 2;
      const cy = y * cellSize + cellSize / 2;
      const shaftW = cellSize * 0.12;
      const shaftLen = cellSize * 0.22;
      const headW = cellSize * 0.28;
      const headLen = cellSize * 0.22;
      // Total arrow length: shaftLen + headLen, centred on the cell.
      const totalLen = shaftLen + headLen;
      const tipY = -totalLen / 2;          // tip (towards N before rotation)
      const shaftBaseY = tipY + headLen;   // base of arrowhead / top of shaft

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = SLOPE_ARROW_COLOUR;

      // Arrowhead triangle
      ctx.beginPath();
      ctx.moveTo(0, tipY);
      ctx.lineTo(-headW / 2, shaftBaseY);
      ctx.lineTo(headW / 2, shaftBaseY);
      ctx.closePath();
      ctx.fill();

      // Shaft rectangle
      ctx.fillRect(-shaftW / 2, shaftBaseY, shaftW, shaftLen);

      ctx.restore();
    }
  }

  // Tee marker (filled black circle)
  ctx.fillStyle = TEE_COLOUR;
  ctx.beginPath();
  ctx.arc(
    course.tee.x * cellSize + cellSize / 2,
    course.tee.y * cellSize + cellSize / 2,
    12,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Hole marker (stroked ring)
  ctx.strokeStyle = HOLE_COLOUR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    course.hole.x * cellSize + cellSize / 2,
    course.hole.y * cellSize + cellSize / 2,
    10,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
}

function drawShotPath(
  ctx: CanvasRenderingContext2D,
  shotHistory: GameState["shotHistory"],
  cellSize: number,
) {
  if (shotHistory.length === 0) return;

  ctx.strokeStyle = PATH_COLOUR;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);

  for (const shot of shotHistory) {
    ctx.beginPath();
    ctx.moveTo(shot.from.x * cellSize + cellSize / 2, shot.from.y * cellSize + cellSize / 2);
    ctx.lineTo(shot.to.x * cellSize + cellSize / 2, shot.to.y * cellSize + cellSize / 2);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

function drawBall(ctx: CanvasRenderingContext2D, pos: Position, cellSize: number) {
  const cx = pos.x * cellSize + cellSize / 2;
  const cy = pos.y * cellSize + cellSize / 2;
  const radius = 8;

  ctx.fillStyle = BALL_COLOUR;
  ctx.strokeStyle = BALL_OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function GameCanvas({ state, animatedBall }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const courseImageRef = useRef<ImageBitmap | null>(null);
  const lastCourseRef = useRef<Course | null>(null);

  // Cache the course render as an ImageBitmap
  const renderCourseToCache = useCallback((course: Course) => {
    const offscreen = new OffscreenCanvas(course.width * CELL_SIZE, course.height * CELL_SIZE);
    const ctx = offscreen.getContext("2d") as unknown as CanvasRenderingContext2D | null;
    if (!ctx) return;
    drawCourse(ctx, course, CELL_SIZE);
    createImageBitmap(offscreen).then((bitmap) => {
      courseImageRef.current = bitmap;
      lastCourseRef.current = course;
    });
  }, []);

  // Draw frame
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state.course) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Re-cache course if it changed
    if (state.course !== lastCourseRef.current) {
      renderCourseToCache(state.course);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw cached course or render directly
    if (courseImageRef.current) {
      ctx.drawImage(courseImageRef.current, 0, 0);
    } else {
      drawCourse(ctx, state.course, CELL_SIZE);
    }

    // Shot path
    drawShotPath(ctx, state.shotHistory, CELL_SIZE);

    // Ball
    const ballPos = animatedBall ?? state.ball;
    if (!state.isComplete) {
      drawBall(ctx, ballPos, CELL_SIZE);
    }
  }, [state, animatedBall, renderCourseToCache]);

  useEffect(() => {
    draw();
  }, [draw]);

  if (!state.course) return null;

  return (
    <canvas
      ref={canvasRef}
      width={state.course.width * CELL_SIZE}
      height={state.course.height * CELL_SIZE}
      className="game-canvas"
    />
  );
}
