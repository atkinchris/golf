import { getBallTerrain } from "../engine/reducer";
import type { GameState } from "../engine/types";
import { Terrain } from "../engine/types";

interface Props {
  state: GameState;
}

function terrainLabel(terrain: Terrain | null): string {
  switch (terrain) {
    case Terrain.Fairway:
      return "Fairway (+1)";
    case Terrain.Sand:
      return "Sand (-1)";
    case Terrain.Rough:
      return "Rough";
    default:
      return "";
  }
}

function scoreLabel(strokes: number, par: number): string {
  const diff = strokes - par;
  if (diff === 0) return "Par";
  if (diff < 0) return `${diff}`;
  return `+${diff}`;
}

export function HUD({ state }: Props) {
  const terrain = getBallTerrain(state);
  const terrainText = terrain ? terrainLabel(terrain) : null;

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <span style={styles.score}>
          {state.stroke > 0 ? scoreLabel(state.stroke, state.par) : "–"}
        </span>
        <span style={styles.mid}>
          Str {state.stroke} / Par {state.par}
        </span>
        <span style={styles.right}>
          {"●".repeat(state.mulligansRemaining)}
          {"○".repeat(6 - state.mulligansRemaining)}
          {terrainText && (
            <span style={styles.terrain}> {terrainText}</span>
          )}
          {state.rawRoll !== null && (
            <span style={styles.roll}>
              {" "}
              🎲{state.rawRoll}
              {state.currentRoll !== state.rawRoll && `\u2192${state.currentRoll}`}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "6px 12px",
    background: "#1a1a2e",
    color: "#e0e0e0",
    fontFamily: "system-ui, sans-serif",
    fontSize: "13px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  score: {
    fontWeight: "bold",
    color: "#ffd700",
    minWidth: "28px",
  },
  mid: {
    flex: 1,
    textAlign: "center" as const,
  },
  right: {
    fontSize: "12px",
    color: "#a0a0c0",
    textAlign: "right" as const,
  },
  terrain: {
    color: "#a8e06c",
  },
  roll: {
    color: "#e0e0e0",
  },
};
