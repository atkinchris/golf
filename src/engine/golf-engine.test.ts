import { GolfEngine, Direction, TerrainType, parseGrid, EXAMPLE_GRID } from '../engine'

// Simple test runner
interface TestResult {
  name: string
  passed: boolean
  error?: string
}

class TestRunner {
  private tests: TestResult[] = []

  test(name: string, fn: () => void | Promise<void>): void {
    try {
      const result = fn()
      if (result instanceof Promise) {
        result
          .then(() => {
            this.tests.push({ name, passed: true })
          })
          .catch((error: Error) => {
            this.tests.push({ name, passed: false, error: error.message })
          })
      } else {
        this.tests.push({ name, passed: true })
      }
    } catch (error) {
      this.tests.push({ name, passed: false, error: (error as Error).message })
    }
  }

  expect(actual: any): {
    toBe: (expected: any) => void
    toEqual: (expected: any) => void
    toBeTruthy: () => void
    toBeFalsy: () => void
    toThrow: () => void
  } {
    return {
      toBe: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Expected ${String(actual)} to be ${String(expected)}`)
        }
      },
      toEqual: (expected: any) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`)
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected ${String(actual)} to be truthy`)
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected ${String(actual)} to be falsy`)
        }
      },
      toThrow: () => {
        let threw = false
        try {
          if (typeof actual === 'function') {
            actual()
          }
        } catch {
          threw = true
        }
        if (!threw) {
          throw new Error('Expected function to throw')
        }
      },
    }
  }

  run(): void {
    console.log('Running tests...\n')
    let passed = 0
    let failed = 0

    for (const test of this.tests) {
      if (test.passed) {
        console.log(`✓ ${test.name}`)
        passed++
      } else {
        console.log(`✗ ${test.name}`)
        if (test.error) {
          console.log(`  Error: ${test.error}`)
        }
        failed++
      }
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed`)
    if (failed > 0) {
      process.exit(1)
    }
  }
}

// Test setup
const runner = new TestRunner()

// Grid parsing tests
runner.test('should parse simple grid correctly', () => {
  const simpleGrid = '•••○\n••••\n••••\n••◉•'

  const { grid, startPosition, holePosition } = parseGrid(simpleGrid)

  runner.expect(startPosition).toEqual({ x: 2, y: 3 })
  runner.expect(holePosition).toEqual({ x: 3, y: 0 })
  runner.expect(grid.length).toBe(4)
  runner.expect(grid[0].length).toBe(4)
})

runner.test('should throw error when no start position', () => {
  const gridWithoutStart = `••••\n••••\n••○•\n••••`

  runner.expect(() => parseGrid(gridWithoutStart)).toThrow()
})

runner.test('should throw error when no hole position', () => {
  const gridWithoutHole = `••••\n••••\n••••\n••◉•`

  runner.expect(() => parseGrid(gridWithoutHole)).toThrow()
})

// Game initialization tests
runner.test('should initialize game state correctly', () => {
  const simpleGrid = '○•••\n••••\n••••\n•◉••'

  const engine = new GolfEngine(simpleGrid)
  const state = engine.getState()

  runner.expect(state.currentPosition).toEqual({ x: 1, y: 3 })
  runner.expect(state.holePosition).toEqual({ x: 0, y: 0 })
  runner.expect(state.strokeCount).toBe(0)
  runner.expect(state.mullygansUsed).toBe(0)
  runner.expect(state.maxMulligans).toBe(6)
  runner.expect(state.par).toBe(6)
  runner.expect(state.isGameWon).toBe(false)
  runner.expect(state.isGameLost).toBe(false)
})

// Movement tests
runner.test('should move ball correctly on rough terrain', () => {
  const simpleGrid = '○•••\n••••\n••••\n•◉••'

  const engine = new GolfEngine(simpleGrid)
  // First move to rough terrain (using fairway bonus: distance 1 becomes 2)
  engine.attemptMove(Direction.E, 1) // Move to position (3,3) which is rough
  
  // Now test movement from rough (no bonus)
  const result = engine.attemptMove(Direction.N, 2)

  runner.expect(result.success).toBe(true)
  runner.expect(result.newPosition).toEqual({ x: 3, y: 1 }) // 2 spaces north from (3,3) = (3,1)

  const state = engine.getState()
  runner.expect(state.currentPosition).toEqual({ x: 3, y: 1 })
  runner.expect(state.strokeCount).toBe(2)
})

runner.test('should apply fairway bonus', () => {
  const simpleGrid = '○   \n    \n    \n ◉  '

  const engine = new GolfEngine(simpleGrid)
  // From fairway (start position), distance 2 should become 3
  const result = engine.attemptMove(Direction.N, 2)

  runner.expect(result.success).toBe(true)
  // Should move 3 spaces (2 + fairway bonus) north
  runner.expect(result.newPosition).toEqual({ x: 1, y: 0 })
})

runner.test('should apply sand penalty', () => {
  const simpleGrid = '○•••\n••••\n▨•••\n◉•••'

  const engine = new GolfEngine(simpleGrid)
  // Move from start directly to sand (1 space north + fairway bonus = 2 spaces, but sand is only 1 space away)
  // Actually, let's put start position directly in/adjacent to sand
  const simpleGridFixed = '○•••\n••••\n▨▨••\n•◉••'
  const engine2 = new GolfEngine(simpleGridFixed)
  
  // Move north 1 space (gets fairway bonus, becomes 2 spaces) to land in sand
  const move1 = engine2.attemptMove(Direction.N, 1)
  runner.expect(move1.success).toBe(true)
  
  // From sand, distance 3 should become max(1, 3-1) = 2
  const result = engine2.attemptMove(Direction.E, 3)

  runner.expect(result.success).toBe(true)
  // Should move only 2 spaces due to sand penalty
  const finalPos = engine2.getState().currentPosition
  runner.expect(finalPos.x).toBe(3) // Started at x=1 in sand, moved 2 spaces east
})

runner.test('should prevent landing in water', () => {
  const simpleGrid = '○•••\n•~••\n••••\n•◉••'

  const engine = new GolfEngine(simpleGrid)
  // Move from (1,3) north 2 spaces + fairway bonus = 3 spaces total, landing on water at (1,0)
  // Wait, that would overshoot. Let's try a different approach.
  const simpleGridFixed = '○•••\n••••\n••••\n◉~••'
  const engine2 = new GolfEngine(simpleGridFixed)
  
  const result = engine2.attemptMove(Direction.E, 1) // With fairway bonus becomes 2, landing in water

  runner.expect(result.success).toBe(false)
  runner.expect(result.message).toBe('Cannot land in water or trees')
})

runner.test('should prevent landing on trees', () => {
  const simpleGrid = '○•••\n••••\n••••\n◉■••'

  const engine = new GolfEngine(simpleGrid)
  const result = engine.attemptMove(Direction.E, 1) // With fairway bonus becomes 2, landing on tree

  runner.expect(result.success).toBe(false)
  runner.expect(result.message).toBe('Cannot land in water or trees')
})

runner.test('should prevent path through trees from rough', () => {
  const simpleGrid = '○•••\n••••\n•■••\n◉•••'

  const engine = new GolfEngine(simpleGrid)
  // First move to rough terrain to remove fairway bonus
  engine.attemptMove(Direction.E, 1) // Move to rough with fairway bonus
  
  // Now from rough, try to move through tree
  const result = engine.attemptMove(Direction.N, 2) // Should be blocked by tree

  runner.expect(result.success).toBe(false)
  runner.expect(result.message).toBe('Path blocked by trees')
})

runner.test('should allow path through trees from fairway', () => {
  const simpleGrid = '○   \n ■  \n    \n ◉  '

  const engine = new GolfEngine(simpleGrid)
  const result = engine.attemptMove(Direction.N, 2)

  runner.expect(result.success).toBe(true)
  // Should move 3 spaces (2 + fairway bonus) through the tree
  runner.expect(result.newPosition).toEqual({ x: 1, y: 0 })
})

// Slope tests
runner.test('should apply slope effects', () => {
  const simpleGrid = '○•••\n▲•••\n••••\n◉•••'

  const engine = new GolfEngine(simpleGrid)
  const result = engine.attemptMove(Direction.N, 1) // With fairway bonus: 2 spaces north to land on slope

  runner.expect(result.success).toBe(true)
  runner.expect(result.newPosition).toEqual({ x: 0, y: 1 }) // Where ball initially lands (on slope)
  runner.expect(result.finalPosition).toEqual({ x: 0, y: 0 }) // After slope effect (moved north by slope)
  runner.expect(result.slopesTriggered).toEqual([{ x: 0, y: 1 }])
})

// Hole crossing tests
runner.test('should win when crossing hole with overshoot of 1', () => {
  const simpleGrid = '•○••\n••••\n••••\n◉•••'

  const engine = new GolfEngine(simpleGrid)
  // Move northeast from (0,3) - with fairway bonus, distance 2 becomes 3
  // This should cross the hole at (1,0) and land at (3,0) - overshoot by 2, which is too much
  // Let me adjust to make the overshoot exactly 1
  const simpleGridFixed = '○•••\n••••\n••••\n•◉••'
  const engine2 = new GolfEngine(simpleGridFixed)
  
  // Move north distance 3 with fairway bonus = 4 total, should cross hole and overshoot by 3 (too much)
  // Let's use a different approach
  const simpleGridFixed2 = '•••○\n••••\n••••\n•◉••'
  const engine3 = new GolfEngine(simpleGridFixed2)
  
  // From (1,3) to hole at (3,0): distance NE would be about 3 diagonal
  const result = engine3.attemptMove(Direction.NE, 2) // With fairway bonus = 3, should reach and cross hole

  runner.expect(result.success).toBe(true)
  runner.expect(result.message).toBe('Ball in hole! You win!')

  const state = engine3.getState()
  runner.expect(state.isGameWon).toBe(true)
})

// Club tests
runner.test('should use putter correctly', () => {
  const simpleGrid = '○•••\n••••\n••••\n•◉••'

  const engine = new GolfEngine(simpleGrid)
  // Putter always moves exactly 1 space, no bonuses
  const result = engine.putt(Direction.N)

  runner.expect(result.success).toBe(true)
  runner.expect(result.newPosition).toEqual({ x: 1, y: 2 }) // Exactly 1 space north
})

// Mulligan tests
runner.test('should track mulligan usage', () => {
  const simpleGrid = '○•••\n••••\n••••\n•◉••'

  const engine = new GolfEngine(simpleGrid)
  const initialMulligans = engine.getRemainingMulligans()
  
  engine.attemptMove(Direction.N, 1, true) // Use mulligan

  runner.expect(engine.getRemainingMulligans()).toBe(initialMulligans - 1)
})

runner.test('should prevent using more mulligans than available', () => {
  const simpleGrid = '○•••\n••••\n••••\n•◉••'

  const engine = new GolfEngine(simpleGrid, 0) // No mulligans
  const result = engine.attemptMove(Direction.N, 1, true)

  runner.expect(result.success).toBe(false)
  runner.expect(result.message).toBe('No mulligans remaining')
})

// Reset and score tests
runner.test('should reset game correctly', () => {
  const simpleGrid = '○•••\n••••\n••••\n•◉••'

  const engine = new GolfEngine(simpleGrid)
  engine.attemptMove(Direction.N, 1)
  engine.attemptMove(Direction.E, 1, true)

  engine.reset()

  const state = engine.getState()
  runner.expect(state.currentPosition).toEqual(state.startPosition)
  runner.expect(state.strokeCount).toBe(0)
  runner.expect(state.mullygansUsed).toBe(0)
  runner.expect(state.moves.length).toBe(0)
  runner.expect(state.isGameWon).toBe(false)
  runner.expect(state.isGameLost).toBe(false)
})

runner.test('should calculate score correctly', () => {
  const simpleGrid = '○•••\n••••\n••••\n•◉••'

  const engine = new GolfEngine(simpleGrid, 6, 4) // Par 4
  engine.attemptMove(Direction.N, 1)
  engine.attemptMove(Direction.N, 1)
  engine.attemptMove(Direction.N, 1)

  runner.expect(engine.getScore()).toBe(-1) // 3 strokes, par 4 = -1
})

// Complex scenario test with example grid
runner.test('should handle complex game scenario', () => {
  const engine = new GolfEngine(EXAMPLE_GRID)
  const initialState = engine.getState()

  runner.expect(initialState.currentPosition).toEqual({ x: 18, y: 4 }) // Start position ◉
  runner.expect(initialState.holePosition).toEqual({ x: 2, y: 20 }) // Hole position ○

  // Make a few moves
  const move1 = engine.attemptMove(Direction.SW, 3)
  runner.expect(move1.success).toBe(true)

  const move2 = engine.putt(Direction.S)
  runner.expect(move2.success).toBe(true)

  const finalState = engine.getState()
  runner.expect(finalState.strokeCount).toBe(2)
  runner.expect(finalState.moves.length).toBe(2)
})

// Run all tests
runner.run()