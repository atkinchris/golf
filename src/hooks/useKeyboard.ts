import { useEffect } from "react";
import type { Direction } from "../engine/types";
import { Phase } from "../engine/types";

interface UseKeyboardOptions {
  phase: Phase;
  disabled: boolean;
  onRoll: () => void;
  onDirection: (dir: Direction) => void;
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  q: "NW",
  w: "N",
  e: "NE",
  a: "W",
  d: "E",
  z: "SW",
  x: "S",
  c: "SE",
};

const ROLL_KEY = "s";
const ALL_HANDLED_KEYS = new Set([...Object.keys(KEY_TO_DIRECTION), ROLL_KEY]);

export function useKeyboard({ phase, disabled, onRoll, onDirection }: UseKeyboardOptions): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const key = event.key.toLowerCase();
      if (!ALL_HANDLED_KEYS.has(key)) return;

      event.preventDefault();

      if (disabled) return;

      if (key === ROLL_KEY) {
        if (phase === Phase.AwaitingRoll) {
          onRoll();
        }
        return;
      }

      const dir = KEY_TO_DIRECTION[key];
      if (dir !== undefined) {
        if (phase === Phase.AwaitingRoll || phase === Phase.AwaitingDirection) {
          onDirection(dir);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, disabled, onRoll, onDirection]);
}
