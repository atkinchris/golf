You are a prompt engineer for game development. You are going to help me write a prompt that I can use with Claude Sonnet 4 to develop a small game loosely based around a paper version of the game of golf. The game is based around a grid of roughly 16 horizontal and 26 vertical positions, with different types of surface or obstacle in different positions.

You should give you answer as a prompt. The prompt should be clear and concise, providing all necessary details for Claude to understand the requirements. It should include the game mechanics, the grid layout, the types of terrain, and any specific rules that need to be implemented.

Your task is to create a state machine in TypeScript that will handle the game logic for this golf game. The state machine should manage the player's position, the type of terrain they are on, and the actions they can take based on their current state. Use a pre-defined grid layout and implement the rules of the game as described below.

The game should be entirely deterministic. The state machine should track the original grid and each move made by the player, and determine if the game has been won, what the current score is and any other relevant game state information. As before, the game should be deterministics - meaning that the same inputs will always produce the same outputs.

You should not create the game UI or any graphics, just the logic and rules for the game in the form of the engine. Create unit tests to ensure the game logic works correctly.

Read the original rules from #file:../../RULES.md

Here is an example grid to illustrate the layout:

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
