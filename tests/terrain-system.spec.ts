import { test, expect } from '@playwright/test'

test.describe('Dice Golf Game - Terrain System', () => {
  test('should render different terrain types with proper styling', async ({ page }) => {
    await page.goto('/')

    // Check that different terrain types exist and are visually distinct
    await expect(page.locator('[data-testid*="tile"][data-terrain="rough"]')).toHaveCount.greaterThan(0)
    await expect(page.locator('[data-testid*="tile"][data-terrain="fairway"]')).toHaveCount.greaterThan(0)
    await expect(page.locator('[data-testid*="tile"][data-terrain="sand"]')).toHaveCount.greaterThan(0)
    await expect(page.locator('[data-testid*="tile"][data-terrain="water"]')).toHaveCount.greaterThan(0)
    await expect(page.locator('[data-testid*="tile"][data-terrain="trees"]')).toHaveCount.greaterThan(0)
    await expect(page.locator('[data-testid*="tile"][data-terrain="hole"]')).toHaveCount.greaterThan(0)
  })

  test('should have terrain legend visible', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('[data-testid="terrain-legend"]')).toBeVisible()
    
    // Check legend contains all terrain types
    const legend = page.locator('[data-testid="terrain-legend"]')
    await expect(legend).toContainText('Rough')
    await expect(legend).toContainText('Fairway')
    await expect(legend).toContainText('Sand')
    await expect(legend).toContainText('Water')
    await expect(legend).toContainText('Trees')
    await expect(legend).toContainText('Hole')
  })

  test('should display terrain-specific information on hover', async ({ page }) => {
    await page.goto('/')

    // Test fairway tile hover
    const fairwayTile = page.locator('[data-testid*="tile"][data-terrain="fairway"]').first()
    await fairwayTile.hover()
    
    // Should show terrain info
    await expect(page.locator('[data-testid="terrain-info"]')).toBeVisible()
    await expect(page.locator('[data-testid="terrain-info"]')).toContainText('Fairway: +1 movement')
  })

  test('should show slopes with directional arrows', async ({ page }) => {
    await page.goto('/')

    // Check for slope tiles with arrows
    const slopeTiles = page.locator('[data-testid*="tile"][data-terrain="slope"]')
    await expect(slopeTiles).toHaveCount.greaterThan(0)
    
    // First slope should have direction indicator
    const firstSlope = slopeTiles.first()
    await expect(firstSlope).toHaveAttribute('data-slope-direction')
  })
})