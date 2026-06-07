import { useCallback, useEffect, useMemo, useState } from "react";
import { reduce } from "../engine/reducer";
import { type Direction, type GameEvent, GRID_HEIGHT, GRID_WIDTH, Phase } from "../engine/types";
import { useAnimation } from "../hooks/useAnimation";
import { useGameStorage } from "../hooks/useGameStorage";
import { useIsWide } from "../hooks/useIsWide";
import { ActionColumn } from "./ActionColumn";
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

  const isWide = useIsWide();

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
        // Tap an arrow before rolling = putt
        dispatch({ type: "PuttChosen", direction });
      }
    },
    [dispatch, state.phase],
  );

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

  if (!initialised) return null;

  return (
    <div style={isWide ? styles.containerWide : styles.containerMobile}>
      {isWide ? (
        <>
          {/* Left pane: canvas */}
          <div style={styles.canvasPaneWide}>
            <GameCanvas state={state} animatedBall={animatedBall} />
          </div>
          {/* Right pane: controls */}
          <div style={styles.controlsPaneWide}>
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
              <div style={styles.controlsGroupWide}>
                <DirectionPicker state={state} onDirection={handleDirection} disabled={isAnimating} />
                <ActionColumn
                  state={state}
                  onRoll={handleRoll}
                  onMulligan={handleMulligan}
                  disabled={isAnimating}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Canvas fills remaining space */}
          <div style={styles.canvasContainerMobile}>
            <GameCanvas state={state} animatedBall={animatedBall} />
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
            <div style={styles.controlsRow}>
              <DirectionPicker state={state} onDirection={handleDirection} disabled={isAnimating} />
              <ActionColumn
                state={state}
                onRoll={handleRoll}
                onMulligan={handleMulligan}
                disabled={isAnimating}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  // --- Mobile layout ---
  containerMobile: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    overflow: "hidden",
    background: "#0f0f23",
  },
  canvasContainerMobile: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    minHeight: 0, // allows flex child to shrink below content size
  },
  // --- Desktop/wide layout ---
  containerWide: {
    display: "flex",
    flexDirection: "row",
    height: "100dvh",
    overflow: "hidden",
    background: "#0f0f23",
  },
  canvasPaneWide: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    minWidth: 0,
    maxWidth: "400px",
  },
  controlsPaneWide: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "16px",
    overflow: "hidden",
  },
  controlsGroupWide: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "8px",
  },
  // --- Shared ---
  controlsRow: {
    display: "flex",
    alignItems: "stretch",
    gap: "8px",
    padding: "6px 8px 12px",
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
