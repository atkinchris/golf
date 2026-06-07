import { type GameState, Phase } from "../engine/types";
import "./ActionColumn.css";

interface Props {
  state: GameState;
  onRoll: () => void;
  onMulligan: () => void;
  disabled: boolean;
}

export function ActionColumn({ state, onRoll, onMulligan, disabled }: Props) {
  const { phase, teeOffRerollAvailable, mulligansRemaining } = state;

  if (phase === Phase.HoledOut || phase === Phase.NotStarted) {
    return null;
  }

  const canRoll = phase === Phase.AwaitingRoll;
  const canReroll =
    phase === Phase.AwaitingDirection && (teeOffRerollAvailable || mulligansRemaining > 0);

  const isPlaceholder = !canRoll && !canReroll;

  let rerollLabel = "";
  if (teeOffRerollAvailable) {
    rerollLabel = "Re-roll\n(free)";
  } else if (mulligansRemaining > 0) {
    rerollLabel = `Mulligan\n(${mulligansRemaining} left)`;
  }

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
      {canReroll && (
        <button
          type="button"
          className="action-button action-button--mulligan"
          onClick={onMulligan}
          disabled={disabled}
        >
          {rerollLabel}
        </button>
      )}
    </div>
  );
}
