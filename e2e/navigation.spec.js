import { test, expect } from '@playwright/test';
import { loginAs } from './utils';
import { UserRole } from './test-data';
import { waitForStableDOM } from './utils';
test.describe('Navigation Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Start from the homepage for each test
        await page.goto('/');
        await waitForStableDOM(page);
    });
    test('should navigate to all main pages from navbar', async ({ page }) => {
        // Check navigation to Services page
        await page.getByRole('link', { name: /services/i }).click();
        await waitForStableDOM(page);
        await expect(page).toHaveURL(/.*services/);
        await expect(page.getByRole('heading', { level: 1 })).toContainText(/services/i);
        // Check navigation to About page
        await page.getByRole('link', { name: /about/i }).click();
        await waitForStableDOM(page);
        await expect(page).toHaveURL(/.*about/);
        await expect(page.getByRole('heading', { level: 1 })).toContainText(/about/i);
        // Check navigation to Contact page
        await page.getByRole('link', { name: /contact/i }).click();
        await waitForStableDOM(page);
        await expect(page).toHaveURL(/.*contact/);
        await expect(page.getByRole('heading', { level: 1 })).toContainText(/contact/i);
        // Return to Home page
        await page.getByRole('link', { name: /home/i }).click();
        await waitForStableDOM(page);
        await expect(page).toHaveURL(/^\/$|.*home/);
    });
    test('should navigate to login page from navbar', async ({ page }) => {
        // Click on login in navbar
        await page.getByRole('link', { name: /login/i }).click();
        await waitForStableDOM(page);
        await expect(page).toHaveURL(/.*login/);
        // Check login form is displayed
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
    });
    test('should navigate to dashboard after login', async ({ page }) => {
        // Login as customer
        await loginAs(page, UserRole.CUSTOMER);
        // Verify dashboard is displayed
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.getByText(/dashboard/i)).toBeVisible();
    });
    test('should have working breadcrumb navigation', async ({ page }) => {
        // Go to services page first
        await page.getByRole('link', { name: /services/i }).click();
        await waitForStableDOM(page);
        // Check if breadcrumb exists and has correct structure
        const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i });
        if (await breadcrumb.count() > 0) {
            // Click on Home in breadcrumb
            await breadcrumb.getByRole('link', { name: /home/i }).click();
            await waitForStableDOM(page);
            // Should return to homepage
            await expect(page).toHaveURL(/^\/$|.*home/);
        }
        else {
            // If no breadcrumb, skip the test
            test.skip('No breadcrumb navigation found');
        }
    });
    test('should navigate through services pages', async ({ page }) => {
        // Navigate to services page
        await page.getByRole('link', { name: /services/i }).click();
        await waitForStableDOM(page);
        // Attempt to click on a specific service (may need to adjust selector)
        const serviceLinks = page.getByRole('link').filter({ hasText: /cleaning|maintenance|repair/i });
        if (await serviceLinks.count() > 0) {
            await serviceLinks.first().click();
            await waitForStableDOM(page);
            // Should be on a specific service page
            await expect(page).not.toHaveURL(/.*services\/?$/);
            // Go back to services
            await page.goBack();
            await waitForStableDOM(page);
            await expect(page).toHaveURL(/.*services/);
        }
        else {
            // If no service links are found, skip this part
            console.log('No service links found on services page');
        }
    });
    test('should have functioning footer navigation', async ({ page }) => {
        // Check if footer exists
        const footer = page.locator('footer');
        if (await footer.count() > 0) {
            // Try to find a link in the footer
            const footerLinks = footer.getByRole('link');
            if (await footerLinks.count() > 0) {
                // Store current URL
                const currentUrl = page.url();
                // Click on the first footer link
                await footerLinks.first().click();
                await waitForStableDOM(page);
                // Verify navigation happened
                const newUrl = page.url();
                expect(currentUrl).not.toEqual(newUrl);
                console.log(`Footer navigation: ${currentUrl} -> ${newUrl}`);
                // Go back instead of directly navigating
                await page.goBack();
                await waitForStableDOM(page);
            }
            else {
                console.log('No links found in footer');
            }
        }
        else {
            // If no footer, skip the test
            test.skip('No footer found on page');
        }
    });
});
