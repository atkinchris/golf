import { ReactNode } from 'react'
import TileElement from './Tile'
import { Tile } from '@/types'

interface BoardProps {
  tiles: Tile[]
  objects: { x: number; y: number; tile: Tile }[]
  height: number
  width: number
  size?: number
}

const DEFAULT_SIZE = 32

export default function Board({ tiles, objects, height, width, size = DEFAULT_SIZE }: BoardProps): ReactNode {
  return (
    <svg
      viewBox={`0 0 ${(width * size).toString()} ${(height * size).toString()}`}
      width={width * size}
      height={height * size}
    >
      <defs>
        <clipPath id="clip-top" clipPathUnits="objectBoundingBox">
          <circle cx="0.5" cy="0.5" r="0.5" />
          <rect x="0" y="0.5" width="1" height="0.5" />
        </clipPath>
        <clipPath id="clip-top-left" clipPathUnits="objectBoundingBox">
          <circle cx="0.5" cy="0.5" r="0.5" />
          {/* <rect x="0" y="0" width="0.5" height="0.5" /> */}
          <rect x="0.5" y="0" width="0.5" height="0.5" />
          <rect x="0" y="0.5" width="0.5" height="0.5" />
          <rect x="0.5" y="0.5" width="0.5" height="0.5" />
        </clipPath>
        <clipPath id="clip-top-right" clipPathUnits="objectBoundingBox">
          <circle cx="0.5" cy="0.5" r="0.5" />
          <rect x="0" y="0" width="0.5" height="0.5" />
          {/* <rect x="0.5" y="0" width="0.5" height="0.5" /> */}
          <rect x="0" y="0.5" width="0.5" height="0.5" />
          <rect x="0.5" y="0.5" width="0.5" height="0.5" />
        </clipPath>
        <clipPath id="clip-bottom" clipPathUnits="objectBoundingBox">
          <circle cx="0.5" cy="0.5" r="0.5" />
          <rect x="0" y="0" width="1" height="0.5" />
        </clipPath>
        <clipPath id="clip-bottom-left" clipPathUnits="objectBoundingBox">
          <circle cx="0.5" cy="0.5" r="0.5" />
          <rect x="0" y="0" width="0.5" height="0.5" />
          <rect x="0.5" y="0" width="0.5" height="0.5" />
          {/* <rect x="0" y="0.5" width="0.5" height="0.5" /> */}
          <rect x="0.5" y="0.5" width="0.5" height="0.5" />
        </clipPath>
        <clipPath id="clip-bottom-right" clipPathUnits="objectBoundingBox">
          <circle cx="0.5" cy="0.5" r="0.5" />
          <rect x="0" y="0" width="0.5" height="0.5" />
          <rect x="0.5" y="0" width="0.5" height="0.5" />
          <rect x="0" y="0.5" width="0.5" height="0.5" />
          {/* <rect x="0.5" y="0.5" width="0.5" height="0.5" /> */}
        </clipPath>
        <clipPath id="clip-left" clipPathUnits="objectBoundingBox">
          <circle cx="0.5" cy="0.5" r="0.5" />
          <rect x="0.5" y="0" width="1" height="1" />
        </clipPath>
        <clipPath id="clip-right" clipPathUnits="objectBoundingBox">
          <circle cx="0.5" cy="0.5" r="0.5" />
          <rect x="0" y="0" width="0.5" height="1" />
        </clipPath>
      </defs>
      {tiles.map((type, index) => {
        const x = index % width
        const y = Math.floor(index / width)

        const neighbours = {
          N: y > 0 ? tiles[index - width] : null,
          E: x < width - 1 ? tiles[index + 1] : null,
          S: y < height - 1 ? tiles[index + width] : null,
          W: x > 0 ? tiles[index - 1] : null,
        }

        return (
          <TileElement
            key={index}
            x={index % width}
            y={Math.floor(index / width)}
            size={size}
            type={type}
            neighbours={neighbours}
          />
        )
      })}
      {objects.map(({ x, y, tile }, index) => (
        <TileElement key={index} x={x} y={y} size={size} type={tile} />
      ))}
    </svg>
  )
}
