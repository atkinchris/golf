'use client'

import React from 'react'
import type { GameState, Direction } from '../types/game'

interface GameControlsProps {
  gameState: GameState
  movementRange: number
  onRollDice: () => void
  onReroll: () => void
  onUseMulligan: () => void
  onMove: (direction: Direction) => void
}

const DIRECTION_LABELS: Record<Direction, string> = {
  north: '↑ N',
  south: '↓ S',
  east: '→ E',
  west: '← W',
  northeast: '↗ NE',
  northwest: '↖ NW',
  southeast: '↘ SE',
  southwest: '↙ SW',
}

export function GameControls({
  gameState,
  movementRange,
  onRollDice,
  onReroll,
  onUseMulligan,
  onMove,
}: GameControlsProps) {
  return (
    <div className="bg-white border border-gray-300 p-4 rounded-lg shadow space-y-4">
      {/* Game Status */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-sm text-gray-600">Score</div>
          <div className="text-xl font-bold" data-testid="game-score">
            {gameState.currentScore}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Position</div>
          <div className="text-sm font-mono" data-testid="ball-position">
            {gameState.ballPosition.x},{gameState.ballPosition.y}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Mulligans</div>
          <div className="text-xl font-bold" data-testid="mulligans-remaining">
            {gameState.mulligansRemaining}
          </div>
        </div>
      </div>

      {/* Dice Controls */}
      {gameState.gamePhase === 'rolling' && (
        <div className="text-center space-y-2">
          <button
            onClick={onRollDice}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-bold"
            data-testid="dice-roll-button"
          >
            Roll Dice
          </button>
        </div>
      )}

      {/* Dice Result and Re-roll */}
      {gameState.lastRoll !== null && (
        <div className="text-center space-y-2">
          <div className="text-2xl font-bold" data-testid="dice-result">
            Rolled: {gameState.lastRoll}
          </div>

          {movementRange > 0 && (
            <div className="text-sm text-gray-600" data-testid="movement-range">
              Movement Range: {movementRange}
            </div>
          )}

          <div className="flex gap-2 justify-center">
            {gameState.canReroll && (
              <button
                onClick={onReroll}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded text-sm"
                data-testid="reroll-button"
              >
                Re-roll (Tee-off)
              </button>
            )}

            {gameState.mulligansRemaining > 0 && !gameState.canReroll && (
              <button
                onClick={onUseMulligan}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-sm"
                data-testid="use-mulligan-button"
              >
                Use Mulligan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Direction Selection */}
      {gameState.gamePhase === 'moving' && gameState.availableDirections.length > 0 && (
        <div>
          <h4 className="font-bold mb-2 text-center">Choose Direction</h4>
          <div className="grid grid-cols-3 gap-1 max-w-48 mx-auto">
            <button
              onClick={() => onMove('northwest')}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded text-xs"
              data-testid="direction-northwest"
            >
              {DIRECTION_LABELS.northwest}
            </button>
            <button
              onClick={() => onMove('north')}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded text-xs"
              data-testid="direction-north"
            >
              {DIRECTION_LABELS.north}
            </button>
            <button
              onClick={() => onMove('northeast')}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded text-xs"
              data-testid="direction-northeast"
            >
              {DIRECTION_LABELS.northeast}
            </button>
            <button
              onClick={() => onMove('west')}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded text-xs"
              data-testid="direction-west"
            >
              {DIRECTION_LABELS.west}
            </button>
            <div className="p-2 text-xs text-center text-gray-500">⚪</div>
            <button
              onClick={() => onMove('east')}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded text-xs"
              data-testid="direction-east"
            >
              {DIRECTION_LABELS.east}
            </button>
            <button
              onClick={() => onMove('southwest')}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded text-xs"
              data-testid="direction-southwest"
            >
              {DIRECTION_LABELS.southwest}
            </button>
            <button
              onClick={() => onMove('south')}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded text-xs"
              data-testid="direction-south"
            >
              {DIRECTION_LABELS.south}
            </button>
            <button
              onClick={() => onMove('southeast')}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded text-xs"
              data-testid="direction-southeast"
            >
              {DIRECTION_LABELS.southeast}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
