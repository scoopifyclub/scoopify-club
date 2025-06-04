const { chromium } = require('playwright');

async function debugLoginPage() {
    const browser = await chromium.launch({ headless: false }); // Non-headless for debugging
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        console.log('🔍 Debugging login page...');
        
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        console.log('📍 Current URL:', page.url());
        
        // Take a screenshot
        await page.screenshot({ path: 'login-page-debug.png' });
        console.log('📸 Screenshot saved as login-page-debug.png');
        
        // Get page content
        const title = await page.title();
        console.log('📄 Page title:', title);
        
        // Check what forms exist
        const forms = await page.locator('form').count();
        console.log('📝 Number of forms found:', forms);
        
        // Check for any inputs
        const inputs = await page.locator('input').count();
        console.log('🔤 Number of inputs found:', inputs);
        
        // Get all input types
        const inputElements = await page.locator('input').all();
        for (let i = 0; i < inputElements.length; i++) {
            const type = await inputElements[i].getAttribute('type');
            const name = await inputElements[i].getAttribute('name');
            const placeholder = await inputElements[i].getAttribute('placeholder');
            console.log(`  Input ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}"`);
        }
        
        // Check for buttons
        const buttons = await page.locator('button').count();
        console.log('🔘 Number of buttons found:', buttons);
        
        // Get button text
        const buttonElements = await page.locator('button').all();
        for (let i = 0; i < buttonElements.length; i++) {
            const text = await buttonElements[i].textContent();
            const type = await buttonElements[i].getAttribute('type');
            console.log(`  Button ${i + 1}: "${text}", type="${type}"`);
        }
        
        // Check if it's redirecting somewhere
        if (!page.url().includes('/login')) {
            console.log('⚠️ Page redirected away from /login');
        }
        
        // Check for error messages or loading states
        const errorMsg = await page.locator('.error, .alert-error, [data-testid="error"]').first().textContent().catch(() => null);
        if (errorMsg) {
            console.log('❌ Error message found:', errorMsg);
        }
        
        // Check if page is still loading
        const loadingElements = await page.locator('.loading, .spinner, [data-testid="loading"]').count();
        console.log('⏳ Loading elements found:', loadingElements);
        
        // Wait a bit more and check again
        await page.waitForTimeout(3000);
        console.log('\n--- After 3 second wait ---');
        console.log('📍 Current URL:', page.url());
        
        const formsAfterWait = await page.locator('form').count();
        console.log('📝 Number of forms found after wait:', formsAfterWait);
        
        // Check the page HTML structure
        const bodyHTML = await page.locator('body').innerHTML();
        console.log('📄 Page contains login-related text:', bodyHTML.toLowerCase().includes('login') || bodyHTML.toLowerCase().includes('sign in'));
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        // Keep browser open for manual inspection
        console.log('🔍 Browser kept open for manual inspection. Close manually when done.');
        // await browser.close();
    }
}

debugLoginPage().catch(console.error); 