import Board from '@/components/Board'
import getCourse from '@/course'

// Specification:
// https://en.wikipedia.org/wiki/Geometric_Shapes_(Unicode_block)

// 01 •••• •••• •••• ••••
// 02 •••• •••• •••• ■•••
// 03 •••• •••• •••■ ■■■•
// 04 •••• •••• •••■ ■■■■
// 05 •••• •••• •▨▨■ ■■◉■
// 06 •••• •••• ▨▨▨▨ ■■■■
// 07 •••• •••▲ ▲▨▨▨ ■■■•
// 08 •••• •••• ▨▨▨▨ ■■■•
// 09 •••• •••• ▨▨▨▨ •■••
// 10 •••• •••■ ■▲▲• ••••
// 11 •••• ••■■ ■■•• ••••
// 12 •••• •••■ ■••▤ ▤▤▤•
// 13 •••• •••• ••▤▤ ▤▤▤•
// 14 •••• •••• •▤▤▤ ▤▤▤▤
// 15 •••• •••• ▤▤▤▤ ▤▤▤•
// 16 •••• •••▤ ▤▤▤▤ ▤■■•
// 17 •••• •••▤ ▤▤▤▤ ▤■■■
// 18 ••■■ ■■■■ ▤▤▤▤ ■■■•
// 19 •■■■ ■■■■ ■••■ ■■■■
// 20 •■■■ ■■■■ ■••■ ■■■•
// 21 ••■■ ○■■■ •••• •■••
// 22 ••■■ ■■■■ •••• ••••
// 23 ••■■ ■■■• •••• ••••
// 24 •••■ ■••• •••• ••••
// 25 •••• •••• •••• ••••
// 26 •••• •••• •••• ••••

// 0 = •
// 1 = ■
// 2 = ▨
// 3 = ▤
// 4 = ▲
// 5 = ◉
// 6 = ○

export default function Home() {
  const width = 16
  const height = 26
  const seed = 0
  const { tiles, objects } = getCourse(width, height, seed)

  const shots = [
    { x: 4, y: 20 },
    { x: 7, y: 17 },
    { x: 7, y: 10 },
    { x: 12, y: 5 },
    { x: 13, y: 4 },
  ]

  return (
    <main>
      <Board tiles={tiles} objects={objects} shots={shots} height={height} width={width} />
    </main>
  )
}
