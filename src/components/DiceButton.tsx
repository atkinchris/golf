import { type GameState, Phase } from "../engine/types";

interface Props {
  state: GameState;
  onRoll: () => void;
  onMulligan: () => void;
  onPutt: () => void;
  disabled: boolean;
}

export function DiceButton({ state, onRoll, onMulligan, onPutt, disabled }: Props) {
  const { phase, teeOffRerollAvailable, mulligansRemaining } = state;

  if (phase === Phase.HoledOut || phase === Phase.NotStarted) {
    return null;
  }

  // Determine what actions are available
  const canRoll = phase === Phase.AwaitingRoll;
  const canReroll =
    phase === Phase.AwaitingDirection && (teeOffRerollAvailable || mulligansRemaining > 0);
  const canPutt = phase === Phase.AwaitingRoll || phase === Phase.AwaitingDirection;

  // Re-roll label
  let rerollLabel = "";
  if (phase === Phase.AwaitingDirection && teeOffRerollAvailable) {
    rerollLabel = "Re-roll (free)";
  } else if (phase === Phase.AwaitingDirection && mulligansRemaining > 0) {
    rerollLabel = `Mulligan (${mulligansRemaining} left)`;
  }

  return (
    <div style={styles.container}>
      <div style={styles.buttonRow}>
        {canPutt && (
          <button
            type="button"
            style={{ ...styles.button, ...styles.puttButton }}
            onClick={onPutt}
            disabled={disabled}
          >
            Putt
          </button>
        )}
        {canRoll && (
          <button
            type="button"
            style={{ ...styles.button, ...styles.rollButton }}
            onClick={onRoll}
            disabled={disabled}
          >
            Roll
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
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "8px 12px 16px",
  },
  buttonRow: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
  },
  button: {
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transition: "transform 0.1s",
    flex: 1,
    maxWidth: "200px",
  },
  rollButton: {
    background: "#4a90d9",
    color: "#fff",
  },
  puttButton: {
    background: "#444",
    color: "#e0e0e0",
  },
  mulliganButton: {
    background: "#d4a843",
    color: "#1a1a2e",
  },
};
