# Tileset Rendering Design

## Summary

Replace the solid-colour `fillRect` terrain rendering in `GameCanvas.tsx` with a programmatic tileset system that draws greyscale terrain with rounded corners, dot grids, and terrain-specific patterns. Style matches the reference images in `reference/`.

## Visual Style

Greyscale/monochrome. Minimalist. Each terrain type has a distinct fill treatment but the palette is restricted to greys, off-white, and near-black.

## Cell Size

64x64 pixels per cell (up from 16). Canvas dimensions become 1280x1920 for the 20x30 grid. The CSS `image-rendering: pixelated` property should be removed (no longer pixel art).

## Terrain Rendering (layer order, bottom to top)

### 1. Rough (base layer)

- Fills the entire canvas as flat squares - never rounded
- Colour: off-white (`#f5f5f3`)
- Dot grid: small circle (radius ~3px) at each cell centre in light grey (`#c0c0c0`)

### 2. Fairway

- Light grey fill (`#d4d4d0`)
- Rounded convex corners (radius 24px)
- Dot at cell centre (same as rough dot grid, maintaining continuity)

### 3. Sand

- Very light grey fill (`#e8e8e4`)
- Rounded convex corners (radius 24px)
- Diagonal hatch overlay: 45-degree lines, drawn in global coordinates so they flow continuously across adjacent sand tiles (known bug in mockup - alignment needs fixing during implementation)
- Dot at cell centre

### 4. Water

- Dark charcoal fill (`#4a4a4a`)
- Rounded convex corners (radius 24px)
- Grid lines only on outer edges (edges facing non-water). No internal grid lines between adjacent water tiles - the region reads as one continuous dark shape.
- Lighter dot at cell centre (`#6a6a6a`)

### 5. Trees

- Not a filled region. Trees are drawn as small black triangular pine icons on the background.
- Each tree cell gets a single tree icon centred in the cell.
- Trees do not participate in the corner-rounding system.
- Icon colour: near-black (`#1a1a1a`)

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

- Colour changes (staying greyscale)
- Course generation changes
- Game logic changes
- Animation changes
