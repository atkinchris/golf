import { useCallback, useEffect, useMemo, useState } from "react";
import { reduce } from "../engine/reducer";
import { type Direction, type GameEvent, GRID_HEIGHT, GRID_WIDTH, Phase } from "../engine/types";
import { useAnimation } from "../hooks/useAnimation";
import { useGameStorage } from "../hooks/useGameStorage";
import { DiceButton } from "./DiceButton";
import { DirectionPicker } from "./DirectionPicker";
import { GameCanvas } from "./GameCanvas";
import { HUD } from "./HUD";

function generateSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function App() {
  const { loadedEvents, saveEvents, recordCompletion } = useGameStorage();
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [initialised, setInitialised] = useState(false);

  // Load saved game or start new
  useEffect(() => {
    if (initialised) return;
    if (loadedEvents && loadedEvents.length > 0) {
      setEvents(loadedEvents);
    } else {
      setEvents([
        {
          type: "GameStarted",
          seed: generateSeed(),
          gridWidth: GRID_WIDTH,
          gridHeight: GRID_HEIGHT,
        },
      ]);
    }
    setInitialised(true);
  }, [loadedEvents, initialised]);

  // Derive state from events
  const state = useMemo(() => reduce(events), [events]);

  // Animation
  const { animatedBall, isAnimating } = useAnimation(state.ball);

  // Auto-save on every event change
  useEffect(() => {
    if (events.length > 0) {
      saveEvents(events);
    }
  }, [events, saveEvents]);

  // Record completion
  useEffect(() => {
    if (state.isComplete && state.course) {
      recordCompletion(state.course.seed, state.stroke, state.par);
    }
  }, [state.isComplete, state.course, state.stroke, state.par, recordCompletion]);

  const dispatch = useCallback((event: GameEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const handleRoll = useCallback(() => {
    const value = Math.floor(Math.random() * 6) + 1;
    dispatch({ type: "DiceRolled", value });
  }, [dispatch]);

  const handleMulligan = useCallback(() => {
    dispatch({ type: "MulliganUsed" });
    // Immediately roll after mulligan
    setTimeout(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      dispatch({ type: "DiceRolled", value });
    }, 50);
  }, [dispatch]);

  const handleDirection = useCallback(
    (direction: Direction) => {
      if (state.phase === Phase.AwaitingDirection) {
        dispatch({ type: "DirectionChosen", direction });
      } else {
        // Putt in the given direction (from AwaitingRoll or AwaitingDirection)
        dispatch({ type: "PuttChosen", direction });
      }
    },
    [dispatch, state.phase],
  );

  const handlePutt = useCallback(() => {
    // Putt mode: direction arrows now move 1 cell
    // We don't do anything here except indicate putt mode
    // The DirectionPicker handles the actual direction
    // For simplicity, if we're in AwaitingDirection, show putt as moving 1
    // Actually, we need a way for the user to pick putt direction
    // For now, let's make it so clicking putt then clicking a direction sends PuttChosen
  }, []);

  const handleNewGame = useCallback(() => {
    const newEvents: GameEvent[] = [
      {
        type: "GameStarted",
        seed: generateSeed(),
        gridWidth: GRID_WIDTH,
        gridHeight: GRID_HEIGHT,
      },
    ];
    setEvents(newEvents);
  }, []);

  // Calculate cell size based on viewport width
  const cellSize = useMemo(() => {
    if (typeof window === "undefined") return 16;
    const maxWidth = Math.min(window.innerWidth, 480);
    return Math.floor(maxWidth / GRID_WIDTH);
  }, []);

  if (!initialised) return null;

  return (
    <div style={styles.container}>
      <div style={styles.canvasContainer}>
        <GameCanvas state={state} animatedBall={animatedBall} cellSize={cellSize} />
      </div>

      <HUD state={state} />

      {state.phase === Phase.HoledOut ? (
        <div style={styles.gameOver}>
          <div style={styles.gameOverText}>
            Holed out in <strong>{state.stroke}</strong> strokes!
            {state.stroke <= state.par && " 🏆"}
          </div>
          <button type="button" style={styles.newGameButton} onClick={handleNewGame}>
            New Game
          </button>
        </div>
      ) : (
        <>
          <DirectionPicker state={state} onDirection={handleDirection} disabled={isAnimating} />
          <DiceButton
            state={state}
            onRoll={handleRoll}
            onMulligan={handleMulligan}
            onPutt={handlePutt}
            disabled={isAnimating}
          />
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    background: "#0f0f23",
    maxWidth: "480px",
    margin: "0 auto",
  },
  canvasContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    overflow: "hidden",
  },
  gameOver: {
    padding: "24px",
    textAlign: "center" as const,
  },
  gameOverText: {
    color: "#ffd700",
    fontSize: "20px",
    marginBottom: "16px",
    fontFamily: "system-ui, sans-serif",
  },
  newGameButton: {
    padding: "14px 32px",
    fontSize: "16px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "10px",
    background: "#4a90d9",
    color: "#fff",
    cursor: "pointer",
    touchAction: "manipulation",
  },
};
