'use client'

import React, { useState } from 'react'
import { Tile } from './Tile'
import type { Course, Position, Tile as TileType } from '../types/game'

interface BoardProps {
  course: Course
  ballPosition: Position
  highlightedTiles?: Position[]
}

export function Board({ course, ballPosition, highlightedTiles = [] }: BoardProps) {
  const [hoveredTile, setHoveredTile] = useState<TileType | null>(null)

  const isHighlighted = (pos: Position) => {
    return highlightedTiles.some(highlight => highlight.x === pos.x && highlight.y === pos.y)
  }

  const isBallPosition = (pos: Position) => {
    return ballPosition.x === pos.x && ballPosition.y === pos.y
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className="grid gap-0 border-2 border-gray-400 p-2 bg-gray-100"
        style={{
          gridTemplateColumns: `repeat(${course.width.toString()}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${course.height.toString()}, minmax(0, 1fr))`,
        }}
        data-testid="game-board"
      >
        {course.tiles.map((row, y) =>
          row.map((tile, x) => (
            <div key={`${x.toString()}-${y.toString()}`} data-testid={`board-row-${y.toString()}`}>
              <Tile
                tile={tile}
                hasBall={isBallPosition(tile.position)}
                isHighlighted={isHighlighted(tile.position)}
                onHover={setHoveredTile}
                onLeave={() => {
                  setHoveredTile(null)
                }}
              />
            </div>
          ))
        )}
      </div>

      {/* Terrain Info Popup */}
      {hoveredTile && (
        <div className="bg-black text-white p-2 rounded shadow-lg text-sm" data-testid="terrain-info">
          <div className="font-bold capitalize">{hoveredTile.terrain}</div>
          <div>
            {getTerrainDescription(hoveredTile.terrain)}
            {hoveredTile.slopeDirection && <div>Direction: {hoveredTile.slopeDirection.toUpperCase()}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function getTerrainDescription(terrain: string): string {
  switch (terrain) {
    case 'rough':
      return 'Default terrain, no modifiers'
    case 'fairway':
      return '+1 movement, can drive over trees'
    case 'sand':
      return '-1 movement penalty'
    case 'water':
      return 'Cannot land on, can pass over'
    case 'trees':
      return 'Cannot land on, blocks movement'
    case 'slope':
      return 'Ball rolls additional space'
    case 'hole':
      return 'Target destination'
    default:
      return ''
  }
}
