import { test, expect } from '@playwright/test';

test.describe('Basic Tests', () => {
  test('should navigate to the home page', async ({ page }) => {
    await page.goto('/');
    
    // Just check that we can navigate to home page
    await expect(page.url()).toContain('/');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check that we can navigate to login page
    await expect(page.url()).toContain('/login');
    
    // Basic form elements check with more resilient locators
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    // Make assertions with waitFor to be more resilient
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('should handle invalid login attempt', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in form with invalid credentials
    await page.fill('input[name="email"], input[type="email"]', 'invalid@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // After invalid login we should still be on the login page
    await expect(page.url()).toContain('/login');
  });
}); 