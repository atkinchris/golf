# Condensed controls layout

Date: 2026-06-06
Target device: iPhone 17 (approximately 393x852 logical pixels)

## Problem

The current controls area (HUD + DirectionPicker + DiceButton) is approximately 302px tall.
On iPhone 17 the game canvas is 570px tall (30 rows x 19px cells), leaving roughly 240px for
controls. This causes the page to overflow and require scrolling.

## Solution

Replace the three-section vertical stack with a two-section layout:

1. Single-row HUD
2. Side-by-side row: DirectionPicker (left) + ActionColumn (right)

Total controls height after change: approximately 172px. Saves 130px.

## HUD (single row)

Merge the existing two-row HUD into one line:

```text
[+1]     [Str 2 / Par 3]     [... Fairway  4]
```

- Left: score differential (yellow, bold)
- Centre: stroke count and par
- Right: mulligan dots, terrain label, roll value (smaller text)

Roll value is only shown after the player has rolled (phase AwaitingDirection).

Font size: 13px (unchanged). Padding reduced to a single 6px top/bottom.

## DirectionPicker

- Button size: 56px -> 44px (stays above the 44px touch-target minimum)
- Gap between buttons: 4px -> 3px
- Resulting grid height: 3x44 + 2x3 = 138px (was 176px)
- All other behaviour unchanged (dimmed arrows, centre cell roll value)

## ActionColumn (replaces DiceButton component)

Sits to the right of the DirectionPicker, matching the grid height (138px).
Content varies by game phase:

| Phase                                  | Right column                           |
| -------------------------------------- | -------------------------------------- |
| AwaitingRoll                           | Roll button, full height, primary blue |
| AwaitingDirection - mulligan available | Re-roll button, full height, amber     |
| AwaitingDirection - no mulligan        | Empty (column hidden)                  |

### Putt

The separate Putt button is removed. Tapping a direction arrow before rolling constitutes
a putt. This preserves the intended parity: at the start of a move the player may either
tap an arrow (putt) or tap Roll, with neither option visually dominant over the other.

When the right column is empty (AwaitingDirection, no mulligan) the ActionColumn renders
as an invisible placeholder (`opacity: 0`, `pointer-events: none`) at the same width as
when a button is present. The picker stays in the same position across all phases with no
visual jump.

## Component changes

### HUD.tsx

- Remove the second `<div>` row.
- Merge all fields into the first row using `justify-content: space-between`.
- Reduce vertical padding.

### DirectionPicker.tsx

- Change `arrowButton` width and height from 56px to 44px.
- Change `gap` on `grid` from 4px to 3px.

### DiceButton.tsx -> ActionColumn.tsx

- Rename component and file.
- Change from a horizontal button row to a single tall button filling the picker height.
- Accept `phase`, `mulligans`, `onRoll`, `onMulligan` props.
- Remove Putt button and all Putt-related props/handlers.
- Return an invisible placeholder (`opacity: 0`, `pointer-events: none`) of the same
  width when phase is AwaitingDirection and no mulligan is available, so the picker
  does not reflow.

### App.tsx

- Wrap DirectionPicker and ActionColumn in a `display: flex`, `align-items: stretch` row.
  ActionColumn fills the full row height automatically without needing an explicit height prop.
- Remove the standalone DiceButton row that previously sat below the picker.
- Update import from DiceButton to ActionColumn.

## Height budget (iPhone 17)

| Element                   | Height |
| ------------------------- | ------ |
| Canvas                    | 570px  |
| HUD                       | 34px   |
| Picker + ActionColumn row | 138px  |
| Total                     | 742px  |

Available viewport (dvh, Safari address bar collapsed): approximately 818px.
Remaining space: approximately 76px. No scroll required.
