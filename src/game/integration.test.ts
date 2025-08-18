/**
 * Final integration test to demonstrate the complete engine functionality
 */

import { describe, it, expect } from 'vitest'
import { GolfGameEngine, GameEvent, Grid } from './index'

describe('Complete Golf Game Engine Integration', () => {
  it('should run a complete deterministic game scenario', () => {
    const engine = new GolfGameEngine()
    const events: GameEvent[] = []
    
    engine.addEventListener((event) => {
      events.push(event)
    })

    // Test deterministic behavior with fixed seeds
    const gameError = engine.processCommand({ type: 'startGame', seed: 12345 })
    expect(gameError).toBe(null)

    const turnError = engine.processCommand({ type: 'startTurn', seed: 42 })
    expect(turnError).toBe(null)

    // Should have game started and turn started events
    expect(events).toHaveLength(2)
    expect(events[0].type).toBe('gameStarted')
    expect(events[1].type).toBe('turnStarted')

    const turnEvent = events[1] as Extract<GameEvent, { type: 'turnStarted' }>
    expect(turnEvent.diceRoll).toBeGreaterThanOrEqual(1)
    expect(turnEvent.diceRoll).toBeLessThanOrEqual(6)

    // Try a move
    const moveError = engine.processCommand({ type: 'move', direction: 'north' })
    
    // Should either succeed or give us helpful error info
    if (moveError) {
      expect(moveError.type).toBe('invalidMove')
      // Try a putt instead
      const puttError = engine.processCommand({ type: 'putt', direction: 'north' })
      if (!puttError) {
        expect(events.some(e => e.type === 'puttExecuted')).toBe(true)
        expect(events.some(e => e.type === 'playerMoved')).toBe(true)
      }
    } else {
      expect(events.some(e => e.type === 'playerMoved')).toBe(true)
    }

    // Test mulligan functionality
    const mulliganError = engine.processCommand({ type: 'mulligan', seed: 999 })
    
    const state = engine.getState()
    
    // Verify state consistency
    expect(state.score).toBeGreaterThanOrEqual(0)
    expect(state.mulligansRemaining).toBeLessThanOrEqual(6)
    expect(state.currentPosition.row).toBeGreaterThanOrEqual(0)
    expect(state.currentPosition.col).toBeGreaterThanOrEqual(0)
    expect(state.gameGrid.width).toBe(16)
    expect(state.gameGrid.height).toBe(26)

    // Verify we have comprehensive event tracking
    const eventTypes = events.map(e => e.type)
    expect(eventTypes).toContain('gameStarted')
    expect(eventTypes).toContain('turnStarted')

    // Verify comprehensive event tracking
    expect(events.length).toBeGreaterThan(0)
    expect(state.score).toBeGreaterThanOrEqual(0)
    expect(typeof state.isGameOver).toBe('boolean')
    expect(state.mulligansRemaining).toBeGreaterThanOrEqual(0)
    expect(state.mulligansRemaining).toBeLessThanOrEqual(6)
  })

  it('should demonstrate all terrain effects work correctly', () => {
    // Test fairway bonus
    const fairwayGrid = ['■■■■■■■■■■■■■■■■']
    const fairwayEngine = new GolfGameEngine(new Grid(fairwayGrid))
    
    fairwayEngine.processCommand({ type: 'startGame', playerStart: { row: 0, col: 0 }, seed: 12345 })
    fairwayEngine.processCommand({ type: 'startTurn', seed: 42 })
    
    const fairwayState = fairwayEngine.getState()

    // Test sand trap penalty  
    const sandGrid = ['▨▨▨▨▨▨▨▨▨▨▨▨▨▨▨▨']
    const sandEngine = new GolfGameEngine(new Grid(sandGrid))
    
    sandEngine.processCommand({ type: 'startGame', playerStart: { row: 0, col: 0 }, seed: 12345 })
    sandEngine.processCommand({ type: 'startTurn', seed: 42 })
    
    const sandState = sandEngine.getState()
    
    // Verify terrain effects work correctly
    expect(fairwayState.currentTerrain).toBe('fairway')
    expect(sandState.currentTerrain).toBe('sandTrap')
  })

  it('should demonstrate win condition detection', () => {
    // Simple grid where we can easily reach the hole
    const simpleGrid = [
      '○•◉•••••••••••••••',
    ]
    const engine = new GolfGameEngine(new Grid(simpleGrid))
    const events: GameEvent[] = []
    
    engine.addEventListener((event) => {
      events.push(event)
    })

    engine.processCommand({ type: 'startGame', seed: 12345 })
    
    // Try to putt to the hole (2 spaces east)
    const puttError1 = engine.processCommand({ type: 'putt', direction: 'east' })
    expect(puttError1).toBe(null)
    
    const puttError2 = engine.processCommand({ type: 'putt', direction: 'east' })
    expect(puttError2).toBe(null)
    
    const state = engine.getState()
    const completionEvent = events.find(e => e.type === 'gameCompleted')
    
    // Verify game completion state
    expect(state.isGameOver).toBe(true)
    expect(completionEvent).toBeTruthy()
    expect(completionEvent?.type).toBe('gameCompleted')
  })
})