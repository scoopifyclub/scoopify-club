const { test, expect } = require('@playwright/test');

test.describe('Homepage Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('https://www.scoopify.club');
  });

  test('Main navigation buttons work correctly', async ({ page }) => {
    // Test "Join the Club" button
    await page.click('text=Join the Club');
    await expect(page).toHaveURL(/.*\/signup/);
    await expect(page.locator('h1')).toContainText(/Sign Up/i);

    // Go back to homepage
    await page.goto('https://www.scoopify.club');

    // Test "Learn More" button
    await page.click('text=Learn More');
    await expect(page).toHaveURL(/.*\/services/);
    await expect(page.locator('h1')).toContainText(/Services/i);

    // Go back to homepage
    await page.goto('https://www.scoopify.club');

    // Test "Become a Scooper" button
    await page.click('text=Become a Scooper');
    await expect(page).toHaveURL(/.*\/auth\/scooper-signup/);
    await expect(page.locator('h1')).toContainText(/Sign Up/i);
  });

  test('Feature sections are visible and interactive', async ({ page }) => {
    // Test Professional Service section
    await expect(page.locator('text=Professional Service')).toBeVisible();
    await expect(page.locator('text=Never wonder if your yard has been cleaned')).toBeVisible();

    // Test Flexible Scheduling section
    await expect(page.locator('text=Flexible Scheduling')).toBeVisible();
    await expect(page.locator('text=Select your preferred service day')).toBeVisible();

    // Test Quality Guaranteed section
    await expect(page.locator('text=Quality Guaranteed')).toBeVisible();
    await expect(page.locator('text=View before and after photos')).toBeVisible();
  });

  test('Modern features section is visible', async ({ page }) => {
    // Test Digital Dashboard section
    await expect(page.locator('text=Digital Dashboard')).toBeVisible();
    await expect(page.locator('text=Manage your services')).toBeVisible();

    // Test Photo Verification section
    await expect(page.locator('text=Photo Verification')).toBeVisible();
    await expect(page.locator('text=Every service is documented')).toBeVisible();

    // Test Satisfaction Tracking section
    await expect(page.locator('text=Satisfaction Tracking')).toBeVisible();
    await expect(page.locator('text=Rate each service')).toBeVisible();
  });

  test('Testimonial section is visible', async ({ page }) => {
    await expect(page.locator('text=Since using Scoopify Club')).toBeVisible();
    await expect(page.locator('text=Jessica L.')).toBeVisible();
  });

  test('Navigation menu works correctly', async ({ page }) => {
    // Test Home link
    await page.click('text=Home');
    await expect(page).toHaveURL('https://www.scoopify.club');

    // Test Services link
    await page.click('text=Services');
    await expect(page).toHaveURL(/.*\/services/);

    // Test Pricing link
    await page.click('text=Pricing');
    await expect(page).toHaveURL(/.*\/pricing/);

    // Test About link
    await page.click('text=About');
    await expect(page).toHaveURL(/.*\/about/);
  });

  test('Footer links work correctly', async ({ page }) => {
    // Test Contact link
    await page.click('text=Contact');
    await expect(page).toHaveURL(/.*\/contact/);

    // Test Privacy link
    await page.click('text=Privacy');
    await expect(page).toHaveURL(/.*\/privacy/);

    // Test Terms link
    await page.click('text=Terms');
    await expect(page).toHaveURL(/.*\/terms/);
  });
}); 