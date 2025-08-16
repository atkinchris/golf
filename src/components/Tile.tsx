'use client'

import React from 'react'
import type { Tile as TileType } from '../types/game'

interface TileProps {
  tile: TileType
  hasBall?: boolean
  isHighlighted?: boolean
  onHover?: (tile: TileType) => void
  onLeave?: () => void
}

const TERRAIN_STYLES = {
  rough: 'bg-green-800',
  fairway: 'bg-green-400',
  sand: 'bg-yellow-400',
  water: 'bg-blue-500',
  trees: 'bg-green-900',
  slope: 'bg-orange-300',
  hole: 'bg-black',
}

const TERRAIN_SYMBOLS = {
  rough: '',
  fairway: '',
  sand: '~',
  water: '≈',
  trees: '🌲',
  slope: '↗',
  hole: '⚪',
}

const SLOPE_ARROWS = {
  n: '↑',
  s: '↓',
  e: '→',
  w: '←',
  ne: '↗',
  nw: '↖',
  se: '↘',
  sw: '↙',
}

export function Tile({ tile, hasBall, isHighlighted, onHover, onLeave }: TileProps) {
  const baseClasses =
    'w-4 h-4 border border-gray-300 flex items-center justify-center text-xs relative transition-colors'
  const terrainClass = TERRAIN_STYLES[tile.terrain]
  const highlightClass = isHighlighted ? 'ring-2 ring-blue-400' : ''

  let symbol = TERRAIN_SYMBOLS[tile.terrain]
  if (tile.terrain === 'slope' && tile.slopeDirection) {
    symbol = SLOPE_ARROWS[tile.slopeDirection]
  }

  return (
    <div
      className={`${baseClasses} ${terrainClass} ${highlightClass}`}
      data-testid={`tile-${tile.position.x.toString()}-${tile.position.y.toString()}`}
      data-terrain={tile.terrain}
      data-slope-direction={tile.slopeDirection}
      onMouseEnter={() => onHover?.(tile)}
      onMouseLeave={onLeave}
    >
      {symbol && <span className="select-none text-white text-shadow">{symbol}</span>}
      {hasBall && (
        <div
          className={`absolute w-2 h-2 border border-black rounded-full z-10 ${
            tile.terrain === 'hole' ? 'bg-yellow-400' : 'bg-white'
          }`}
          data-testid="ball-marker"
        />
      )}
    </div>
  )
}
