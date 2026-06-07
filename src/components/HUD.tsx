import { getBallTerrain } from "../engine/reducer";
import type { GameState } from "../engine/types";
import { Terrain } from "../engine/types";
import "./HUD.css";

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
    <div className="hud">
      <div className="hud-row">
        <span className="hud-score">
          {state.stroke > 0 ? scoreLabel(state.stroke, state.par) : "–"}
        </span>
        <span className="hud-mid">
          Str {state.stroke} / Par {state.par}
        </span>
        <span className="hud-right">
          {"●".repeat(state.mulligansRemaining)}
          {"○".repeat(6 - state.mulligansRemaining)}
          {terrainText && <span className="hud-terrain"> {terrainText}</span>}
          {state.rawRoll !== null && (
            <span className="hud-roll">
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
