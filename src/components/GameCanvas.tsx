import { useCallback, useEffect, useRef } from "react";
import type { Course, GameState, Position } from "../engine/types";
import { Terrain } from "../engine/types";
import "./GameCanvas.css";

const TERRAIN_COLOURS: Record<Terrain, string> = {
  [Terrain.Rough]: "#7ec850",
  [Terrain.Fairway]: "#a8e06c",
  [Terrain.Sand]: "#f0d890",
  [Terrain.Water]: "#4a90d9",
  [Terrain.Trees]: "#2d6e2d",
};

const SLOPE_ARROW_COLOUR = "#00000044";
const BALL_COLOUR = "#ffffff";
const BALL_OUTLINE = "#333333";
const TEE_COLOUR = "#cc4444";
const HOLE_COLOUR = "#111111";
const PATH_COLOUR = "#ffffff88";
const CELL_SIZE = 16;

interface Props {
  state: GameState;
  /** Animated ball position (may differ from state.ball during animation). */
  animatedBall: Position | null;
}

const DIRECTION_ARROWS: Record<string, string> = {
  N: "\u2191",
  NE: "\u2197",
  E: "\u2192",
  SE: "\u2198",
  S: "\u2193",
  SW: "\u2199",
  W: "\u2190",
  NW: "\u2196",
};

function drawCourse(ctx: CanvasRenderingContext2D, course: Course, cellSize: number) {
  for (let y = 0; y < course.height; y++) {
    for (let x = 0; x < course.width; x++) {
      const cell = course.grid[y]?.[x];
      if (!cell) continue;
      ctx.fillStyle = TERRAIN_COLOURS[cell.terrain];
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

      // Grid line
      ctx.strokeStyle = "#00000011";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

      // Slope arrow
      if (cell.slope) {
        ctx.fillStyle = SLOPE_ARROW_COLOUR;
        ctx.font = `${cellSize * 0.6}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          DIRECTION_ARROWS[cell.slope] ?? "",
          x * cellSize + cellSize / 2,
          y * cellSize + cellSize / 2,
        );
      }
    }
  }

  // Tee marker
  ctx.fillStyle = TEE_COLOUR;
  ctx.beginPath();
  ctx.rect(
    course.tee.x * cellSize + cellSize * 0.2,
    course.tee.y * cellSize + cellSize * 0.2,
    cellSize * 0.6,
    cellSize * 0.6,
  );
  ctx.fill();

  // Hole marker
  ctx.fillStyle = HOLE_COLOUR;
  ctx.beginPath();
  ctx.arc(
    course.hole.x * cellSize + cellSize / 2,
    course.hole.y * cellSize + cellSize / 2,
    cellSize * 0.3,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

function drawShotPath(
  ctx: CanvasRenderingContext2D,
  shotHistory: GameState["shotHistory"],
  cellSize: number,
) {
  if (shotHistory.length === 0) return;

  ctx.strokeStyle = PATH_COLOUR;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);

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
  const radius = cellSize * 0.3;

  ctx.fillStyle = BALL_COLOUR;
  ctx.strokeStyle = BALL_OUTLINE;
  ctx.lineWidth = 1.5;
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
