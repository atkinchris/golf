/**
 * Golf Game Engine Demo
 * 
 * This demo shows how to use the golf game engine to play a complete game.
 */

import { GolfGameEngine, GameEvent } from './index'

// Create game engine
const engine = new GolfGameEngine()
const events: GameEvent[] = []

// Listen to all game events
engine.addEventListener((event) => {
  events.push(event)
  console.log(`Event: ${event.type}`, event)
})

// Demo function to play a simple game
export function playDemoGame(): void {
  console.log('🏌️ Starting Golf Game Demo\n')

  // Start the game
  console.log('1. Starting game...')
  let error = engine.processCommand({ type: 'startGame', seed: 12345 })
  if (error) {
    console.error('Failed to start game:', error)
    return
  }

  // Start first turn
  console.log('\n2. Starting first turn...')
  error = engine.processCommand({ type: 'startTurn', seed: 42 })
  if (error) {
    console.error('Failed to start turn:', error)
    return
  }

  let state = engine.getState()
  console.log(`Current position: (${state.currentPosition.row}, ${state.currentPosition.col})`)
  console.log(`Dice roll: ${state.lastDiceRoll}`)
  console.log(`Available directions: ${state.availableDirections.join(', ')}`)

  // Make a move
  console.log('\n3. Making first move north...')
  error = engine.processCommand({ type: 'move', direction: 'north' })
  if (error) {
    console.error('Move failed:', error)
    console.log('Trying a putt instead...')
    error = engine.processCommand({ type: 'putt', direction: 'north' })
  }

  state = engine.getState()
  console.log(`New position: (${state.currentPosition.row}, ${state.currentPosition.col})`)
  console.log(`Current terrain: ${state.currentTerrain}`)
  console.log(`Score: ${state.score}`)

  // Try another turn
  console.log('\n4. Starting second turn...')
  error = engine.processCommand({ type: 'startTurn', seed: 123 })
  if (error) {
    console.error('Failed to start turn:', error)
    return
  }

  state = engine.getState()
  console.log(`Dice roll: ${state.lastDiceRoll}`)

  // Use a mulligan for demonstration
  console.log('\n5. Using a mulligan...')
  error = engine.processCommand({ type: 'mulligan', seed: 456 })
  if (error) {
    console.error('Mulligan failed:', error)
  } else {
    state = engine.getState()
    console.log(`New dice roll after mulligan: ${state.lastDiceRoll}`)
    console.log(`Mulligans remaining: ${state.mulligansRemaining}`)
  }

  // Try to move towards the hole
  console.log('\n6. Moving towards the hole...')
  const holePosition = engine.getGrid().findHolePosition()
  console.log(`Hole is at: (${holePosition.row}, ${holePosition.col})`)

  // Make a strategic move
  error = engine.processCommand({ type: 'move', direction: 'northeast' })
  if (error) {
    console.log('Move failed, trying putt...')
    error = engine.processCommand({ type: 'putt', direction: 'east' })
  }

  state = engine.getState()
  console.log(`Position after move: (${state.currentPosition.row}, ${state.currentPosition.col})`)
  
  if (state.isGameOver) {
    console.log('\n🎉 Game completed!')
    console.log(`Final score: ${state.score} strokes`)
  } else {
    console.log('\n⛳ Game in progress...')
    console.log(`Current score: ${state.score} strokes`)
    console.log(`Game state: ${state.isGameOver ? 'Complete' : 'In Progress'}`)
  }

  console.log('\n📊 Game Summary:')
  console.log(`Total events: ${events.length}`)
  console.log(`Move history: ${state.moveHistory.length} moves`)
  console.log(`Mulligans used: ${6 - state.mulligansRemaining}`)

  // Show the move history
  if (state.moveHistory.length > 0) {
    console.log('\n📍 Move History:')
    state.moveHistory.forEach((move, index) => {
      console.log(`  ${index + 1}. ${move.action} from (${move.fromPosition.row},${move.fromPosition.col}) to (${move.toPosition.row},${move.toPosition.col}) - ${move.modifiedRoll} spaces`)
    })
  }
}

// Export for testing
export function getDemoEngine(): GolfGameEngine {
  return engine
}

export function getDemoEvents(): GameEvent[] {
  return events
}

// Run demo if this file is executed directly
if (require.main === module) {
  playDemoGame()
}