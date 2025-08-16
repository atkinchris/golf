import { test, expect } from '@playwright/test'

test.describe('Dice Golf Game - Game Mechanics', () => {
  test('should roll dice and display result', async ({ page }) => {
    await page.goto('/')

    // Click roll dice button
    await page.click('[data-testid="dice-roll-button"]')

    // Should show dice result
    await expect(page.locator('[data-testid="dice-result"]')).toBeVisible()
    
    // Result should be between 1-6
    const diceText = await page.locator('[data-testid="dice-result"]').textContent()
    const diceValue = parseInt(diceText?.match(/\d+/)?.[0] || '0')
    expect(diceValue).toBeGreaterThanOrEqual(1)
    expect(diceValue).toBeLessThanOrEqual(6)
  })

  test('should allow re-roll when teeing off', async ({ page }) => {
    await page.goto('/')

    // Initial roll
    await page.click('[data-testid="dice-roll-button"]')
    
    // Re-roll button should be available for tee-off
    await expect(page.locator('[data-testid="reroll-button"]')).toBeVisible()
    
    // Click re-roll
    await page.click('[data-testid="reroll-button"]')
    
    // Should show new result and disable re-roll
    await expect(page.locator('[data-testid="dice-result"]')).toBeVisible()
    await expect(page.locator('[data-testid="reroll-button"]')).toBeDisabled()
  })

  test('should display movement direction options after dice roll', async ({ page }) => {
    await page.goto('/')

    await page.click('[data-testid="dice-roll-button"]')
    
    // Should show 8 directional movement options
    const directions = page.locator('[data-testid^="direction-"]')
    await expect(directions).toHaveCount(8)
    
    // Check specific directions exist
    await expect(page.locator('[data-testid="direction-north"]')).toBeVisible()
    await expect(page.locator('[data-testid="direction-south"]')).toBeVisible()
    await expect(page.locator('[data-testid="direction-east"]')).toBeVisible()
    await expect(page.locator('[data-testid="direction-west"]')).toBeVisible()
    await expect(page.locator('[data-testid="direction-northeast"]')).toBeVisible()
    await expect(page.locator('[data-testid="direction-northwest"]')).toBeVisible()
    await expect(page.locator('[data-testid="direction-southeast"]')).toBeVisible()
    await expect(page.locator('[data-testid="direction-southwest"]')).toBeVisible()
  })

  test('should move ball when direction is selected', async ({ page }) => {
    await page.goto('/')

    // Get initial ball position
    const initialPos = await page.locator('[data-testid="ball-position"]').textContent()
    
    // Roll dice and select direction
    await page.click('[data-testid="dice-roll-button"]')
    await page.click('[data-testid="direction-north"]')
    
    // Ball position should change
    const newPos = await page.locator('[data-testid="ball-position"]').textContent()
    expect(newPos).not.toBe(initialPos)
    
    // Score should increase
    await expect(page.locator('[data-testid="game-score"]')).toContainText('1')
  })

  test('should handle mulligan usage', async ({ page }) => {
    await page.goto('/')

    // Should start with 6 mulligans
    await expect(page.locator('[data-testid="mulligans-remaining"]')).toContainText('6')
    
    // Roll dice first
    await page.click('[data-testid="dice-roll-button"]')
    
    // Use mulligan
    await page.click('[data-testid="use-mulligan-button"]')
    
    // Mulligans should decrease
    await expect(page.locator('[data-testid="mulligans-remaining"]')).toContainText('5')
    
    // Should get new dice roll
    await expect(page.locator('[data-testid="dice-result"]')).toBeVisible()
  })

  test('should apply terrain modifiers to movement', async ({ page }) => {
    await page.goto('/')

    // Set up test with ball on fairway (this would normally be done through game setup)
    await page.evaluate(() => {
      (window as any).testSetBallPosition?.(2, 3, 'fairway')
    })

    // Roll dice
    await page.click('[data-testid="dice-roll-button"]')
    
    // Get dice result
    const diceText = await page.locator('[data-testid="dice-result"]').textContent()
    const baseDice = parseInt(diceText?.match(/\d+/)?.[0] || '0')
    
    // Movement range should show fairway bonus (+1)
    const movementRange = page.locator('[data-testid="movement-range"]')
    await expect(movementRange).toContainText(`${baseDice + 1}`)
  })
})