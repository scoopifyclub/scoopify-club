import { test, expect } from '@playwright/test'

test.describe('Customer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login')
    await page.fill('input[type="email"]', 'customer@scoopify.com')
    await page.fill('input[type="password"]', 'customer123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should display dashboard elements', async ({ page }) => {
    // Check for dashboard elements
    await expect(page.getByText('Upcoming Services')).toBeVisible()
    await expect(page.getByText('Service History')).toBeVisible()
    await expect(page.getByText('Billing')).toBeVisible()
    await expect(page.getByText('Settings')).toBeVisible()
  })

  test('should navigate between tabs', async ({ page }) => {
    // Test Service History tab
    await page.click('text=Service History')
    await expect(page.getByText('Past Services')).toBeVisible()

    // Test Billing tab
    await page.click('text=Billing')
    await expect(page.getByText('Current Plan')).toBeVisible()

    // Test Settings tab
    await page.click('text=Settings')
    await expect(page.getByText('Account Settings')).toBeVisible()

    // Return to Upcoming Services tab
    await page.click('text=Upcoming Services')
    await expect(page.getByText('Next Service')).toBeVisible()
  })

  test('should allow rescheduling service', async ({ page }) => {
    // Click reschedule button
    await page.click('button:has-text("Reschedule")')
    
    // Check if calendar modal appears
    await expect(page.getByText('Select New Date')).toBeVisible()
    
    // Select a new date (next available date)
    await page.click('button:has-text("Confirm")')
    
    // Check for success message
    await expect(page.getByText('Service rescheduled successfully')).toBeVisible()
  })

  test('should display service history details', async ({ page }) => {
    // Navigate to Service History tab
    await page.click('text=Service History')
    
    // Check for service details
    await expect(page.getByText('Service Date')).toBeVisible()
    await expect(page.getByText('Status')).toBeVisible()
    await expect(page.getByText('Notes')).toBeVisible()
  })
}) 