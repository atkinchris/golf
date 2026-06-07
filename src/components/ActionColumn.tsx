import { type GameState, Phase } from "../engine/types";
import "./ActionColumn.css";

interface Props {
  state: GameState;
  onRoll: () => void;
  disabled: boolean;
}

export function ActionColumn({ state, onRoll, disabled }: Props) {
  const { phase } = state;

  if (phase === Phase.HoledOut || phase === Phase.NotStarted) {
    return null;
  }

  const canRoll = phase === Phase.AwaitingRoll;
  const isPlaceholder = !canRoll;

  return (
    <div className={`action-column${isPlaceholder ? " action-column--hidden" : ""}`}>
      {canRoll && (
        <button
          type="button"
          className="action-button action-button--roll"
          onClick={onRoll}
          disabled={disabled}
        >
          🎲{"\n"}Roll
        </button>
      )}
    </div>
  );
}
