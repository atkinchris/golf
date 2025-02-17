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

interface Params {
  seed: number
}

export default async function Home({ params }: { params: Promise<Params> }) {
  const width = 16
  const height = 26
  const seed = (await params).seed || 0
  const { tiles, objects } = getCourse(width, height, seed)

  const shots: never[] = []

  return (
    <main>
      <h1>Seed: {seed}</h1>
      <Board tiles={tiles} objects={objects} shots={shots} height={height} width={width} />
    </main>
  )
}
