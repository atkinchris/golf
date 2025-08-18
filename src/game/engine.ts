/**
 * Main golf game engine with state machine
 */

import {
  Position,
  Direction,
  Action,
  Move,
  GameCommand,
  GameEvent,
  GameState,
  GameError,
  GAME_CONSTANTS,
} from './types'
import { Grid } from './grid'
import { RulesEngine, DiceRollResult } from './rules'

export class GolfGameEngine {
  private grid: Grid
  private rules: RulesEngine

  // Mutable state
  private currentPosition: Position
  private score: number
  private mulligansRemaining: number
  private isGameOver: boolean
  private lastDiceRoll: number | null
  private moveHistory: Move[]
  private canReRoll: boolean
  private gameStarted: boolean
  private lastRollResult: DiceRollResult | null

  // Event listeners
  private eventListeners: ((event: GameEvent) => void)[] = []

  constructor(grid?: Grid) {
    this.grid = grid || new Grid()
    this.rules = new RulesEngine()

    // Initialize state
    this.currentPosition = { row: 0, col: 0 }
    this.score = 0
    this.mulligansRemaining = GAME_CONSTANTS.MAX_MULLIGANS
    this.isGameOver = false
    this.lastDiceRoll = null
    this.moveHistory = []
    this.canReRoll = false
    this.gameStarted = false
    this.lastRollResult = null
  }

  // Event handling
  public addEventListener(listener: (event: GameEvent) => void): void {
    this.eventListeners.push(listener)
  }

  public removeEventListener(listener: (event: GameEvent) => void): void {
    const index = this.eventListeners.indexOf(listener)
    if (index > -1) {
      this.eventListeners.splice(index, 1)
    }
  }

  private emitEvent(event: GameEvent): void {
    this.eventListeners.forEach(listener => {
      listener(event)
    })
  }

