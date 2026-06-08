import type { Course } from "../src/engine/types.ts";
import { Terrain } from "../src/engine/types.ts";

/**
 * Serialise a course grid to a compact text format suitable for LLM consumption.
 * Legend: . = rough, F = fairway, S = sand, W = water, T = tree
 * Slopes shown as directional arrows: ^ v < > / \ (for N, S, W, E, NE/SW, NW/SE)
 * Tee = O, Hole = H
 */
export function serialiseCourse(course: Course): string {
  const slopeChars: Record<string, string> = {
    N: "^",
    S: "v",
    W: "<",
    E: ">",
    NE: "/",
    SW: "/",
    NW: "\\",
    SE: "\\",
  };

  const terrainChars: Record<Terrain, string> = {
    [Terrain.Rough]: ".",
    [Terrain.Fairway]: "F",
    [Terrain.Sand]: "S",
    [Terrain.Water]: "W",
    [Terrain.Trees]: "T",
  };

  const lines: string[] = [];
  lines.push(`Seed: ${course.seed} | Grid: ${course.width}x${course.height}`);
  lines.push(`Tee: (${course.tee.x},${course.tee.y}) | Hole: (${course.hole.x},${course.hole.y})`);
  lines.push(`Legend: . rough, F fairway, S sand, W water, T tree, ^v<>/\\ slope, O tee, H hole`);
  lines.push("");

  // Column numbers header
  lines.push("   " + Array.from({ length: course.width }, (_, i) => (i % 10).toString()).join(""));

  for (let y = 0; y < course.height; y++) {
    let row = String(y).padStart(2, " ") + " ";
    for (let x = 0; x < course.width; x++) {
      if (x === course.tee.x && y === course.tee.y) {
        row += "O";
      } else if (x === course.hole.x && y === course.hole.y) {
        row += "H";
      } else {
        const cell = course.grid[y]?.[x];
        if (!cell) {
          row += "?";
          continue;
        }
        if (cell.slope) {
          row += slopeChars[cell.slope] ?? "F";
        } else {
          row += terrainChars[cell.terrain] ?? "?";
        }
      }
    }
    lines.push(row);
  }

  return lines.join("\n");
}
