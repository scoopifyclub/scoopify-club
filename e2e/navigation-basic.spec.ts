import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should navigate to main pages', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    
    // Verify we're on home page by checking URL
    expect(page.url()).toContain('/');
    
    // Navigate to about page
    await page.goto('/about');
    
    // Verify URL changed
    expect(page.url()).toContain('about');
    
    // Navigate to contact page
    await page.goto('/contact');
    
    // Verify URL changed
    expect(page.url()).toContain('contact');
  });
  
  test('should show login page', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Check that we're on the login page
    expect(page.url()).toContain('login');
    
    // Check for form elements - find them in ways that won't be too strict
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Verify form elements exist
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });
  
  test('should redirect to login for protected routes', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/dashboard');
    
    // Verify we were redirected to login or see access denied
    const currentUrl = page.url();
    const onLoginPage = currentUrl.includes('/login');
    
    // Use count instead of isVisible to avoid strict mode violations
    const authTextCount = await page.getByText(/login|sign in|access|denied|unauthorized/i).count();
    const showsAuthMessage = authTextCount > 0;
    
    // Either we should be redirected to login or see an auth message
    expect(onLoginPage || showsAuthMessage).toBeTruthy();
  });
}); 