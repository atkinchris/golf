# Keyboard Controls Design

Date: 2026-06-07

## Goal

Allow the game to be played entirely via keyboard, using the QWEADZXC cluster for
directions and S for rolling the dice.

## Key Mapping

```text
Q=NW  W=N   E=NE
A=W   S=Roll D=E
Z=SW  X=S    C=SE
```

Keys are matched case-insensitively against `event.key`.

`preventDefault` is called for each matched key to suppress any browser default
behaviour (e.g. page scrolling on W/A/S/D/X/Z).

## Gating Rules

- Direction keys (Q W E A D Z X C): fire when `!disabled` regardless of phase.
  `handleDirection` already branches internally on phase to choose between a
  directional shot and a putt.
- S (Roll): fires only when `!disabled && phase === Phase.AwaitingRoll`. Inert
  at all other times.

## Implementation

### New file: `src/hooks/useKeyboard.ts`

```text
interface UseKeyboardOptions {
  phase: Phase;
  disabled: boolean;
  onRoll: () => void;
  onDirection: (dir: Direction) => void;
}
```

Attaches a single `keydown` listener to `window` in a `useEffect`. The listener
is torn down on unmount and re-registered whenever `phase`, `disabled`, `onRoll`,
or `onDirection` changes (dependency array).

### Change to `src/components/App.tsx`

Add one call:

```text
useKeyboard({ phase: state.phase, disabled: isAnimating, onRoll: handleRoll, onDirection: handleDirection });
```

No other files change.

## Out of Scope

- Visual key-hint overlays on the direction buttons
- Rebindable keys
- New Game / any HUD keyboard shortcut
