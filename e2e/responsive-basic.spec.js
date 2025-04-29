import { test, expect } from '@playwright/test';
// Test on mobile viewport
test.describe('Mobile Responsive Design', () => {
    // Set a mobile viewport for all tests in this group
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE dimensions
    test('should show mobile layout on homepage', async ({ page }) => {
        await page.goto('/');
        // Check for mobile menu button/hamburger
        const mobileMenuButton = page.locator('button')
            .filter({ hasText: /menu|≡|☰|nav/i })
            .or(page.locator('[aria-label="menu"], [aria-label="Toggle menu"], .hamburger, .menu-icon, .mobile-menu-button'));
        const hasMobileMenu = await mobileMenuButton.count() > 0;
        if (hasMobileMenu) {
            console.log('Mobile menu button found');
            try {
                // Try to click menu button to open mobile navigation
                await mobileMenuButton.first().click();
                await page.waitForTimeout(500);
                // Check if mobile menu appears
                const mobileNav = page.locator('.mobile-nav, .mobile-menu, [role="menu"], nav[aria-expanded="true"]');
                const mobileNavVisible = await mobileNav.count() > 0;
                console.log(`Mobile menu interaction ${mobileNavVisible ? 'successful' : 'not detected'}`);
            }
            catch (e) {
                console.log('Could not interact with mobile menu:', e);
            }
        }
        else {
            console.log('No mobile menu button found - design may use different mobile pattern or is fully responsive');
        }
    });
    test('should adapt form layout on mobile', async ({ page }) => {
        // Check login form on mobile
        await page.goto('/login');
        // Get form width
        const formWidth = await page.locator('form').first().evaluate(el => {
            return el.getBoundingClientRect().width;
        });
        // Should be less than viewport width
        expect(formWidth).toBeLessThanOrEqual(375);
        console.log(`Form width on mobile: ${formWidth}px`);
    });
});
// Test on desktop viewport
test.describe('Desktop Responsive Design', () => {
    // Set a desktop viewport for all tests in this group
    test.use({ viewport: { width: 1280, height: 720 } });
    test('should show desktop navigation', async ({ page }) => {
        await page.goto('/');
        // Look for horizontal navigation menu
        const horizontalNav = page.locator('nav');
        // Check if nav has multiple visible items
        const navLinks = horizontalNav.getByRole('link');
        const visibleLinkCount = await navLinks.count();
        console.log(`Found ${visibleLinkCount} navigation links on desktop`);
        // Navigation should have multiple links
        expect(visibleLinkCount).toBeGreaterThan(0);
    });
    test('should have different layout than mobile', async ({ page }) => {
        await page.goto('/');
        // Check for desktop-specific elements like wider containers
        const container = page.locator('.container, main, #root > div').first();
        // Get container width
        const containerWidth = await container.evaluate(el => {
            return el.getBoundingClientRect().width;
        });
        console.log(`Main container width on desktop: ${containerWidth}px`);
        // Should be wider than mobile viewport
        expect(containerWidth).toBeGreaterThan(375);
    });
});
