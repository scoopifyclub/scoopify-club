const { test, expect } = require('@playwright/test');

test.describe('Authentication Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('https://www.scoopify.club/auth/signin');
  });

  test('Login form is visible and has required fields', async ({ page }) => {
    // Check if email field exists
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Check if password field exists
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check if login button exists
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check if "create a new account" link exists
    await expect(page.locator('text=create a new account')).toBeVisible();
    
    // Check if "Forgot your password?" link exists
    await expect(page.locator('text=Forgot your password?')).toBeVisible();
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('Login with valid credentials redirects to dashboard', async ({ page }) => {
    // Fill in valid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123!@#');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Check if redirected to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Forgot password link works', async ({ page }) => {
    // Click forgot password link
    await page.click('text=Forgot your password?');
    
    // Check if redirected to forgot password page
    await expect(page).toHaveURL(/.*\/auth\/forgot-password/);
    
    // Check if email input field exists
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Sign up link works', async ({ page }) => {
    // Click sign up link
    await page.click('text=create a new account');
    
    // Check if redirected to signup page
    await expect(page).toHaveURL(/.*\/auth\/signup/);
    
    // Check if signup form is visible
    await expect(page.locator('form')).toBeVisible();
  });
}); 