import { ReactNode } from 'react'
import { roundCorners } from 'svg-round-corners'

import { Tile } from '@/types'

interface TileProps {
  x: number
  y: number
  size: number
  type: Tile
  neighbours?: {
    N: Tile | null
    E: Tile | null
    S: Tile | null
    W: Tile | null
  }
}

type TileType = React.FunctionComponent<Omit<TileProps, 'type'>>

const DOT_RADIUS = 2.5

const COLOURS = {
  DARK: '#202020',
  GREEN: '#CBCBCB',
}

const calculateClipPath = (self: Tile, neighbours?: TileProps['neighbours']): string | undefined => {
  if (!neighbours) return undefined

  const n = neighbours.N === self
  const e = neighbours.E === self
  const s = neighbours.S === self
  const w = neighbours.W === self

  const map = [n, e, s, w].map(v => (v ? 1 : 0)).join('')

  switch (map) {
    case '1000':
      return 'url(#clip-bottom)'
    case '1100':
      return 'url(#clip-bottom-left)'
    case '1001':
      return 'url(#clip-bottom-right)'
    case '0110':
      return 'url(#clip-top-left)'
    case '0011':
      return 'url(#clip-top-right)'
    case '0100':
      return 'url(#clip-left)'
    case '0010':
      return 'url(#clip-top)'
    case '0001':
      return 'url(#clip-right)'
    default:
      return undefined
  }
}

const Fairway: TileType = ({ size, x, y }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
    <circle cx={16} cy={16} r={DOT_RADIUS} fill="#868686" />
  </svg>
)

const Green: TileType = ({ size, x, y, neighbours }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
    <rect
      x="0"
      y="0"
      width="32"
      height="32"
      fill={COLOURS.GREEN}
      clipPath={calculateClipPath(Tile.Green, neighbours)}
    />
    <circle cx={16} cy={16} r={DOT_RADIUS} fill={COLOURS.DARK} />
  </svg>
)

const Rough: TileType = ({ size, x, y, neighbours }) => (
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
        <rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF" />
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="#C9C9C9" strokeWidth="1" transform="translate(-2, 2)" />
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="#C9C9C9" strokeWidth="1" />
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="#C9C9C9" strokeWidth="1" transform="translate(2, -2)" />
      </pattern>
    </defs>
    <rect
      x="0"
      y="0"
      width="32"
      height="32"
      fill="url(#patternRough)"
      clipPath={calculateClipPath(Tile.Rough, neighbours)}
    />
    <circle cx={16} cy={16} r={DOT_RADIUS} fill={COLOURS.DARK} />
  </svg>
)

const Water: TileType = ({ size, x, y, neighbours }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
    <rect x="0" y="0" width="32" height="32" fill={COLOURS.DARK} clipPath={calculateClipPath(Tile.Water, neighbours)} />
  </svg>
)

const Tree: TileType = ({ size, x, y }) => {
  const trianglePath = roundCorners('M16 0L32 32H0z', 4)

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
      <path
        d={trianglePath.path}
        fill={COLOURS.DARK}
        transform="translate(0 -6) scale(0.8 0.6)"
        style={{ transformOrigin: 'center' }}
      />
      <path
        d={trianglePath.path}
        fill={COLOURS.DARK}
        transform="translate(0 4) scale(0.8 0.6)"
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  )
}

const Tee: TileType = ({ size, x, y }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
    <circle cx={16} cy={16} r={12} fill="#FFFFFF" stroke={COLOURS.DARK} strokeWidth={6} />
  </svg>
)

const Hole: TileType = ({ size, x, y }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" x={x * size} y={y * size}>
    <circle cx={16} cy={16} r={12} fill={COLOURS.DARK} />
  </svg>
)

export default function TileElement({ type, ...props }: TileProps): ReactNode {
  switch (type) {
    case Tile.Green:
      return <Green {...props} />
    case Tile.Fairway:
      return <Fairway {...props} />
    case Tile.Rough:
      return <Rough {...props} />
    case Tile.Water:
      return <Water {...props} />
    case Tile.Tree:
      return <Tree {...props} />
    case Tile.Tee:
      return <Tee {...props} />
    case Tile.Hole:
      return <Hole {...props} />
    default:
      return null
  }
}
