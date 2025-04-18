import { test, expect } from '@playwright/test';
import { loginAs, createService, testData } from './setup';

test.describe('Services', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'customer');
  });

  test('should create a new service', async ({ page }) => {
    await createService(page);
    await expect(page).toHaveURL(/\/services\/\d+/);
    await expect(page.locator('text=Service Scheduled')).toBeVisible();
  });

  test('should show service details', async ({ page }) => {
    await createService(page);
    await expect(page.locator('text=Service Type')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Address')).toBeVisible();
    await expect(page.locator('text=Notes')).toBeVisible();
  });

  test('should allow employee to claim service', async ({ page }) => {
    // Create service as customer
    await createService(page);
    const serviceUrl = page.url();

    // Logout and login as employee
    await page.click('button[data-testid="logout-button"]');
    await loginAs(page, 'employee');

    // Navigate to service and claim it
    await page.goto(serviceUrl);
    await page.click('button[data-testid="claim-button"]');
    await expect(page.locator('text=Service Claimed')).toBeVisible();
  });

  test('should allow employee to mark arrival', async ({ page }) => {
    // Create service as customer
    await createService(page);
    const serviceUrl = page.url();

    // Logout and login as employee
    await page.click('button[data-testid="logout-button"]');
    await loginAs(page, 'employee');

    // Navigate to service, claim it, and mark arrival
    await page.goto(serviceUrl);
    await page.click('button[data-testid="claim-button"]');
    await page.click('button[data-testid="arrive-button"]');
    await expect(page.locator('text=Arrived at Location')).toBeVisible();
  });

  test('should allow employee to complete service', async ({ page }) => {
    // Create service as customer
    await createService(page);
    const serviceUrl = page.url();

    // Logout and login as employee
    await page.click('button[data-testid="logout-button"]');
    await loginAs(page, 'employee');

    // Navigate to service, claim it, and complete it
    await page.goto(serviceUrl);
    await page.click('button[data-testid="claim-button"]');
    await page.click('button[data-testid="complete-button"]');
    await expect(page.locator('text=Service Completed')).toBeVisible();
  });

  test('should show service history', async ({ page }) => {
    await page.goto('/services/history');
    await expect(page.locator('text=Service History')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should handle weather delay', async ({ page }) => {
    // Login as admin
    await page.click('button[data-testid="logout-button"]');
    await loginAs(page, 'admin');

    // Navigate to weather delay page
    await page.goto('/admin/weather-delay');
    await page.fill('input[name="startDate"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="endDate"]', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    await page.fill('textarea[name="reason"]', 'Severe weather conditions');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Weather Delay Applied')).toBeVisible();
  });
}); 