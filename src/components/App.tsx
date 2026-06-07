import { useCallback, useEffect, useMemo, useState } from "react";
import { reduce } from "../engine/reducer";
import { type Direction, type GameEvent, GRID_HEIGHT, GRID_WIDTH, Phase } from "../engine/types";
import { useAnimation } from "../hooks/useAnimation";
import { useGameStorage } from "../hooks/useGameStorage";
import { ActionColumn } from "./ActionColumn";
import "./App.css";
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
    <div className="app">
      <div className="canvas-pane">
        <GameCanvas state={state} animatedBall={animatedBall} />
      </div>
      <div className="controls-pane">
        <HUD state={state} />
        {state.phase === Phase.HoledOut ? (
          <div className="game-over">
            <div className="game-over-text">
              Holed out in <strong>{state.stroke}</strong> strokes!
              {state.stroke <= state.par && " 🏆"}
            </div>
            <button type="button" className="new-game-button" onClick={handleNewGame}>
              New Game
            </button>
          </div>
        ) : (
          <div className="controls-row">
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
    </div>
  );
}
