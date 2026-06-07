# Tileset Rendering Design

## Summary

Replace the solid-colour `fillRect` terrain rendering in `GameCanvas.tsx` with a programmatic tileset system that draws coloured terrain with rounded corners, dot grids, and terrain-specific patterns. Style matches the reference images in `reference/` and `reference/colours/`.

## Visual Style

Minimalist. Each terrain type has a distinct fill colour. Dot overlays use a darker shade of their terrain's fill colour. Non-terrain elements (tee, hole, ball, shot path, slope arrows) remain dark/near-black.

## Cell Size

64x64 pixels per cell (up from 16). Canvas dimensions become 1280x1920 for the 20x30 grid. The CSS `image-rendering: pixelated` property should be removed (no longer pixel art).

## Terrain Rendering (layer order, bottom to top)

### 1. Rough (base layer)

- Fills the entire canvas as flat squares - never rounded
- Colour: warm off-white (`#f0f0eb`)
- Dot grid: small circle (radius ~3px) at each cell centre in `#b8b8b2`

### 2. Fairway

- Sage green fill (`#87ab78`)
- Rounded convex corners (radius 24px)
- Dot at cell centre in `#5e8050`

### 3. Sand

- Muted gold fill (`#b5993c`)
- Rounded convex corners (radius 24px)
- Diagonal hatch overlay: 45-degree lines, drawn in global coordinates so they flow continuously across adjacent sand tiles (known bug in mockup - alignment needs fixing during implementation), hatch colour `#8a7028`
- Dot at cell centre in `#8a7028`

### 4. Water

- Steel blue fill (`#5b8fcc`)
- Rounded convex corners (radius 24px)
- Grid lines only on outer edges (edges facing non-water). No internal grid lines between adjacent water tiles - the region reads as one continuous shape.
- Dot at cell centre in `#3a6aaa`

### 5. Trees

- Not a filled region. Trees are drawn as small triangular pine icons on the background.
- Each tree cell gets a single tree icon centred in the cell.
- Trees do not participate in the corner-rounding system.
- Icon colour: dark forest green (`#3a5e2a`)

## Corner Rounding Algorithm

A tile's corner is rounded only when **both** adjacent cardinal neighbours for that corner are either:
- Rough terrain
- Tree terrain (trees are icons, not filled)
- Out of bounds

If either cardinal neighbour is any non-rough, non-tree terrain (fairway, sand, or water - including a different type), that corner stays square. This prevents gaps between adjacent terrain regions of different types.

Example: top-left corner rounds only if the cell above AND the cell to the left are both rough/trees/OOB.

## Other Rendered Elements (unchanged behaviour, scaled for 64px cells)

- **Tee**: filled black circle (radius ~12px)
- **Hole**: stroked black circle ring (radius ~10px, lineWidth 3)
- **Slope arrows**: Unicode arrow characters (font size scaled to 64px cells)
- **Shot path**: dashed white lines between shot positions
- **Ball**: white circle with dark outline
- **Grid lines**: removed (the dot grid replaces them)

## Caching

The existing `OffscreenCanvas` + `createImageBitmap()` pattern is preserved. The course bitmap is regenerated only when the course object changes. The new rendering logic replaces what happens inside the cache generation function.

## Files Changed

- `src/components/GameCanvas.tsx` - replace terrain drawing, update CELL_SIZE to 64, add layer rendering functions
- `src/components/GameCanvas.css` - remove `image-rendering: pixelated`

## Known Issue (to fix during implementation)

Sand diagonal hatch alignment across tile boundaries. The lines must be computed in global canvas coordinates and clipped per-tile so adjacent sand tiles show continuous, unbroken diagonal lines.

## Out of Scope

- Course generation changes
- Game logic changes
- Animation changes
