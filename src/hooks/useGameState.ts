import { useState, useCallback } from 'react'
import type { GameState, Direction, Course } from '../types/game'
import {
  rollDice,
  calculateMovement,
  validateMove,
  getTerrainModifier,
  handleSlopeMovement,
  checkHoleCompletion,
  checkHoleOvershoot,
} from '../utils/gameLogic'
import { generateBasicCourse } from '../utils/courseGenerator'

const INITIAL_GAME_STATE: GameState = {
  ballPosition: { x: 0, y: 0 },
  currentScore: 0,
  mulligansRemaining: 6,
  lastRoll: null,
  canReroll: false,
  isTeingOff: true,
  gamePhase: 'rolling',
  availableDirections: [],
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE)
  const [course] = useState<Course>(() => generateBasicCourse())

  const handleDiceRoll = useCallback(() => {
    const roll = rollDice()
    setGameState(prev => ({
      ...prev,
      lastRoll: roll,
      canReroll: prev.isTeingOff,
      gamePhase: 'moving',
      availableDirections: ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'],
    }))
  }, [])

  const handleReroll = useCallback(() => {
    const roll = rollDice()
    setGameState(prev => ({
      ...prev,
      lastRoll: roll,
      canReroll: false,
    }))
  }, [])

  const handleUseMulligan = useCallback(() => {
    if (gameState.mulligansRemaining > 0) {
      const roll = rollDice()
      setGameState(prev => ({
        ...prev,
        lastRoll: roll,
        mulligansRemaining: prev.mulligansRemaining - 1,
        canReroll: false,
      }))
    }
  }, [gameState.mulligansRemaining])

  const handleMove = useCallback(
    (direction: Direction) => {
      if (!gameState.lastRoll) return

      const currentTile = course.tiles[gameState.ballPosition.y][gameState.ballPosition.x]
      const terrainModifier = getTerrainModifier(currentTile.terrain)
      const actualDistance = Math.max(1, gameState.lastRoll + terrainModifier)

      const newPosition = calculateMovement(gameState.ballPosition, direction, actualDistance)

      // Check for hole overshoot
      const overshoot = checkHoleOvershoot(gameState.ballPosition, newPosition, course.holePosition)
      const targetPosition =
        overshoot.isOvershoot && overshoot.correctedPosition ? overshoot.correctedPosition : newPosition

      const validation = validateMove(gameState.ballPosition, targetPosition, course.tiles, actualDistance)

      if (validation.isValid && validation.finalPosition) {
        let finalPosition = validation.finalPosition

        // Handle slopes - ball continues rolling
        finalPosition = handleSlopeMovement(finalPosition, course.tiles)

        // Check if hole is completed
        const holeCompleted = checkHoleCompletion(finalPosition, course.holePosition)

        const newBallPosition = finalPosition
        setGameState(prev => ({
          ...prev,
          ballPosition: newBallPosition,
          currentScore: prev.currentScore + 1,
          lastRoll: null,
          canReroll: false,
          isTeingOff: false,
          gamePhase: holeCompleted ? 'completed' : 'rolling',
          availableDirections: [],
        }))

        // Show completion message if hole reached
        if (holeCompleted) {
          setTimeout(() => {
            alert(`🎉 Hole completed in ${(gameState.currentScore + 1).toString()} strokes! Par was 6.`)
          }, 100)
        }
      }
    },
    [gameState.ballPosition, gameState.lastRoll, gameState.currentScore, course.tiles, course.holePosition]
  )

  const getMovementRange = useCallback(() => {
    if (!gameState.lastRoll) return 0

    const currentTile = course.tiles[gameState.ballPosition.y][gameState.ballPosition.x]
    const terrainModifier = getTerrainModifier(currentTile.terrain)
    return Math.max(1, gameState.lastRoll + terrainModifier)
  }, [gameState.lastRoll, gameState.ballPosition, course.tiles])

  // Testing utility function
  const testSetBallPosition = useCallback((x: number, y: number, _terrain?: string) => {
    setGameState(prev => ({
      ...prev,
      ballPosition: { x, y },
    }))

    // Expose for testing
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      ;(window as any).testSetBallPosition = testSetBallPosition
    }
  }, [])

  return {
    gameState,
    course,
    actions: {
      rollDice: handleDiceRoll,
      reroll: handleReroll,
      useMulligan: handleUseMulligan,
      move: handleMove,
    },
    getMovementRange,
    testSetBallPosition,
  }
}
