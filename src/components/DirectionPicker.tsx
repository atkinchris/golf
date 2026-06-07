import { useMemo } from "react";
import { DIRECTIONS, type Direction, type GameState } from "../engine/types";
import { validateMove } from "../engine/validation";
import "./DirectionPicker.css";

interface Props {
  state: GameState;
  onDirection: (dir: Direction) => void;
  disabled: boolean;
}

const GRID_LAYOUT: (Direction | null)[][] = [
  ["NW", "N", "NE"],
  ["W", null, "E"],
  ["SW", "S", "SE"],
];

const ARROW_SYMBOLS: Record<Direction, string> = {
  N: "\u2191",
  NE: "\u2197",
  E: "\u2192",
  SE: "\u2198",
  S: "\u2193",
  SW: "\u2199",
  W: "\u2190",
  NW: "\u2196",
};

const ROW_KEYS = ["top", "mid", "bot"] as const;

export function DirectionPicker({ state, onDirection, disabled }: Props) {
  // Compute which directions are valid
  const validDirections = useMemo(() => {
    if (!state.course) return new Set<Direction>();

    // For direction picker, check with current roll distance (or 1 for putt)
    const distance = state.currentRoll ?? 1;
    const valid = new Set<Direction>();

    for (const dir of DIRECTIONS) {
      const result = validateMove(state.course, state.ball, dir, distance);
      if (result.valid) valid.add(dir);
    }

    return valid;
  }, [state.course, state.ball, state.currentRoll]);

  return (
    <div className="direction-grid">
      {GRID_LAYOUT.map((row, rowIdx) => (
        <div key={ROW_KEYS[rowIdx]} className="direction-row">
          {row.map((dir) => {
            if (dir === null) {
              // Centre cell - show roll value
              return (
                <div key="centre" className="direction-centre">
                  {state.currentRoll !== null ? (
                    <span>{state.currentRoll}</span>
                  ) : (
                    <span className="direction-dot">●</span>
                  )}
                </div>
              );
            }

            const isValid = validDirections.has(dir);
            const isDisabled = disabled || !isValid;

            return (
              <button
                type="button"
                key={dir}
                className="arrow-button"
                disabled={isDisabled}
                onClick={() => onDirection(dir)}
                aria-label={`Hit ${dir}`}
              >
                {ARROW_SYMBOLS[dir]}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
