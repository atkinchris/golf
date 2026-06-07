# CSS separation from JS

## Goal

Extract all inline `React.CSSProperties` style objects into plain CSS files and replace
JS-driven responsive layout with CSS media queries. The result is a traditional
separation of concerns: HTML structure in JSX, styling in CSS, behaviour in JS.

## Current state

- Zero CSS files. Every style is an inline `React.CSSProperties` object defined at the
  bottom of each component file.
- Responsive layout uses a `useIsWide` JS hook (600px breakpoint) that triggers two
  completely separate JSX render branches in `App.tsx`.
- `GameCanvas.tsx` uses Canvas 2D API with JS colour constants - this is imperative
  drawing, not DOM styling.

## Design

### CSS files

One CSS file per component, plus a global reset:

| File | Source |
|------|--------|
| `src/index.css` | Global reset (currently inline in `index.html`) |
| `src/components/App.css` | App layout, game-over panel, new-game button |
| `src/components/HUD.css` | HUD bar styling |
| `src/components/DirectionPicker.css` | 3x3 direction grid and arrow buttons |
| `src/components/ActionColumn.css` | Roll/mulligan buttons |
| `src/components/GameCanvas.css` | Canvas element sizing |

Each component imports its own CSS file (e.g. `import "./App.css"`). `index.css` is
imported by `src/index.tsx`.

### Responsive layout via CSS

Mobile-first approach. Base styles define column layout (mobile). A single
`@media (min-width: 600px)` breakpoint switches to row layout (desktop).

The key change: `App.tsx` currently renders two separate JSX branches depending on
`useIsWide()`. After refactoring, it renders **one** markup structure:

```text
.app
  .canvas-pane
    <GameCanvas />
  .controls-pane
    <HUD />
    .game-over | .controls-group
      <DirectionPicker />
      <ActionColumn />
```

CSS rearranges this structure at the breakpoint. No JS involved.

### Class names

Components use `className` instead of `style`. Plain class names, no BEM or other
methodology - the app is small enough that flat names with component-scoped files are
sufficient.

### Dynamic styling

State-dependent visual changes use CSS where possible:

- Disabled arrow buttons: `.arrow-button:disabled { opacity: 0.25; cursor: default; }`
- ActionColumn placeholder: `.action-column--hidden { opacity: 0; pointer-events: none; }`

### What does not change

- `GameCanvas.tsx` canvas rendering colours and constants stay in JS. Canvas 2D drawing
  is not DOM styling.
- Game logic, event handling, and all behavioural JS remain unchanged.
- The conditional rendering of game-over panel vs controls stays in JSX (that is
  application state logic, not layout).

### Files deleted

- `src/hooks/useIsWide.ts` - replaced by CSS media queries.
- `src/hooks/useIsWide.test.ts` - test for deleted hook.

### Files modified

- `index.html` - remove inline `<style>` block (moved to `index.css`).
- `src/index.tsx` - add `import "./index.css"`.
- `src/components/App.tsx` - remove `useIsWide` import and usage, remove dual JSX
  branches, remove `styles` object, add `import "./App.css"`, use `className`.
- `src/components/HUD.tsx` - remove `styles` object, add `import "./HUD.css"`, use
  `className`.
- `src/components/DirectionPicker.tsx` - remove `styles` object, add
  `import "./DirectionPicker.css"`, use `className`, move disabled opacity to CSS.
- `src/components/ActionColumn.tsx` - remove `styles` object, add
  `import "./ActionColumn.css"`, use `className`, move placeholder logic to CSS class.
- `src/components/GameCanvas.tsx` - remove inline `style` on `<canvas>`, add
  `import "./GameCanvas.css"`, use `className`.

### Verification

- `npm run lint` passes.
- `npm test` passes (engine tests unaffected; `useIsWide` test deleted).
- `npm run build` succeeds.
- Visual inspection: mobile layout (column, canvas on top, controls at bottom) and
  desktop layout (row, canvas left, controls right) match current behaviour exactly.
