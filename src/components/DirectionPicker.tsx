import { useMemo } from "react";
import { DIRECTIONS, type Direction, type GameState } from "../engine/types";
import { validateMove } from "../engine/validation";

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
    <div style={styles.grid}>
      {GRID_LAYOUT.map((row, rowIdx) => (
        <div key={ROW_KEYS[rowIdx]} style={styles.row}>
          {row.map((dir) => {
            if (dir === null) {
              // Centre cell - show roll value
              return (
                <div key="centre" style={styles.centerCell}>
                  {state.currentRoll !== null ? (
                    <span style={styles.rollValue}>{state.currentRoll}</span>
                  ) : (
                    <span style={styles.dot}>●</span>
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
                style={{
                  ...styles.arrowButton,
                  opacity: isDisabled ? 0.25 : 1,
                  cursor: isDisabled ? "default" : "pointer",
                }}
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

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    alignItems: "center",
  },
  row: {
    display: "flex",
    gap: "3px",
  },
  arrowButton: {
    width: "44px",
    height: "44px",
    fontSize: "20px",
    border: "2px solid #444",
    borderRadius: "8px",
    background: "#2a2a3e",
    color: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transition: "opacity 0.15s",
  },
  centerCell: {
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #333",
    borderRadius: "8px",
    background: "#1a1a2e",
    color: "#ffd700",
    fontSize: "18px",
    fontWeight: "bold",
  },
  rollValue: {
    fontSize: "18px",
  },
  dot: {
    color: "#555",
    fontSize: "14px",
  },
};
