import { ReactNode } from 'react'
import { roundCorners } from 'svg-round-corners'

import { Tile } from '@/types'

interface TileProps {
  x: number
  y: number
  size: number
  type: Tile
}

type TileType = React.FunctionComponent<Omit<TileProps, 'type'>>

const DOT_RADIUS = 2.5

const Fairway: TileType = ({ size, x, y }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
    <circle cx={16} cy={16} r={DOT_RADIUS} fill="#868686" />
  </svg>
)

const Green: TileType = ({ size, x, y }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
    <rect x="0" y="0" width="32" height="32" fill="#CBCBCB" />
    <circle cx={16} cy={16} r={DOT_RADIUS} fill="#444444" />
  </svg>
)

const Rough: TileType = ({ size, x, y }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
    <defs>
      <pattern
        id="patternRough"
        patternUnits="userSpaceOnUse"
        width="16"
        height="16"
        viewBox="0 0 4 4"
        patternTransform="rotate(90)"
      >
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="#C9C9C9" strokeWidth="1" transform="translate(-2, 2)" />
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="#C9C9C9" strokeWidth="1" />
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="#C9C9C9" strokeWidth="1" transform="translate(2, -2)" />
      </pattern>
    </defs>
    <rect x="0" y="0" width="32" height="32" fill="url(#patternRough)" />
    <circle cx={16} cy={16} r={DOT_RADIUS} fill="#444444" />
  </svg>
)

const Water: TileType = ({ size, x, y }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
    <rect x="0" y="0" width="32" height="32" fill="#444444" />
    <circle cx={16} cy={16} r={DOT_RADIUS} fill="#CBCBCB" />
  </svg>
)

const Tree: TileType = ({ size, x, y }) => {
  const trianglePath = roundCorners('M16 0L32 32H0z', 4)

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
      <path
        d={trianglePath.path}
        fill="#202020"
        transform="translate(0 -6) scale(0.8 0.6)"
        style={{ transformOrigin: 'center' }}
      />
      <path
        d={trianglePath.path}
        fill="#202020"
        transform="translate(0 4) scale(0.8 0.6)"
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  )
}

const Tee: TileType = ({ size, x, y }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
    <rect x="0" y="0" width="32" height="32" fill="#CBCBCB" />
    <circle cx={16} cy={16} r={12} fill="#FFFFFF" stroke="#202020" strokeWidth={6} />
  </svg>
)

const Hole: TileType = ({ size, x, y }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
    <rect x="0" y="0" width="32" height="32" fill="#CBCBCB" />
    <circle cx={16} cy={16} r={12} fill="#202020" />
  </svg>
)

export default function TileElement({ size, type, x, y }: TileProps): ReactNode {
  switch (type) {
    case Tile.Green:
      return <Green size={size} x={x} y={y} />
    case Tile.Fairway:
      return <Fairway size={size} x={x} y={y} />
    case Tile.Rough:
      return <Rough size={size} x={x} y={y} />
    case Tile.Water:
      return <Water size={size} x={x} y={y} />
    case Tile.Tree:
      return <Tree size={size} x={x} y={y} />
    case Tile.Tee:
      return <Tee size={size} x={x} y={y} />
    case Tile.Hole:
      return <Hole size={size} x={x} y={y} />
    default:
      return null
  }
}
