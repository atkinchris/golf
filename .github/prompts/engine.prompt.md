You are a prompt engineer for game development. You are going to help me write a prompt that I can use with Claude Sonnet 4 to develop a small game loosely based around a paper version of the game of golf. The game is based around a grid of roughly 16 horizontal and 26 vertical positions, with different types of surface or obstacle in different positions.

You should give you answer as a prompt. The prompt should be clear and concise, providing all necessary details for Claude to understand the requirements. It should include the game mechanics, the grid layout, the types of terrain, and any specific rules that need to be implemented.

Your task is to create a state machine in TypeScript that will handle the game logic for this golf game. The state machine should manage the player's position, the type of terrain they are on, and the actions they can take based on their current state. Use a pre-defined grid layout and implement the rules of the game as described below.

The game should be entirely deterministic. The state machine should track the original grid and each move made by the player, and determine if the game has been won, what the current score is and any other relevant game state information. As before, the game should be deterministics - meaning that the same inputs will always produce the same outputs.

## Technology Stack

Use TypeScript for the implementation of the game engine. The code should be modular, well-structured, and easy to maintain. Use modern TypeScript features and best practices. You should not create the game UI or any graphics, just the logic and rules for the game in the form of the engine.

You must use Vitest for unit testing. Do not use any other testing framework, and do not use Node's built-in `assert` module. Use Vitest's `expect` for assertions. Create unit tests to ensure the game logic works correctly.

## Engine Design

The engine should work with input command and emit output events. You can decide the exact structure of the input commands and output events, but they should be clear and easy to understand. The may include additional properties, such as the direction of movement or the moves available.

Input commands may include:

- `startTurn`: command to start a turn, and perform actions such as rolling the dice to determine the player's movement distance.
- `move`: command to move the player in a specified direction.
- `putt`: command to putt the ball rather than hitting it, which may have different rules.
- `mulligan`: command to allow the player to take a mulligan.
- `reset`: command to reset the game state.

Output events may include:

- `gameStarted`: event emitted when the game starts.
- `gameEnded`: event emitted when the game ends, i.e. when the player reaches the hole.
- `playerMoved`: event emitted when the player moves to a new position.
- `turnStarted`: event emitted when the turn is started, and dice are rolled, etc.
- `moveAvailable`: event emitted when the dice have been rolled and the move is available.

It should also expose read-only properties to get the current game state, such as:

- `currentPosition`: the current position of the player on the grid.
- `currentTerrain`: the type of terrain the player is currently on.
- `score`: the current score of the player.
- `mulligansLeft`: the number of mulligans left for the player.
- `isGameOver`: a boolean indicating if the game has ended.
- `currentDiceRoll`: the result of the last dice roll.
- `availableDirections`: the directions available for the player to move based on the current position and terrain.

Read the original rules from #file:../../RULES.md

Below is an example grid to illustrate the layout. The symbols represent different types of terrain or obstacles, but you can represent them in any way that makes sense for efficiency and clarity in the code. The grid is 16 rows by 26 columns, with each cell representing a position on the golf course.

```
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
```
