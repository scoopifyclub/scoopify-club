import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData } from './helpers'

test.describe('Login Functionality', () => {
  test.beforeEach(async () => {
    await cleanupTestData()
  })

  test.afterEach(async () => {
    await cleanupTestData()
  })

  test('customer can login successfully', async ({ page }) => {
    // Navigate to customer login page
    await page.goto('/login')
    
    // Fill in login form with test customer credentials
    await page.fill('#email', 'customer@scoopify.com')
    await page.fill('#password', 'Customer123!')
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/customer-login')),
      page.click('button[type="submit"]')
    ])
    
    // Verify we're redirected to customer dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Verify customer-specific content is visible
    await expect(page.getByText('Customer Dashboard')).toBeVisible()
  })

  test('employee can login successfully', async ({ page }) => {
    // Navigate to employee login page
    await page.goto('/employee/login')
    
    // Fill in login form with test employee credentials
    await page.fill('#email', 'employee@scoopify.com')
    await page.fill('#password', 'Employee123!')
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/employee-login')),
      page.click('button[type="submit"]')
    ])
    
    // Verify we're redirected to employee dashboard
    await expect(page).toHaveURL('/employee/dashboard')
    
    // Verify employee-specific content is visible
    await expect(page.getByText('Employee Dashboard')).toBeVisible()
  })

  test('admin can login successfully', async ({ page }) => {
    // Navigate to admin login page
    await page.goto('/admin/login')
    
    // Fill in login form with test admin credentials
    await page.fill('#email', 'admin@scoopify.com')
    await page.fill('#password', 'admin123')
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/admin/login')),
      page.click('button[type="submit"]')
    ])
    
    // Verify we're redirected to admin dashboard
    await expect(page).toHaveURL('/admin/dashboard')
    
    // Verify admin-specific content is visible
    await expect(page.getByText('Admin Dashboard')).toBeVisible()
  })

  test('handles invalid credentials correctly', async ({ page }) => {
    // Test customer login with invalid credentials
    await page.goto('/login')
    await page.fill('#email', 'wrong@email.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.getByText('Invalid email or password')).toBeVisible()

    // Test employee login with invalid credentials
    await page.goto('/employee/login')
    await page.fill('#email', 'wrong@email.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.getByText('Invalid email or password')).toBeVisible()

    // Test admin login with invalid credentials
    await page.goto('/admin/login')
    await page.fill('#email', 'wrong@email.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('prevents role mismatches', async ({ page }) => {
    // Try to use customer credentials on employee login
    await page.goto('/employee/login')
    await page.fill('#email', 'customer@scoopify.com')
    await page.fill('#password', 'Customer123!')
    await page.click('button[type="submit"]')
    await expect(page.getByText('This account is not authorized for employee access')).toBeVisible()

    // Try to use employee credentials on customer login
    await page.goto('/login')
    await page.fill('#email', 'employee@scoopify.com')
    await page.fill('#password', 'Employee123!')
    await page.click('button[type="submit"]')
    await expect(page.getByText('This account is not authorized for customer access')).toBeVisible()
  })

  test('redirects authenticated users appropriately', async ({ page }) => {
    // Login as customer first
    await page.goto('/login')
    await page.fill('#email', 'customer@scoopify.com')
    await page.fill('#password', 'Customer123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Try to access login pages while authenticated
    await page.goto('/login')
    await expect(page).toHaveURL('/dashboard')
    await page.goto('/employee/login')
    await expect(page).toHaveURL('/dashboard')
    await page.goto('/admin/login')
    await expect(page).toHaveURL('/dashboard')
  })
})