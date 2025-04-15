import { test, expect } from '@playwright/test'

test.describe('Employee Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as employee
    await page.goto('/login')
    await page.fill('input[type="email"]', 'employee@scoopify.com')
    await page.fill('input[type="password"]', 'employee123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/employee/dashboard')
  })

  test('should display dashboard elements', async ({ page }) => {
    // Check for dashboard elements
    await expect(page.getByText('Today\'s Schedule')).toBeVisible()
    await expect(page.getByText('Service Map')).toBeVisible()
    await expect(page.getByText('Weather Alerts')).toBeVisible()
    await expect(page.getByText('Service Reports')).toBeVisible()
  })

  test('should handle service completion', async ({ page }) => {
    // Click complete service button
    await page.click('button:has-text("Complete Service")')
    
    // Fill out service report
    await page.fill('textarea[name="notes"]', 'Service completed successfully')
    await page.click('button:has-text("Submit Report")')
    
    // Check for success message
    await expect(page.getByText('Service marked as completed')).toBeVisible()
  })

  test('should report weather delay', async ({ page }) => {
    // Click weather delay button
    await page.click('button:has-text("Report Weather Delay")')
    
    // Fill out delay form
    await page.fill('textarea[name="weatherConditions"]', 'Heavy rain and flooding')
    await page.click('button:has-text("Submit Delay")')
    
    // Check for success message
    await expect(page.getByText('Weather delay reported')).toBeVisible()
  })

  test('should display service details', async ({ page }) => {
    // Click on a service in the schedule
    await page.click('.service-card')
    
    // Check for service details
    await expect(page.getByText('Customer Information')).toBeVisible()
    await expect(page.getByText('Service Location')).toBeVisible()
    await expect(page.getByText('Special Instructions')).toBeVisible()
  })

  test('should navigate service map', async ({ page }) => {
    // Check if map is visible
    await expect(page.locator('.service-map')).toBeVisible()
    
    // Check for service markers
    await expect(page.locator('.service-marker')).toBeVisible()
    
    // Test map controls
    await page.click('.map-zoom-in')
    await page.click('.map-zoom-out')
  })
}) 