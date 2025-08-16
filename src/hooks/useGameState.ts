import { useState, useCallback } from 'react'
import type { GameState, Direction, Course } from '../types/game'
import { rollDice, calculateMovement, validateMove, getTerrainModifier } from '../utils/gameLogic'
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
      const validation = validateMove(gameState.ballPosition, newPosition, course.tiles, actualDistance)

      if (validation.isValid && validation.finalPosition) {
        const newBallPosition = validation.finalPosition
        setGameState(prev => ({
          ...prev,
          ballPosition: newBallPosition,
          currentScore: prev.currentScore + 1,
          lastRoll: null,
          canReroll: false,
          isTeingOff: false,
          gamePhase: 'rolling',
          availableDirections: [],
        }))
      }
    },
    [gameState.ballPosition, gameState.lastRoll, course.tiles]
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
