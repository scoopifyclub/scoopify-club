import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load all main sections', async ({ page }) => {
    // Check Hero section
    await expect(page.getByRole('heading', { name: 'Professional Dog Waste Removal Service' })).toBeVisible();
    
    // Check Features section
    await expect(page.getByRole('heading', { name: 'Why Choose Scoopify?' })).toBeVisible();
    await expect(page.getByText('Weekly Service')).toBeVisible();
    await expect(page.getByText('Professional Team')).toBeVisible();
    await expect(page.getByText('Easy Scheduling')).toBeVisible();
    
    // Check Pricing section
    await expect(page.getByRole('heading', { name: 'Simple, Transparent Pricing' })).toBeVisible();
    
    // Check Testimonials section
    await expect(page.getByRole('heading', { name: 'What Our Customers Say' })).toBeVisible();
    await expect(page.getByText('Sarah M.')).toBeVisible();
    await expect(page.getByText('Michael R.')).toBeVisible();
    
    // Check FAQ section
    await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();
    await expect(page.getByText('How often do you service my yard?')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Test Navbar links
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL('/about');
    await page.goBack();
    
    await page.getByRole('link', { name: 'Services' }).click();
    await expect(page).toHaveURL('/services');
    await page.goBack();
    
    await page.getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL('/pricing');
    await page.goBack();
    
    await page.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL('/contact');
    await page.goBack();
  });

  test('should have working call-to-action buttons', async ({ page }) => {
    // Test Get Started button
    await page.getByRole('button', { name: 'Get Started' }).click();
    await expect(page).toHaveURL('/signup');
    await page.goBack();
    
    // Test View Pricing button
    await page.getByRole('button', { name: 'View Pricing' }).click();
    await expect(page).toHaveURL('/pricing');
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should have working footer links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Test footer links
    await page.getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL('/privacy');
    await page.goBack();
    
    await page.getByRole('link', { name: 'Terms' }).click();
    await expect(page).toHaveURL('/terms');
  });
}); 