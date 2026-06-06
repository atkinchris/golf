import { type GameState, Phase } from "../engine/types";

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
    phase === Phase.AwaitingDirection &&
    (teeOffRerollAvailable || mulligansRemaining > 0);

  // When neither action is available, render an invisible placeholder so the
  // DirectionPicker does not shift position.
  const isPlaceholder = !canRoll && !canReroll;

  let rerollLabel = "";
  if (teeOffRerollAvailable) {
    rerollLabel = "Re-roll\n(free)";
  } else if (mulligansRemaining > 0) {
    rerollLabel = `Mulligan\n(${mulligansRemaining} left)`;
  }

  return (
    <div
      style={{
        ...styles.column,
        opacity: isPlaceholder ? 0 : 1,
        pointerEvents: isPlaceholder ? "none" : "auto",
      }}
    >
      {canRoll && (
        <button
          type="button"
          style={{ ...styles.button, ...styles.rollButton }}
          onClick={onRoll}
          disabled={disabled}
        >
          🎲{"\n"}Roll
        </button>
      )}
      {canReroll && (
        <button
          type="button"
          style={{ ...styles.button, ...styles.mulliganButton }}
          onClick={onMulligan}
          disabled={disabled}
        >
          {rerollLabel}
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  column: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  button: {
    flex: 1,
    fontSize: "14px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    whiteSpace: "pre-line",
    lineHeight: "1.3",
  },
  rollButton: {
    background: "#4a90d9",
    color: "#fff",
  },
  mulliganButton: {
    background: "#d4a843",
    color: "#1a1a2e",
  },
};
