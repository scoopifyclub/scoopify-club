import { test, expect } from '@playwright/test'

test.describe('Admin Login', () => {
  test('should login successfully with correct credentials', async ({ page }) => {
    await page.goto('/admin/login')
    
    // Fill in the login form
    await page.fill('input[type="email"]', 'admin@scoopify.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for navigation and check URL
    await page.waitForURL('/admin/dashboard')
    expect(page.url()).toContain('/admin/dashboard')

    // Check for dashboard elements
    await expect(page.getByText('Admin Dashboard')).toBeVisible()
    await expect(page.getByText('Total Customers')).toBeVisible()
  })

  test('should show error with incorrect credentials', async ({ page }) => {
    await page.goto('/admin/login')
    
    // Fill in the login form with incorrect credentials
    await page.fill('input[type="email"]', 'admin@scoopify.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Check for error message
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/admin/login')
    
    // Try to submit without filling in fields
    await page.click('button[type="submit"]')

    // Check for validation messages
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })
}) 