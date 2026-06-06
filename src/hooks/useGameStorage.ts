import { useCallback, useEffect, useState } from "react";
import type { GameEvent } from "../engine/types";

const CURRENT_KEY = "golf:current";
const HISTORY_KEY = "golf:history";

interface SavedGame {
  version: number;
  events: GameEvent[];
}

interface CompletedGame {
  seed: string;
  strokes: number;
  par: number;
  timestamp: number;
}

export function useGameStorage() {
  const [loadedEvents, setLoadedEvents] = useState<GameEvent[] | null>(null);

  // Load current game on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CURRENT_KEY);
      if (raw) {
        const saved: SavedGame = JSON.parse(raw);
        if (saved.version === 1 && Array.isArray(saved.events)) {
          setLoadedEvents(saved.events);
        }
      }
    } catch {
      // Corrupted save - ignore
    }
  }, []);

  const saveEvents = useCallback((events: GameEvent[]) => {
    try {
      const saved: SavedGame = { version: 1, events };
      localStorage.setItem(CURRENT_KEY, JSON.stringify(saved));
    } catch {
      // Storage full or unavailable - ignore
    }
  }, []);

  const clearCurrent = useCallback(() => {
    localStorage.removeItem(CURRENT_KEY);
  }, []);

  const recordCompletion = useCallback(
    (seed: string, strokes: number, par: number) => {
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const history: CompletedGame[] = raw ? JSON.parse(raw) : [];
        history.push({ seed, strokes, par, timestamp: Date.now() });
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        clearCurrent();
      } catch {
        // Ignore
      }
    },
    [clearCurrent],
  );

  return { loadedEvents, saveEvents, clearCurrent, recordCompletion };
}
