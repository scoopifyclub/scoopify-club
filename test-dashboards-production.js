const { chromium } = require('playwright');

async function testAllDashboards() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🚀 Starting comprehensive dashboard tests (Production vs Local)...\n');
    
    try {
        // First test production site
        console.log('🌐 Testing PRODUCTION site (https://www.scoopify.club)...');
        await testProductionSite(page);
        
        console.log('\n🏠 Testing LOCAL development (http://localhost:3000)...');
        await testLocalSite(page);
        
        console.log('\n✅ All dashboard tests completed!');
        
    } catch (error) {
        console.error('\n❌ Dashboard tests failed:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

async function testProductionSite(page) {
    try {
        console.log('🔍 Testing production login page...');
        
        await page.goto('https://www.scoopify.club/login');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        console.log('📍 Current URL:', page.url());
        
        // Check if proper login form exists
        const forms = await page.locator('form').count();
        const inputs = await page.locator('input').count();
        const emailInputs = await page.locator('input[type="email"], input[name="email"]').count();
        const passwordInputs = await page.locator('input[type="password"], input[name="password"]').count();
        
        console.log(`📝 Forms found: ${forms}`);
        console.log(`🔤 Total inputs: ${inputs}`);
        console.log(`📧 Email inputs: ${emailInputs}`);
        console.log(`🔒 Password inputs: ${passwordInputs}`);
        
        if (forms > 0 && emailInputs > 0 && passwordInputs > 0) {
            console.log('✅ Production login form structure is correct');
            
            // Test login functionality with demo credentials
            try {
                await page.fill('input[type="email"], input[name="email"]', 'admin@scoopify.club');
                await page.fill('input[type="password"], input[name="password"]', 'admin123');
                
                // Look for submit button
                const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Sign in")').first();
                if (await submitButton.isVisible()) {
                    console.log('🔘 Submit button found - form is interactive');
                    
                    // Note: Not actually submitting to avoid affecting production
                    console.log('⚠️  Skipping actual login submission on production');
                } else {
                    console.log('❌ Submit button not found');
                }
            } catch (error) {
                console.log('⚠️  Error testing form interaction:', error.message);
            }
        } else {
            console.log('❌ Production login form structure is incomplete');
        }
        
        // Test if admin dashboard is accessible
        await page.goto('https://www.scoopify.club/admin/dashboard');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        if (page.url().includes('/login')) {
            console.log('🔒 Admin dashboard properly redirects to login (good security)');
        } else {
            console.log('⚠️  Admin dashboard accessible without authentication');
        }
        
    } catch (error) {
        console.error('❌ Production site test failed:', error.message);
        await page.screenshot({ path: 'production-error.png' });
    }
}

async function testLocalSite(page) {
    try {
        console.log('🔍 Testing local development login page...');
        
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        console.log('📍 Current URL:', page.url());
        
        // Check if proper login form exists
        const forms = await page.locator('form').count();
        const inputs = await page.locator('input').count();
        const emailInputs = await page.locator('input[type="email"], input[name="email"]').count();
        const passwordInputs = await page.locator('input[type="password"], input[name="password"]').count();
        
        console.log(`📝 Forms found: ${forms}`);
        console.log(`🔤 Total inputs: ${inputs}`);
        console.log(`📧 Email inputs: ${emailInputs}`);
        console.log(`🔒 Password inputs: ${passwordInputs}`);
        
        if (forms === 0 || inputs === 0) {
            console.log('❌ Local development login form is missing!');
            console.log('🔍 Investigating page content...');
            
            // Check what's actually on the page
            const pageTitle = await page.title();
            const bodyText = await page.locator('body').textContent();
            
            console.log(`📄 Page title: "${pageTitle}"`);
            console.log(`📄 Body contains "login": ${bodyText.toLowerCase().includes('login')}`);
            console.log(`📄 Body contains "sign in": ${bodyText.toLowerCase().includes('sign in')}`);
            
            // Check for React/Next.js errors
            const errors = await page.locator('.error, .nextjs-error, [data-testid="error"]').count();
            if (errors > 0) {
                console.log(`⚠️  Found ${errors} error elements on page`);
            }
            
            // Check console for JavaScript errors
            const logs = [];
            page.on('console', msg => logs.push(msg.text()));
            await page.waitForTimeout(2000);
            
            const errorLogs = logs.filter(log => log.includes('error') || log.includes('Error'));
            if (errorLogs.length > 0) {
                console.log('🐛 JavaScript errors found:');
                errorLogs.forEach(log => console.log(`   ${log}`));
            }
            
        } else if (forms > 0 && emailInputs > 0 && passwordInputs > 0) {
            console.log('✅ Local development login form structure is correct');
            
            // Test login with demo credentials
            await testLocalLogin(page);
        } else {
            console.log('⚠️  Local development login form structure is incomplete');
        }
        
    } catch (error) {
        console.error('❌ Local site test failed:', error.message);
        await page.screenshot({ path: 'local-error.png' });
    }
}

async function testLocalLogin(page) {
    try {
        console.log('🔑 Testing local login functionality...');
        
        // Test admin login
        await page.fill('input[type="email"], input[name="email"]', 'admin@scoopify.club');
        await page.fill('input[type="password"], input[name="password"]', 'admin123');
        
        const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
        await submitButton.click();
        
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        if (page.url().includes('/admin')) {
            console.log('✅ Admin login successful - redirected to admin dashboard');
            await testAdminDashboard(page);
        } else {
            console.log(`⚠️  Login may have failed - current URL: ${page.url()}`);
        }
        
    } catch (error) {
        console.error('❌ Local login test failed:', error.message);
    }
}

async function testAdminDashboard(page) {
    try {
        console.log('📊 Testing admin dashboard functionality...');
        
        // Wait for dashboard to load
        await page.waitForTimeout(3000);
        
        // Check for dashboard elements
        const cards = await page.locator('.card, [data-testid="stat"], .stats-card').count();
        const navLinks = await page.locator('nav a, .nav-link, .sidebar a').count();
        const errors = await page.locator('.error, [data-testid="error"], .alert-error').count();
        
        console.log(`📋 Dashboard cards found: ${cards}`);
        console.log(`🧭 Navigation links found: ${navLinks}`);
        console.log(`❌ Error messages found: ${errors}`);
        
        if (cards > 0 && errors === 0) {
            console.log('✅ Admin dashboard is working properly');
        } else {
            console.log('⚠️  Admin dashboard may have issues');
        }
        
        // Test API endpoints
        await testAPIResponseTimes(page);
        
    } catch (error) {
        console.error('❌ Admin dashboard test failed:', error.message);
    }
}

async function testAPIResponseTimes(page) {
    console.log('🚀 Testing API response times...');
    
    const apiEndpoints = [
        '/api/admin/dashboard',
        '/api/admin/stats',
        '/api/auth/session'
    ];
    
    for (const endpoint of apiEndpoints) {
        try {
            const startTime = Date.now();
            const response = await page.goto(`http://localhost:3000${endpoint}`);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            console.log(`⚡ ${endpoint}: ${response.status()} (${responseTime}ms)`);
            
            if (response.status() === 200) {
                const data = await response.json();
                console.log(`   ✅ Response has data: ${Object.keys(data).length} fields`);
            }
        } catch (error) {
            console.log(`   ❌ ${endpoint}: Error - ${error.message}`);
        }
    }
}

// Run the tests
testAllDashboards().catch(console.error); 