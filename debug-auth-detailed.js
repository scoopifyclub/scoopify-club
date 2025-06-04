const { chromium } = require('playwright');

async function debugAuthFlow() {
    const browser = await chromium.launch({ headless: false }); // Non-headless for debugging
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 Debugging Authentication Flow in Detail...\n');
    
    try {
        // Enable request/response logging
        page.on('request', request => {
            if (request.url().includes('/api/auth/')) {
                console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
                if (request.method() === 'POST') {
                    console.log(`📤 POST Data: ${request.postData()}`);
                }
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('/api/auth/')) {
                console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
            }
        });
        
        // Go to login page
        console.log('1. Navigating to login page...');
        await page.goto('https://www.scoopify.club/login');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        console.log('2. Current URL:', page.url());
        
        // Check form elements
        const forms = await page.locator('form').count();
        const emailInputs = await page.locator('input[type="email"]').count();
        const passwordInputs = await page.locator('input[type="password"]').count();
        const submitButtons = await page.locator('button[type="submit"]').count();
        
        console.log(`3. Form elements found: ${forms} forms, ${emailInputs} email inputs, ${passwordInputs} password inputs, ${submitButtons} submit buttons`);
        
        if (forms === 0) {
            console.log('❌ No forms found on login page!');
            return;
        }
        
        // Fill in admin credentials
        console.log('4. Filling in admin credentials...');
        await page.fill('input[type="email"]', 'admin@scoopify.club');
        await page.fill('input[type="password"]', 'admin123');
        
        // Check what happens when we submit
        console.log('5. Submitting login form...');
        
        // Listen for console logs from the page
        page.on('console', msg => {
            console.log(`🖥️  PAGE LOG: ${msg.text()}`);
        });
        
        const submitButton = await page.locator('button[type="submit"]').first();
        await submitButton.click();
        
        // Wait for response
        console.log('6. Waiting for login response...');
        await page.waitForTimeout(5000);
        
        console.log('7. Current URL after login:', page.url());
        
        // Check cookies
        const cookies = await context.cookies();
        console.log('8. Cookies after login:');
        cookies.forEach(cookie => {
            if (cookie.name.includes('token') || cookie.name.includes('Token')) {
                console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
            }
        });
        
        // Check for error messages on page
        const errorElements = await page.locator('.error, [role="alert"], .alert-error').count();
        if (errorElements > 0) {
            const errorText = await page.locator('.error, [role="alert"], .alert-error').first().textContent();
            console.log('9. Error message found:', errorText);
        } else {
            console.log('9. No error messages found on page');
        }
        
        // Try to manually navigate to admin dashboard
        console.log('10. Attempting to navigate to admin dashboard...');
        await page.goto('https://www.scoopify.club/admin/dashboard');
        await page.waitForTimeout(3000);
        
        console.log('11. Final URL:', page.url());
        
        // Check if we're on admin dashboard or redirected
        if (page.url().includes('/admin/dashboard')) {
            console.log('✅ Successfully reached admin dashboard!');
        } else if (page.url().includes('/login')) {
            console.log('❌ Redirected back to login - authentication failed');
        } else {
            console.log('⚠️  Redirected to unexpected page:', page.url());
        }
        
        // Keep browser open for manual inspection
        console.log('\n12. Browser will stay open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        await browser.close();
    }
}

debugAuthFlow().catch(console.error); 