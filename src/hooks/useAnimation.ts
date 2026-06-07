import { useCallback, useEffect, useRef, useState } from "react";
import type { Position } from "../engine/types";

interface AnimationState {
  from: Position;
  to: Position;
  startTime: number;
  duration: number;
}

/**
 * Interpolates ball position between state changes.
 * Pass gameKey (e.g. course seed) to suppress animation on game reset.
 * Returns the current animated position (or null if idle).
 */
export function useAnimation(
  ballPosition: Position,
  gameKey: string | null,
  duration = 400,
): {
  animatedBall: Position | null;
  isAnimating: boolean;
} {
  const [animatedBall, setAnimatedBall] = useState<Position | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevBallRef = useRef<Position | null>(null);
  const prevGameKeyRef = useRef<string | null>(null);
  const animRef = useRef<AnimationState | null>(null);
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    const anim = animRef.current;
    if (!anim) return;

    const now = performance.now();
    const elapsed = now - anim.startTime;
    const t = Math.min(1, elapsed / anim.duration);

    // Ease out cubic
    const eased = 1 - (1 - t) ** 3;

    const x = anim.from.x + (anim.to.x - anim.from.x) * eased;
    const y = anim.from.y + (anim.to.y - anim.from.y) * eased;

    setAnimatedBall({ x, y });

    if (t < 1) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      // Animation complete
      animRef.current = null;
      setAnimatedBall(null);
      setIsAnimating(false);
    }
  }, []);

  useEffect(() => {
    const gameChanged = gameKey !== prevGameKeyRef.current;
    prevGameKeyRef.current = gameKey;

    const prev = prevBallRef.current;
    if (prev === null || gameChanged) {
      // First position, or game reset - place ball without animation
      cancelAnimationFrame(rafRef.current);
      animRef.current = null;
      setAnimatedBall(null);
      setIsAnimating(false);
      prevBallRef.current = ballPosition;
      return;
    }
    if (prev.x !== ballPosition.x || prev.y !== ballPosition.y) {
      // Ball moved - start animation
      cancelAnimationFrame(rafRef.current);
      animRef.current = {
        from: prev,
        to: ballPosition,
        startTime: performance.now(),
        duration,
      };
      setIsAnimating(true);
      rafRef.current = requestAnimationFrame(animate);
    }
    prevBallRef.current = ballPosition;
  }, [ballPosition, gameKey, duration, animate]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return { animatedBall, isAnimating };
}
