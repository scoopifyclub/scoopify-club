import { test, expect } from '@playwright/test';
import { loginAs, testData } from './setup';

test.describe('Authentication', () => {
  test('should login successfully as customer', async ({ page }) => {
    await loginAs(page, 'customer');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should login successfully as employee', async ({ page }) => {
    await loginAs(page, 'employee');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Employee Dashboard')).toBeVisible();
  });

  test('should login successfully as admin', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    await loginAs(page, 'customer');
    await page.click('button[data-testid="logout-button"]');
    await expect(page).toHaveURL('/login');
  });

  test('should handle rate limiting', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
    }
    await expect(page.locator('text=Too many attempts')).toBeVisible();
  });
}); 