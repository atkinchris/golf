import { test, expect } from '@playwright/test'

test.describe('Dice Golf Game - Basic Structure', () => {
  test('should display game title', async ({ page }) => {
    await page.goto('/')

    // Check for game title
    await expect(page.locator('h1')).toContainText('Golf')
  })

  test('should render game board component', async ({ page }) => {
    await page.goto('/')

    // Check for game board presence
    await expect(page.locator('[data-testid="game-board"]')).toBeVisible()
  })

  test('should display initial game controls', async ({ page }) => {
    await page.goto('/')

    // Check for essential game controls
    await expect(page.locator('[data-testid="dice-roll-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-score"]')).toBeVisible()
    await expect(page.locator('[data-testid="mulligans-remaining"]')).toBeVisible()
  })

  test('should show 16x32 grid with proper dimensions', async ({ page }) => {
    await page.goto('/')

    // Check grid dimensions
    const board = page.locator('[data-testid="game-board"]')
    const rows = board.locator('[data-testid^="board-row-"]')
    await expect(rows).toHaveCount(16)
    
    // Check first row has 32 tiles
    const firstRowTiles = rows.first().locator('[data-testid^="tile-"]')
    await expect(firstRowTiles).toHaveCount(32)
  })

  test('should initialize with ball at starting position', async ({ page }) => {
    await page.goto('/')

    // Check ball is present and positioned correctly
    await expect(page.locator('[data-testid="ball-position"]')).toBeVisible()
    await expect(page.locator('[data-testid="ball-position"]')).toContainText('0,0')
  })
})