  // Process game commands
  public processCommand(command: GameCommand): GameError | null {
    try {
      switch (command.type) {
        case 'startGame':
          return this.handleStartGame(command.seed, command.playerStart)
        case 'startTurn':
          return this.handleStartTurn(command.seed)
        case 'move':
          return this.handleMove(command.direction, command.useRoll)
        case 'putt':
          return this.handlePutt(command.direction)
        case 'mulligan':
          return this.handleMulligan(command.seed)
        case 'reset':
          return this.handleReset()
        default:
          return { type: 'invalidMove', reason: 'Unknown command type' }
      }
    } catch (error) {
      return { type: 'invalidMove', reason: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private handleStartGame(seed?: number, playerStart?: Position): GameError | null {
    if (this.gameStarted) {
      return { type: 'invalidMove', reason: 'Game already started' }
    }

    // Update random seed if provided
    if (seed !== undefined) {
      this.rules.updateSeed(seed)
    }

    // Set starting position
    const startPosition = playerStart || this.grid.findTeePosition()
    if (!this.grid.isValidPosition(startPosition)) {
      return { type: 'invalidPosition', position: startPosition }
    }

    this.currentPosition = { ...startPosition }
    this.gameStarted = true
    this.canReRoll = this.rules.isOnTee(this.grid, this.currentPosition)

    const terrain = this.grid.getTerrain(this.currentPosition)
    this.emitEvent({
      type: 'gameStarted',
      playerPosition: { ...this.currentPosition },
      terrain: terrain || 'rough',
    })

    return null
  }

  private handleStartTurn(seed?: number): GameError | null {
    if (!this.gameStarted) {
      return { type: 'invalidMove', reason: 'Game not started' }
    }

    if (this.isGameOver) {
      return { type: 'gameOver', reason: 'Game is already over' }
    }

    // Update seed if provided
    if (seed !== undefined) {
      this.rules.updateSeed(seed)
    }

    // Roll dice
    const terrain = this.grid.getTerrain(this.currentPosition) || 'rough'
    this.lastRollResult = this.rules.rollDice(terrain)
    this.lastDiceRoll = this.lastRollResult.modifiedRoll

    // Determine available actions
    const availableActions: Action[] = ['move', 'putt']
    if (this.mulligansRemaining > 0) {
      availableActions.push('mulligan')
    }

    this.emitEvent({
      type: 'turnStarted',
      diceRoll: this.lastRollResult.roll,
      modifiedRoll: this.lastRollResult.modifiedRoll,
      availableActions,
    })

    return null
  }

  private handleMove(direction: Direction, useRoll: boolean = true): GameError | null {
    if (!this.gameStarted) {
      return { type: 'invalidMove', reason: 'Game not started' }
    }

    if (this.isGameOver) {
      return { type: 'gameOver', reason: 'Game is already over' }
    }

    if (this.lastDiceRoll === null || !this.lastRollResult) {
      return { type: 'invalidMove', reason: 'No dice roll available. Start a turn first.' }
    }

    const distance = useRoll ? this.lastDiceRoll : 1
    const validation = this.rules.validateMove(this.grid, this.currentPosition, direction, distance)

    if (!validation.valid || !validation.finalPosition) {
      const validDirections = this.rules.getValidDirections(this.grid, this.currentPosition, distance)
      this.emitEvent({
        type: 'invalidMove',
        reason: validation.reason || 'Invalid move',
        validDirections,
      })
      return { type: 'invalidMove', reason: validation.reason || 'Invalid move' }
    }

    // Execute the move
    const move: Move = {
      fromPosition: { ...this.currentPosition },
      toPosition: validation.finalPosition,
      path: validation.path || [],
      diceRoll: this.lastRollResult.roll,
      modifiedRoll: this.lastRollResult.modifiedRoll,
      action: 'move',
      mulliganUsed: false,
      slopeRolls: validation.slopeRolls,
    }

    this.executeMove(move)
    return null
  }

  private handlePutt(direction: Direction): GameError | null {
    if (!this.gameStarted) {
      return { type: 'invalidMove', reason: 'Game not started' }
    }

    if (this.isGameOver) {
      return { type: 'gameOver', reason: 'Game is already over' }
    }

    const validation = this.rules.validateMove(this.grid, this.currentPosition, direction, 1, true)

    if (!validation.valid || !validation.finalPosition) {
      const validDirections = this.rules.getValidDirections(this.grid, this.currentPosition, 1)
      this.emitEvent({
        type: 'invalidMove',
        reason: validation.reason || 'Invalid putt',
        validDirections,
      })
      return { type: 'invalidMove', reason: validation.reason || 'Invalid putt' }
    }

    // Execute the putt
    const move: Move = {
      fromPosition: { ...this.currentPosition },
      toPosition: validation.finalPosition,
      path: validation.path || [],
      diceRoll: 1,
      modifiedRoll: 1,
      action: 'putt',
      mulliganUsed: false,
      slopeRolls: validation.slopeRolls,
    }

    this.emitEvent({
      type: 'puttExecuted',
      fromPosition: { ...this.currentPosition },
      toPosition: validation.finalPosition,
    })

    this.executeMove(move)
    return null
  }

  private handleMulligan(seed?: number): GameError | null {
    if (!this.gameStarted) {
      return { type: 'invalidMove', reason: 'Game not started' }
    }

    if (this.isGameOver) {
      return { type: 'gameOver', reason: 'Game is already over' }
    }

    if (this.mulligansRemaining <= 0) {
      return { type: 'noMulligansLeft' }
    }

    // Update seed if provided
    if (seed !== undefined) {
      this.rules.updateSeed(seed)
    }

    // Use a mulligan and re-roll
    this.mulligansRemaining--

    const terrain = this.grid.getTerrain(this.currentPosition) || 'rough'
    this.lastRollResult = this.rules.rollDice(terrain)
    this.lastDiceRoll = this.lastRollResult.modifiedRoll

    this.emitEvent({
      type: 'mulliganUsed',
      remaining: this.mulligansRemaining,
      newRoll: this.lastRollResult.modifiedRoll,
    })

    return null
  }

  private handleReset(): GameError | null {
    // Reset to initial state
    this.currentPosition = { row: 0, col: 0 }
    this.score = 0
    this.mulligansRemaining = GAME_CONSTANTS.MAX_MULLIGANS
    this.isGameOver = false
    this.lastDiceRoll = null
    this.moveHistory = []
    this.canReRoll = false
    this.gameStarted = false
    this.lastRollResult = null

    return null
  }

  private executeMove(move: Move): void {
    // Update position
    this.currentPosition = { ...move.toPosition }

    // Add to move history
    this.moveHistory.push(move)

    // Update score
    this.score = this.rules.calculateScore(this.moveHistory)

    // Clear dice roll (consumed)
    this.lastDiceRoll = null
    this.lastRollResult = null

    // Update re-roll availability
    this.canReRoll = false

    // Emit move event
    this.emitEvent({
      type: 'playerMoved',
      path: move.path,
      finalPosition: { ...move.toPosition },
      slopeRoll: move.slopeRolls,
    })

    // Check win condition
    if (this.rules.checkWinCondition(this.grid, this.currentPosition, move)) {
      this.isGameOver = true
      this.emitEvent({
        type: 'gameCompleted',
        finalScore: this.score,
        totalStrokes: this.moveHistory.length,
      })
    }
  }

  // Get current game state (readonly)
  public getState(): GameState {
    const terrain = this.grid.getTerrain(this.currentPosition) || 'rough'
    const maxDistance = this.lastDiceRoll || 1

    return {
      currentPosition: { ...this.currentPosition },
      currentTerrain: terrain,
      score: this.score,
      mulligansRemaining: this.mulligansRemaining,
      isGameOver: this.isGameOver,
      lastDiceRoll: this.lastDiceRoll,
      availableDirections: this.rules.getValidDirections(this.grid, this.currentPosition, maxDistance),
      moveHistory: [...this.moveHistory],
      gameGrid: this.grid,
      isOnTee: this.rules.isOnTee(this.grid, this.currentPosition),
      canReRoll: this.canReRoll,
    }
  }

  // Get grid for external access
  public getGrid(): Grid {
    return this.grid
  }

  // Get rules engine for external access
  public getRules(): RulesEngine {
    return this.rules
  }
}
