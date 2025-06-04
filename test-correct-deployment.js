const { chromium } = require('playwright');

async function testCorrectDeployment() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const baseUrl = 'https://scoopify-club-git-main-scoopifys-projects.vercel.app';
    console.log(`🚀 Testing CORRECT Deployment: ${baseUrl}\n`);
    
    const issues = [];
    
    try {
        // Test all three user types on the correct deployment
        await testUserLogin(page, issues, 'admin@scoopify.club', 'admin123', 'ADMIN', '/admin/dashboard', baseUrl);
        await testUserLogin(page, issues, 'demo@example.com', 'demo123', 'CUSTOMER', '/dashboard', baseUrl);
        await testUserLogin(page, issues, 'employee@scoopify.club', 'employee123', 'EMPLOYEE', '/employee/dashboard', baseUrl);
        
        // Summary
        console.log('\n📋 CORRECT DEPLOYMENT TEST SUMMARY');
        console.log('==================================');
        
        if (issues.length === 0) {
            console.log('✅ ALL AUTHENTICATION FLOWS WORKING! 🎉');
            console.log('✅ App is ready for launch on the correct deployment!');
        } else {
            console.log(`❌ Found ${issues.length} issues on correct deployment:\n`);
            issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.type}: ${issue.description}`);
            });
        }
        
    } catch (error) {
        console.error('\n❌ Testing failed:', error);
    } finally {
        await browser.close();
        return issues;
    }
}

async function testUserLogin(page, issues, email, password, expectedRole, expectedDashboard, baseUrl) {
    console.log(`\n🔐 Testing ${expectedRole} login: ${email}`);
    
    try {
        // Go to login page
        await page.goto(`${baseUrl}/login`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Check if login form exists
        const forms = await page.locator('form').count();
        if (forms === 0) {
            issues.push({
                type: 'UI_ERROR',
                description: `${expectedRole} - No login form found on page`
            });
            return;
        }
        
        console.log(`  ✅ Login form found`);
        
        // Fill credentials and submit
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        
        const submitButton = await page.locator('button[type="submit"]').first();
        await submitButton.click();
        console.log(`  📤 Login submitted`);
        
        // Wait for navigation or error
        await page.waitForTimeout(5000);
        
        const currentUrl = page.url();
        console.log(`  📍 Current URL after login: ${currentUrl}`);
        
        // Check if we successfully redirected to dashboard
        if (currentUrl.includes(expectedDashboard)) {
            console.log(`  ✅ ${expectedRole} dashboard access successful!`);
            
            // Wait for content to load
            await page.waitForTimeout(2000);
            
            // Check for dashboard content
            const hasContent = await page.locator('h1, h2, .dashboard, nav').count() > 0;
            if (hasContent) {
                console.log(`  ✅ ${expectedRole} dashboard content loaded`);
            } else {
                issues.push({
                    type: 'CONTENT_ERROR',
                    description: `${expectedRole} dashboard appears empty`
                });
            }
            
            // Check for errors
            const errorElements = await page.locator('.error, [role="alert"]').count();
            if (errorElements > 0) {
                const errorText = await page.locator('.error, [role="alert"]').first().textContent();
                issues.push({
                    type: 'DASHBOARD_ERROR',
                    description: `${expectedRole} dashboard shows error: ${errorText}`
                });
            }
            
        } else if (currentUrl.includes('/login')) {
            // Still on login page, check for error
            const errorElements = await page.locator('.error, [role="alert"]').count();
            if (errorElements > 0) {
                const errorText = await page.locator('.error, [role="alert"]').first().textContent();
                issues.push({
                    type: 'LOGIN_ERROR',
                    description: `${expectedRole} login failed: ${errorText}`
                });
            } else {
                issues.push({
                    type: 'LOGIN_ERROR',
                    description: `${expectedRole} login did not redirect - no error message shown`
                });
            }
        } else {
            issues.push({
                type: 'REDIRECT_ERROR',
                description: `${expectedRole} redirected to unexpected page: ${currentUrl}`
            });
        }
        
    } catch (error) {
        issues.push({
            type: 'TEST_ERROR',
            description: `${expectedRole} test failed: ${error.message}`
        });
    }
}

testCorrectDeployment().catch(console.error); 