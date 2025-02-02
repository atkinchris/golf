import { ReactNode } from 'react'
import TileElement from './Tile'
import { Tile } from '@/types'

interface BoardProps {
  data: Tile[]
  height: number
  width: number
  size?: number
}

const DEFAULT_SIZE = 32

export default function Board({ data, height, width, size = DEFAULT_SIZE }: BoardProps): ReactNode {
  return (
    <svg
      viewBox={`0 0 ${(width * size).toString()} ${(height * size).toString()}`}
      width={width * size}
      height={height * size}
    >
      {data.map((type, index) => (
        <TileElement key={index} x={index % width} y={Math.floor(index / width)} size={size} type={type} />
      ))}
    </svg>
  )
}
