import { test, expect } from '@playwright/test'

test.describe('Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Increase navigation timeout for the initial page load
    await page.goto('/', { timeout: 60000 })
  })

  test('Home Page Navigation', async ({ page }) => {
    // Test main navigation links
    const navLinks = [
      { text: 'Home', href: '/', selector: '[data-testid="nav-home"]' },
      { text: 'Services', href: '/services', selector: '[data-testid="nav-services"]' },
      { text: 'Pricing', href: '/pricing', selector: '[data-testid="nav-pricing"]' },
      { text: 'About', href: '/about', selector: '[data-testid="nav-about"]' },
      { text: 'Contact', href: '/contact', selector: '[data-testid="nav-contact"]' },
    ]

    for (const link of navLinks) {
      const element = page.locator(link.selector)
      await expect(element).toBeVisible()
      await element.click()
      await expect(page).toHaveURL(link.href)
      await page.goBack()
    }

    // Test auth buttons
    const loginButton = page.locator('[data-testid="nav-login"]')
    await expect(loginButton).toBeVisible()
    await loginButton.click()
    await expect(page).toHaveURL('/login')
    await page.goBack()

    const signupButton = page.locator('[data-testid="nav-signup"]')
    await expect(signupButton).toBeVisible()
    await signupButton.click()
    await expect(page).toHaveURL('/signup')
    await page.goBack()
  })

  test('Mobile Navigation', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })

    // Test mobile menu toggle
    const menuButton = page.locator('[data-testid="mobile-menu-button"]')
    await expect(menuButton).toBeVisible()
    await menuButton.click()
    
    // Verify mobile menu links
    const mobileLinks = [
      { text: 'Home', href: '/', selector: '[data-testid="mobile-nav-home"]' },
      { text: 'Services', href: '/services', selector: '[data-testid="mobile-nav-services"]' },
      { text: 'Pricing', href: '/pricing', selector: '[data-testid="mobile-nav-pricing"]' },
      { text: 'About', href: '/about', selector: '[data-testid="mobile-nav-about"]' },
      { text: 'Contact', href: '/contact', selector: '[data-testid="mobile-nav-contact"]' },
      { text: 'Log in', href: '/login', selector: '[data-testid="mobile-nav-login"]' },
      { text: 'Sign up', href: '/signup', selector: '[data-testid="mobile-nav-signup"]' },
    ]

    for (const link of mobileLinks) {
      const element = page.locator(link.selector)
      await expect(element).toBeVisible()
      await element.click()
      await expect(page).toHaveURL(link.href)
      await page.goBack()
      await menuButton.click()
    }
  })

  test('Footer Navigation', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Test footer links
    const footerLinks = [
      { text: 'Home', href: '/', selector: '[data-testid="footer-home"]' },
      { text: 'Services', href: '/services', selector: '[data-testid="footer-services"]' },
      { text: 'Pricing', href: '/pricing', selector: '[data-testid="footer-pricing"]' },
      { text: 'About', href: '/about', selector: '[data-testid="footer-about"]' },
      { text: 'Contact', href: '/contact', selector: '[data-testid="footer-contact"]' },
      { text: 'Privacy', href: '/privacy', selector: '[data-testid="footer-privacy"]' },
      { text: 'Terms', href: '/terms', selector: '[data-testid="footer-terms"]' },
    ]

    for (const link of footerLinks) {
      const element = page.locator(link.selector)
      await expect(element).toBeVisible()
      await element.click()
      await expect(page).toHaveURL(link.href)
      await page.goBack()
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    }
  })

  test('Dashboard Navigation', async ({ page }) => {
    // Login first
    await page.goto('/login')
    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')
    const submitButton = page.locator('[data-testid="login-submit"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()

    await emailInput.fill('test@example.com')
    await passwordInput.fill('password')
    await submitButton.click()

    // Wait for dashboard to load with a longer timeout
    await page.waitForURL('/dashboard', { timeout: 60000 })

    // Test dashboard navigation
    const dashboardLinks = [
      { text: 'Schedule Service', href: '/dashboard/schedule', selector: '[data-testid="dashboard-schedule"]' },
      { text: 'Service History', href: '/dashboard/history', selector: '[data-testid="dashboard-history"]' },
      { text: 'Billing', href: '/dashboard/billing', selector: '[data-testid="dashboard-billing"]' },
      { text: 'Settings', href: '/dashboard/settings', selector: '[data-testid="dashboard-settings"]' },
    ]

    for (const link of dashboardLinks) {
      const element = page.locator(link.selector)
      await expect(element).toBeVisible()
      await element.click()
      await expect(page).toHaveURL(link.href)
      await page.goBack()
    }
  })

  test('Employee Dashboard Navigation', async ({ page }) => {
    // Login as employee
    await page.goto('/login')
    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')
    const submitButton = page.locator('[data-testid="login-submit"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()

    await emailInput.fill('employee@example.com')
    await passwordInput.fill('password')
    await submitButton.click()

    // Wait for employee dashboard to load with a longer timeout
    await page.waitForURL('/employee/dashboard', { timeout: 60000 })

    // Test employee dashboard navigation
    const employeeLinks = [
      { text: 'Today\'s Schedule', href: '/employee/schedule', selector: '[data-testid="employee-schedule"]' },
      { text: 'Service History', href: '/employee/history', selector: '[data-testid="employee-history"]' },
      { text: 'Earnings', href: '/employee/earnings', selector: '[data-testid="employee-earnings"]' },
      { text: 'Settings', href: '/employee/settings', selector: '[data-testid="employee-settings"]' },
    ]

    for (const link of employeeLinks) {
      const element = page.locator(link.selector)
      await expect(element).toBeVisible()
      await element.click()
      await expect(page).toHaveURL(link.href)
      await page.goBack()
    }
  })

  test('Admin Dashboard Navigation', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')
    const submitButton = page.locator('[data-testid="login-submit"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()

    await emailInput.fill('admin@example.com')
    await passwordInput.fill('password')
    await submitButton.click()

    // Wait for admin dashboard to load with a longer timeout
    await page.waitForURL('/admin/dashboard', { timeout: 60000 })

    // Test admin dashboard navigation
    const adminLinks = [
      { text: 'Customers', href: '/admin/customers', selector: '[data-testid="admin-customers"]' },
      { text: 'Employees', href: '/admin/employees', selector: '[data-testid="admin-employees"]' },
      { text: 'Services', href: '/admin/services', selector: '[data-testid="admin-services"]' },
      { text: 'Reports', href: '/admin/reports', selector: '[data-testid="admin-reports"]' },
      { text: 'Settings', href: '/admin/settings', selector: '[data-testid="admin-settings"]' },
    ]

    for (const link of adminLinks) {
      const element = page.locator(link.selector)
      await expect(element).toBeVisible()
      await element.click()
      await expect(page).toHaveURL(link.href)
      await page.goBack()
    }
  })
}) 