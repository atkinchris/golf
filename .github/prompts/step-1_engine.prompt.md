<reasoning>
- Simple Change: no - This is a complex prompt engineering task requiring creation of a detailed system prompt for a golf game engine.
- Reasoning: yes - The current prompt uses reasoning and analysis throughout
  - Identify: game mechanics analysis, technology decisions
  - Conclusion: yes - the reasoning leads to specific implementation requirements
  - Ordering: before - reasoning appears before conclusions/specifications
- Structure: yes - the prompt has clear sections with headings and organized content
- Examples: yes - includes a detailed grid example
  - Representative: 4 - the grid example is quite representative of the expected game layout
- Complexity: 4 - this is a highly complex prompt with multiple technical requirements
  - Task: 5 - implementing a complete game engine with state machine, events, and testing
  - Necessity: high complexity is necessary for this comprehensive task
- Specificity: 4 - very detailed with specific technology stack, API design, and grid layout
- Prioritization: 1) Clarity of game mechanics and rules, 2) API structure for commands/events, 3) Technical implementation details
- Conclusion: restructure to lead with clear task definition, ensure reasoning precedes conclusions, add more structured examples for API design
</reasoning>

Create a TypeScript-based game engine for a deterministic paper golf game using a grid-based state machine architecture. The engine should manage game logic, player movement, terrain interactions, and scoring without any UI components.

## Game Overview

Develop a state machine that handles a golf game played on a 16x26 grid where players navigate through different terrain types to reach the hole. The game must be entirely deterministic - identical inputs always produce identical outputs.

## Technical Requirements

**Primary Technology Stack:**

- TypeScript with modern features and best practices
- Vitest for unit testing (no other testing frameworks)
- Modular, maintainable code structure

**Architecture Pattern:**

- Command-input, event-output design
- State machine for game logic management
- Immutable game state tracking

## Core Engine Design

### Input Commands Structure

Design commands that trigger game actions:

- `startTurn`: Initialize turn and perform dice rolling mechanics
- `move`: Execute player movement in specified direction
- `putt`: Execute putting action with different movement rules
- `mulligan`: Allow player to retake previous action
- `reset`: Return game to initial state

### Output Events Structure

Emit events for state changes:

- `gameStarted`: Game initialization complete
- `gameEnded`: Player reached hole successfully
- `playerMoved`: Position change completed
- `turnStarted`: New turn initiated with dice results
- `moveAvailable`: Valid movement options determined

### Read-Only State Properties

Expose current game information:

- `currentPosition`: Player coordinates on grid
- `currentTerrain`: Current terrain type and properties
- `score`: Current stroke count
- `mulligansLeft`: Remaining mulligan count
- `isGameOver`: Game completion status
- `currentDiceRoll`: Latest dice result
- `availableDirections`: Valid movement directions from current position

## Game Implementation Requirements

**Grid System:**

- Implement 16 rows × 26 columns coordinate system
- Track terrain types and movement modifiers
- Handle boundary conditions and invalid moves

**Game Rules Integration:**

- Reference and implement all rules from the provided RULES.md file
- Ensure deterministic dice rolling with reproducible seeds
- Track complete move history for game replay capability

**State Management:**

- Maintain original grid state immutably
- Track all player moves chronologically
- Calculate scores and game completion accurately
- Handle edge cases and invalid states gracefully

# Steps

1. **Design Core Interfaces**: Define TypeScript interfaces for commands, events, and game state
2. **Implement Grid System**: Create grid representation with terrain type mappings
3. **Build State Machine**: Develop the core state management logic with transitions
4. **Add Command Processing**: Implement command handlers for each input type
5. **Create Event System**: Build event emission for state changes
6. **Integrate Game Rules**: Apply rules from RULES.md to movement and scoring
7. **Write Comprehensive Tests**: Use Vitest to test all game scenarios and edge cases

# Output Format

Provide complete TypeScript implementation files organized as:

- Main engine class with state machine
- Interface definitions for commands, events, and state
- Terrain and grid type definitions
- Comprehensive Vitest test suites covering all functionality
- Brief documentation explaining the API usage

# Examples

**Command Structure:**

```typescript
interface MoveCommand {
  type: 'move'
  direction: 'north' | 'south' | 'east' | 'west'
  // [additional properties as needed for your design]
}

interface StartTurnCommand {
  type: 'startTurn'
  // [seed for deterministic dice rolling]
}
```

**Event Structure:**

```typescript
interface PlayerMovedEvent {
  type: 'playerMoved'
  fromPosition: [number, number]
  toPosition: [number, number]
  terrainType: string
  // [additional relevant state information]
}
```

**Grid Representation:**
The provided grid uses symbols (•, ■, ▨, ▲, ◉, ▤, ○) representing different terrain types. Design an efficient internal representation - this could be enums, constants, or objects with properties affecting movement rules.

# Notes

- The engine must be completely deterministic for replay functionality
- Focus solely on game logic - no rendering or UI components
- Use the exact grid layout provided as your test case
- Ensure all game rules from RULES.md are properly implemented
- Write tests that verify deterministic behavior across multiple runs
- Consider performance for grid operations and state management
- Handle invalid moves and edge cases gracefully with appropriate events
