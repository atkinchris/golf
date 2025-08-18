/**
 * Comprehensive test suite for the Golf Game Engine
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GolfGameEngine } from './engine'
import { Grid } from './grid'
import { Position, GameEvent, Direction } from './types'

describe('GolfGameEngine', () => {
  let engine: GolfGameEngine
  let grid: Grid
  let events: GameEvent[]

  beforeEach(() => {
    grid = new Grid()
    engine = new GolfGameEngine(grid)
    events = []

    // Capture events
    engine.addEventListener(event => {
      events.push(event)
    })
  })

  describe('Game Initialization', () => {
    it('should initialize with correct default state', () => {
      const state = engine.getState()

      expect(state.score).toBe(0)
      expect(state.mulligansRemaining).toBe(6)
      expect(state.isGameOver).toBe(false)
      expect(state.lastDiceRoll).toBe(null)
      expect(state.moveHistory).toHaveLength(0)
      expect(state.canReRoll).toBe(false)
    })

    it('should start game and emit gameStarted event', () => {
      const teePosition = grid.findTeePosition()
      const error = engine.processCommand({ type: 'startGame', seed: 12345 })

      expect(error).toBe(null)
      expect(events).toHaveLength(1)
      expect(events[0]).toEqual({
        type: 'gameStarted',
        playerPosition: teePosition,
        terrain: 'tee',
      })
    })

    it('should start game at custom position', () => {
      const customPosition: Position = { row: 5, col: 5 }
      const error = engine.processCommand({
        type: 'startGame',
        seed: 12345,
        playerStart: customPosition,
      })

      expect(error).toBe(null)
      expect(events[0]).toMatchObject({
        type: 'gameStarted',
        playerPosition: customPosition,
      })
    })

    it('should not allow starting game twice', () => {
      engine.processCommand({ type: 'startGame', seed: 12345 })
      const error = engine.processCommand({ type: 'startGame', seed: 54321 })

      expect(error).toEqual({
        type: 'invalidMove',
        reason: 'Game already started',
      })
    })
  })

  describe('Turn Management', () => {
    beforeEach(() => {
      engine.processCommand({ type: 'startGame', seed: 12345 })
      events.length = 0 // Clear events after setup
    })

    it('should start turn and roll dice', () => {
      const error = engine.processCommand({ type: 'startTurn', seed: 42 })

      expect(error).toBe(null)
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('turnStarted')

      const turnEvent = events[0] as Extract<GameEvent, { type: 'turnStarted' }>
      expect(turnEvent.diceRoll).toBeGreaterThanOrEqual(1)
      expect(turnEvent.diceRoll).toBeLessThanOrEqual(6)
      expect(turnEvent.modifiedRoll).toBeGreaterThanOrEqual(1)
      expect(turnEvent.availableActions).toContain('move')
      expect(turnEvent.availableActions).toContain('putt')
      expect(turnEvent.availableActions).toContain('mulligan')
    })

    it('should not allow starting turn without game started', () => {
      const newEngine = new GolfGameEngine(grid)
      const error = newEngine.processCommand({ type: 'startTurn' })

      expect(error).toEqual({
        type: 'invalidMove',
        reason: 'Game not started',
      })
    })
  })

  describe('Movement', () => {
    beforeEach(() => {
      engine.processCommand({ type: 'startGame', seed: 12345 })
      engine.processCommand({ type: 'startTurn', seed: 42 })
      events.length = 0 // Clear setup events
    })

    it('should execute valid move', () => {
      const state = engine.getState()
      const initialPosition = state.currentPosition

      const error = engine.processCommand({ type: 'move', direction: 'north' })

      expect(error).toBe(null)
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('playerMoved')

      const newState = engine.getState()
      expect(newState.currentPosition).not.toEqual(initialPosition)
      expect(newState.moveHistory).toHaveLength(1)
    })

    it('should reject move without dice roll', () => {
      const newEngine = new GolfGameEngine(grid)
      newEngine.processCommand({ type: 'startGame', seed: 12345 })

      const error = newEngine.processCommand({ type: 'move', direction: 'north' })

      expect(error).toEqual({
        type: 'invalidMove',
        reason: 'No dice roll available. Start a turn first.',
      })
    })

    it('should handle invalid move direction', () => {
      // Try to move into a blocked area or invalid position
      const blockedDirection: Direction = 'south' // Assuming this goes out of bounds from tee

      const error = engine.processCommand({ type: 'move', direction: blockedDirection })

      // Should either succeed or fail with proper error
      if (error) {
        expect(error.type).toBe('invalidMove')
        expect(events.some(e => e.type === 'invalidMove')).toBe(true)
      } else {
        expect(events.some(e => e.type === 'playerMoved')).toBe(true)
      }
    })
  })

  describe('Putting', () => {
    beforeEach(() => {
      engine.processCommand({ type: 'startGame', seed: 12345 })
      events.length = 0 // Clear setup events
    })

    it('should execute putt move', () => {
      const error = engine.processCommand({ type: 'putt', direction: 'north' })

      expect(error).toBe(null)
      expect(events).toHaveLength(2) // puttExecuted + playerMoved
      expect(events[0].type).toBe('puttExecuted')
      expect(events[1].type).toBe('playerMoved')

      const state = engine.getState()
      expect(state.moveHistory).toHaveLength(1)
      expect(state.moveHistory[0].action).toBe('putt')
    })

    it('should not require dice roll for putt', () => {
      const error = engine.processCommand({ type: 'putt', direction: 'north' })
      expect(error).toBe(null)
    })
  })

  describe('Mulligans', () => {
    beforeEach(() => {
      engine.processCommand({ type: 'startGame', seed: 12345 })
      engine.processCommand({ type: 'startTurn', seed: 42 })
      events.length = 0 // Clear setup events
    })

    it('should use mulligan and re-roll', () => {
      const stateBefore = engine.getState()
      const mulligansBefore = stateBefore.mulligansRemaining

      const error = engine.processCommand({ type: 'mulligan', seed: 99 })

      expect(error).toBe(null)
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('mulliganUsed')

      const mulliganEvent = events[0] as Extract<GameEvent, { type: 'mulliganUsed' }>
      expect(mulliganEvent.remaining).toBe(mulligansBefore - 1)
      expect(mulliganEvent.newRoll).toBeGreaterThanOrEqual(0)
    })

    it('should not allow mulligan when none remaining', () => {
      // Use all mulligans
      for (let i = 0; i < 6; i++) {
        engine.processCommand({ type: 'mulligan' })
      }

      const error = engine.processCommand({ type: 'mulligan' })
      expect(error).toEqual({ type: 'noMulligansLeft' })
    })
  })

  describe('Terrain Effects', () => {
    it('should apply fairway bonus', () => {
      // Create a simple grid with fairway terrain
      const simpleGrid = new Grid(['■■■■■■■■■■■■■■■■'])
      const testEngine = new GolfGameEngine(simpleGrid)
      const testEvents: GameEvent[] = []
      testEngine.addEventListener(event => testEvents.push(event))

      testEngine.processCommand({ type: 'startGame', playerStart: { row: 0, col: 0 }, seed: 12345 })
      testEngine.processCommand({ type: 'startTurn', seed: 42 })

      const turnEvent = testEvents.find(e => e.type === 'turnStarted') as Extract<GameEvent, { type: 'turnStarted' }>

      // With fairway bonus, modified roll should be base roll + 1
      expect(turnEvent.modifiedRoll).toBe(turnEvent.diceRoll + 1)
    })

    it('should apply sand trap penalty', () => {
      // Create a simple grid with sand trap terrain
      const simpleGrid = new Grid(['▨▨▨▨▨▨▨▨▨▨▨▨▨▨▨▨'])
      const testEngine = new GolfGameEngine(simpleGrid)
      const testEvents: GameEvent[] = []
      testEngine.addEventListener(event => testEvents.push(event))

      testEngine.processCommand({ type: 'startGame', playerStart: { row: 0, col: 0 }, seed: 12345 })
      testEngine.processCommand({ type: 'startTurn', seed: 42 })

      const turnEvent = testEvents.find(e => e.type === 'turnStarted') as Extract<GameEvent, { type: 'turnStarted' }>

      // With sand trap penalty, modified roll should be max(0, base roll - 1)
      expect(turnEvent.modifiedRoll).toBe(Math.max(0, turnEvent.diceRoll - 1))
    })
  })

  describe('Win Condition', () => {
    it('should detect game completion when reaching hole', () => {
      // Create a simple 2x2 grid with hole adjacent to start
      const simpleGrid = new Grid(['○◉', '••'])
      const engine = new GolfGameEngine(simpleGrid)
      const events: GameEvent[] = []
      engine.addEventListener(event => events.push(event))

      engine.processCommand({ type: 'startGame', seed: 12345 })
      engine.processCommand({ type: 'putt', direction: 'east' })

      const state = engine.getState()
      expect(state.isGameOver).toBe(true)

      const completionEvent = events.find(e => e.type === 'gameCompleted')
      expect(completionEvent).toBeTruthy()
    })
  })

  describe('Deterministic Behavior', () => {
    it('should produce identical results with same seed', () => {
      // Test first run
      const engine1 = new GolfGameEngine(grid)
      const events1: GameEvent[] = []
      engine1.addEventListener(event => events1.push(event))

      engine1.processCommand({ type: 'startGame', seed: 42 })
      engine1.processCommand({ type: 'startTurn', seed: 123 })

      // Test second run with same seeds
      const engine2 = new GolfGameEngine(grid)
      const events2: GameEvent[] = []
      engine2.addEventListener(event => events2.push(event))

      engine2.processCommand({ type: 'startGame', seed: 42 })
      engine2.processCommand({ type: 'startTurn', seed: 123 })

      // Compare turn started events
      const turn1 = events1.find(e => e.type === 'turnStarted') as Extract<GameEvent, { type: 'turnStarted' }>
      const turn2 = events2.find(e => e.type === 'turnStarted') as Extract<GameEvent, { type: 'turnStarted' }>

      expect(turn1.diceRoll).toBe(turn2.diceRoll)
      expect(turn1.modifiedRoll).toBe(turn2.modifiedRoll)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset game to initial state', () => {
      // Play some moves
      engine.processCommand({ type: 'startGame', seed: 12345 })
      engine.processCommand({ type: 'startTurn', seed: 42 })
      engine.processCommand({ type: 'move', direction: 'north' })

      // Reset
      const error = engine.processCommand({ type: 'reset' })
      expect(error).toBe(null)

      const state = engine.getState()
      expect(state.score).toBe(0)
      expect(state.mulligansRemaining).toBe(6)
      expect(state.isGameOver).toBe(false)
      expect(state.lastDiceRoll).toBe(null)
      expect(state.moveHistory).toHaveLength(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle game over state correctly', () => {
      // Create simple grid where we can easily win
      const simpleGrid = new Grid(['○◉'])
      const testEngine = new GolfGameEngine(simpleGrid)

      testEngine.processCommand({ type: 'startGame', seed: 12345 })
      testEngine.processCommand({ type: 'putt', direction: 'east' })

      // Try to make another move after game over
      const error = testEngine.processCommand({ type: 'startTurn' })
      expect(error).toEqual({
        type: 'gameOver',
        reason: 'Game is already over',
      })
    })

    it('should handle invalid positions gracefully', () => {
      const error = engine.processCommand({
        type: 'startGame',
        playerStart: { row: -1, col: -1 },
      })

      expect(error).toEqual({
        type: 'invalidPosition',
        position: { row: -1, col: -1 },
      })
    })
  })
})

describe('Grid System', () => {
  let grid: Grid

  beforeEach(() => {
    grid = new Grid()
  })

  describe('Grid Initialization', () => {
    it('should have correct dimensions', () => {
      expect(grid.width).toBe(16)
      expect(grid.height).toBe(26)
    })

    it('should find tee position', () => {
      const teePosition = grid.findTeePosition()
      expect(grid.getTerrain(teePosition)).toBe('tee')
    })

    it('should find hole position', () => {
      const holePosition = grid.findHolePosition()
      expect(grid.getTerrain(holePosition)).toBe('hole')
    })
  })

  describe('Position Validation', () => {
    it('should validate positions correctly', () => {
      expect(grid.isValidPosition({ row: 0, col: 0 })).toBe(true)
      expect(grid.isValidPosition({ row: 25, col: 15 })).toBe(true)
      expect(grid.isValidPosition({ row: -1, col: 0 })).toBe(false)
      expect(grid.isValidPosition({ row: 0, col: -1 })).toBe(false)
      expect(grid.isValidPosition({ row: 26, col: 0 })).toBe(false)
      expect(grid.isValidPosition({ row: 0, col: 16 })).toBe(false)
    })
  })

  describe('Path Calculation', () => {
    it('should calculate straight paths correctly', () => {
      const from: Position = { row: 5, col: 5 }
      const path = grid.getPathPositions(from, 'north', 3)

      expect(path).toEqual([
        { row: 4, col: 5 },
        { row: 3, col: 5 },
        { row: 2, col: 5 },
      ])
    })

    it('should stop path at grid boundary', () => {
      const from: Position = { row: 1, col: 1 }
      const path = grid.getPathPositions(from, 'north', 5)

      expect(path).toEqual([{ row: 0, col: 1 }])
    })
  })

  describe('Distance Calculation', () => {
    it('should calculate Chebyshev distance correctly', () => {
      const pos1: Position = { row: 0, col: 0 }
      const pos2: Position = { row: 3, col: 4 }

      expect(grid.getDistance(pos1, pos2)).toBe(4)
    })

    it('should detect adjacent positions', () => {
      const pos1: Position = { row: 5, col: 5 }
      const pos2: Position = { row: 5, col: 6 }
      const pos3: Position = { row: 7, col: 7 }

      expect(grid.isAdjacent(pos1, pos2)).toBe(true)
      expect(grid.isAdjacent(pos1, pos3)).toBe(false)
    })
  })
})
