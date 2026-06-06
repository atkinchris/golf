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

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <span style={styles.label}>
          Stroke <strong>{state.stroke}</strong>
        </span>
        <span style={styles.label}>
          Par <strong>{state.par}</strong>
        </span>
        {state.stroke > 0 && (
          <span style={styles.score}>{scoreLabel(state.stroke, state.par)}</span>
        )}
      </div>
      <div style={styles.row}>
        <span style={styles.label}>
          Mulligans{" "}
          <strong>
            {"●".repeat(state.mulligansRemaining)}
            {"○".repeat(6 - state.mulligansRemaining)}
          </strong>
        </span>
        {terrain && <span style={styles.terrain}>{terrainLabel(terrain)}</span>}
        {state.rawRoll !== null && (
          <span style={styles.roll}>
            Roll: <strong>{state.rawRoll}</strong>
            {state.currentRoll !== state.rawRoll && (
              <>
                {" "}
                → <strong>{state.currentRoll}</strong>
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "8px 12px",
    background: "#1a1a2e",
    color: "#e0e0e0",
    fontFamily: "system-ui, sans-serif",
    fontSize: "14px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "2px",
  },
  label: {
    flex: 1,
  },
  score: {
    fontWeight: "bold",
    color: "#ffd700",
  },
  terrain: {
    color: "#a8e06c",
    fontSize: "12px",
  },
  roll: {
    color: "#fff",
  },
};
