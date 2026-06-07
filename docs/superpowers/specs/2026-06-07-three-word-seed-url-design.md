# Three-word seed and URL integration

## Goal

Replace the current random alphanumeric seed (e.g. `k3x9mq2a`) with a human-readable
three-word seed (e.g. `brave-copper-wolf`), and make the active seed visible and
shareable via the URL query string.

## Seed generation

Use `unique-names-generator` (npm) with its bundled `adjectives`, `colors`, and `animals`
word lists. Configuration: 3 words, hyphen separator, lower-case. This produces seeds like
`brave-copper-wolf`.

The existing `PRNG` class in `src/engine/prng.ts` hashes string seeds via a polynomial
rolling hash and requires no changes.

Replace `generateSeed()` in `src/components/App.tsx` with a call to
`uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals], separator: '-' })`.

## URL integration

The URL query parameter is `seed`. Example: `/golf/?seed=brave-copper-wolf`.

### On app load

1. Read `window.location.search` with `URLSearchParams`.
2. If `?seed=` is present, use that value as the initial seed.
3. If absent, generate a new three-word seed and immediately write it to the URL
   with `history.replaceState` (no navigation, no history entry).

### On new game

Generate a new seed and update the URL with `history.pushState` so the browser
back button restores the previous game's seed.

### localStorage interaction

`useGameStorage` persists the event log, which already contains the seed inside
`GameStartedEvent`. No structural changes to the storage hook are required. The
URL seed is the source of truth for which game to start; localStorage provides
the saved progress for a matching seed.

## Affected files

| File | Change |
|---|---|
| `package.json` | add `unique-names-generator` runtime dependency |
| `src/components/App.tsx` | replace `generateSeed()`, add URL read/write logic |

## Out of scope

- The dice roll (`Math.floor(Math.random() * 6) + 1`) is intentionally not seeded.
- No changes to `PRNG`, `course.ts`, `useGameStorage`, or any other file.
