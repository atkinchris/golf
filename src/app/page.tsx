'use client'

import { Board } from '../components/Board'
import { GameControls } from '../components/GameControls'
import { TerrainLegend } from '../components/TerrainLegend'
import { useGameState } from '../hooks/useGameState'
import { useEffect } from 'react'

export default function Page() {
  const { gameState, course, actions, getMovementRange, testSetBallPosition } = useGameState()

  // Expose test utilities to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      ;(window as any).testUtils = {
        setBallPosition: testSetBallPosition,
      }
    }
  }, [testSetBallPosition])

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-6">Dice Golf</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Board - takes up most space */}
          <div className="lg:col-span-3">
            <div className="bg-white p-4 rounded-lg shadow">
              <Board course={course} ballPosition={gameState.ballPosition} highlightedTiles={[]} />
            </div>
          </div>

          {/* Sidebar with controls and legend */}
          <div className="space-y-4">
            <GameControls
              gameState={gameState}
              movementRange={getMovementRange()}
              onRollDice={actions.rollDice}
              onReroll={actions.reroll}
              onUseMulligan={actions.useMulligan}
              onMove={actions.move}
            />

            <TerrainLegend />
          </div>
        </div>
      </div>
    </main>
  )
}
