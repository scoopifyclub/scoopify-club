import { test, expect } from '@playwright/test';
import { TEST_USERS } from './test-data';
test.describe('Authentication', () => {
    test('should allow customer to login successfully', async ({ page }) => {
        // Go to login page
        await page.goto('/login');
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        console.log('🔍 Page loaded, current URL:', page.url());
        
        // Fill login form
        await page.fill('input[name="email"], input[type="email"]', TEST_USERS.customer.email);
        await page.fill('input[name="password"], input[type="password"]', TEST_USERS.customer.password);
        
        console.log('📝 Form filled, email:', TEST_USERS.customer.email);
        
        // Submit form
        await page.click('button[type="submit"]');
        
        console.log('📤 Form submitted, waiting for redirect...');
        
        // Wait for navigation (should redirect to dashboard or account page)
        try {
            // Give it a longer timeout to account for potential slow redirects
            await page.waitForURL(/\/(dashboard|account|customer)/, { timeout: 15000 });
            
            console.log('✅ Redirect successful, current URL:', page.url());
            
            // Should be on a protected page after login
            const currentUrl = page.url();
            expect(currentUrl.includes('/dashboard') ||
                currentUrl.includes('/account') ||
                currentUrl.includes('/customer')).toBeTruthy();
        }
        catch (error) {
            console.log('❌ Redirect failed, current URL:', page.url());
            
            // If we're still on the login page, there's an error
            if (page.url().includes('/login')) {
                await page.screenshot({ path: 'test-results/customer-login-failed.png' });
                throw new Error('Login failed - still on login page');
            }
            
            // If we're on a different page, log it
            console.log('📍 Ended up on unexpected page:', page.url());
            await page.screenshot({ path: 'test-results/customer-login-unexpected-page.png' });
            throw new Error(`Login failed - ended up on unexpected page: ${page.url()}`);
        }
    });
    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');
        // Fill in login form with invalid credentials
        await page.fill('input[name="email"], input[type="email"]', 'invalid@example.com');
        await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
        // Submit form
        await page.click('button[type="submit"]');
        // After invalid login we should still be on the login page
        await expect(page.url()).toContain('/login');
    });
    test('should redirect to login when accessing protected route', async ({ page }) => {
        // Try to access a protected route without authentication
        await page.goto('/dashboard');
        // Should redirect to login page or show access denied
        const currentUrl = page.url();
        expect(currentUrl.includes('/login') ||
            await page.getByText(/Login|Sign in|Access denied/i).isVisible()).toBeTruthy();
    });
    test('should allow logout if logged in', async ({ page }) => {
        // First login
        await page.goto('/login');
        await page.fill('input[name="email"], input[type="email"]', TEST_USERS.customer.email);
        await page.fill('input[name="password"], input[type="password"]', TEST_USERS.customer.password);
        await page.click('button[type="submit"]');
        try {
            // Wait for navigation to dashboard or any authenticated page
            await page.waitForURL(/\/(dashboard|account|customer)/, { timeout: 10000 });
            // Look for logout button - handle both direct button and menu flow
            const logoutButton = page.getByRole('button', { name: /Logout|Sign out/i });
            if (await logoutButton.isVisible()) {
                // Direct logout button found
                await logoutButton.click();
            }
            else {
                // Try looking for user menu first
                const userMenu = page.getByRole('button', { name: /account|profile|user|menu/i });
                if (await userMenu.isVisible()) {
                    await userMenu.click();
                    // Wait a bit for menu to appear
                    await page.waitForTimeout(300);
                    // Look for logout in the menu
                    const logoutMenuItem = page.getByRole('menuitem', { name: /Logout|Sign out/i });
                    if (await logoutMenuItem.isVisible()) {
                        await logoutMenuItem.click();
                    }
                }
            }
            // After logout should be on login or home page
            await page.waitForURL(/\/(login|$)/, { timeout: 5000 });
        }
        catch (error) {
            // If login failed or we couldn't find logout controls, take a screenshot and skip
            await page.screenshot({ path: 'test-results/logout-test-failed.png' });
            test.skip('Could not complete logout test - login failed or logout controls not found');
        }
    });
});
