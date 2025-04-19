import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData, loginAs } from './helpers/auth';

test.describe('Authentication', () => {
  test.beforeEach(async () => {
    await cleanupTestData();
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('customer can login successfully', async ({ page }) => {
    // Setup test customer
    await setupTestUser('CUSTOMER');
    
    // Login and verify
    await loginAs(page, 'customer');
    
    // Verify customer-specific content
    await expect(page.getByText('Customer Dashboard')).toBeVisible();
    await expect(page.getByText('My Services')).toBeVisible();
    await expect(page.getByText('Payment History')).toBeVisible();
  });

  test('employee can login successfully', async ({ page }) => {
    // Setup test employee
    await setupTestUser('EMPLOYEE');
    
    // Login and verify
    await loginAs(page, 'employee');
    
    // Verify employee-specific content
    await expect(page.getByText('Employee Dashboard')).toBeVisible();
    await expect(page.getByText('Today\'s Schedule')).toBeVisible();
    await expect(page.getByText('Service History')).toBeVisible();
  });

  test('admin can login successfully', async ({ page }) => {
    // Setup test admin
    await setupTestUser('ADMIN');
    
    // Login and verify
    await loginAs(page, 'admin');
    
    // Verify admin-specific content
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
    await expect(page.getByText('Manage Users')).toBeVisible();
    await expect(page.getByText('System Settings')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form and wait for response
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/auth/customer-login')),
      page.click('button[type="submit"]'),
    ]);

    // Verify error response
    expect(response.status()).toBe(401);
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('redirects to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('can logout successfully', async ({ page }) => {
    // Setup and login as customer
    await setupTestUser('CUSTOMER');
    await loginAs(page, 'customer');
    
    // Click logout button
    await page.click('[data-testid="logout-button"]');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
    
    // Try to access dashboard again
    await page.goto('/dashboard');
    
    // Should be redirected back to login
    await expect(page).toHaveURL('/login');
  });
}); 