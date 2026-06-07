# Responsive Layout Design

Date: 2026-06-07

## Goal

Improve the responsive layout of Dice Golf so the game fits on one portrait screen on mobile
with no scrolling, and presents a two-pane side-by-side layout on wider/landscape screens.

## Current State

All styles are inline `React.CSSProperties` in the components. There are no media queries or
responsive breakpoints. The app uses `100dvh` and `flex: 1` for the canvas container, which
mostly works on mobile but does not enforce a no-scroll constraint or adapt for desktop.

## Layouts

### Mobile portrait (narrow screens)

- Single column, full viewport height (`100dvh`), no overflow/scroll.
- Canvas fills all space above the controls area, shrinking to fit while preserving the 2:3
  aspect ratio (320x480 intrinsic px).
- HUD bar and controls row are fixed at the bottom.
- Controls row: DirectionPicker + ActionColumn side by side, as today.
- Breakpoint: apply this layout when the viewport is narrow or portrait-oriented.

### Desktop / landscape (wide screens)

- Two panes side by side, filling the full viewport height.
- Left pane: canvas centred both axes, max 400px wide, aspect ratio preserved.
- Right pane: HUD + DirectionPicker + ActionColumn grouped together and centred both axes as
  a single block.
- Breakpoint: apply this layout when `window.innerWidth >= 600px`.

## Constraints

- No scrolling on mobile - everything must fit in `100dvh`.
- Canvas aspect ratio (2:3) must always be preserved.
- Desktop canvas width capped at 400px.
- Existing component structure (App, GameCanvas, HUD, DirectionPicker, ActionColumn) stays
  intact - only layout wiring in `App.tsx` changes.
- All styles remain as inline `React.CSSProperties`; introduce a CSS media query only where
  inline styles cannot express a breakpoint (i.e. a `<style>` tag or a small CSS module for
  the layout container, or use a JS hook to detect viewport size and switch style objects).

## Approach

Use a lightweight JS hook (`useMediaQuery` or equivalent) to detect the breakpoint and return
a boolean (`isWide`). Pass that boolean to `App` to switch between two style sets. This keeps
everything in the existing inline-styles pattern and avoids introducing a CSS preprocessor or
module system.

The canvas sizing on mobile requires the canvas container to be constrained so it does not
overflow. The canvas element already has `width: 100%; height: auto` which gives correct
aspect scaling - the container just needs `max-height` derived from available space, or an
`aspect-ratio` container trick.

## Out of Scope

- Changes to the canvas renderer or game engine.
- Any visual restyling beyond layout (colours, fonts, button sizes).
- The game-over screen layout (can follow the same pattern but is not the primary focus).
