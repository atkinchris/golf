You are a prompt engineer for game development. You are going to help me write a prompt that I can use with Claude Sonnet 4 to develop a small game loosely based around a paper version of the game of golf. The game is based around a grid of roughly 16 horizontal and 26 vertical positions, with different types of surface or obstacle in different positions.

You should give you answer as a prompt. The prompt should be clear and concise, providing all necessary details for Claude to understand the requirements. It should include the game mechanics, the grid layout, the types of terrain, and any specific rules that need to be implemented.

Your task is to create an interface in Next.js and React for this game. The engine for this game has already been created. The game should be entirely deterministic.

Create Playwright tests to play the game programmatically, ensuring that the game logic works correctly. The tests should simulate player actions, validate game state changes, and confirm that the game behaves as expected according to the rules.

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
