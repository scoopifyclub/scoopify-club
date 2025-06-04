const { chromium } = require('playwright');

async function testAllDashboards() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🚀 Starting comprehensive dashboard tests...\n');
    
    try {
        // Test login page first
        await testLoginPage(page);
        
        // Test admin dashboard
        await testAdminDashboard(page);
        
        // Test customer dashboard  
        await testCustomerDashboard(page);
        
        // Test employee dashboard
        await testEmployeeDashboard(page);
        
        console.log('\n✅ All dashboard tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Dashboard tests failed:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

async function testLoginPage(page) {
    console.log('🔍 Testing login page...');
    
    try {
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Check if login form exists
        const loginForm = await page.locator('form').first();
        if (!(await loginForm.isVisible())) {
            throw new Error('Login form not found');
        }
        
        // Check for email and password fields
        const emailField = await page.locator('input[type="email"], input[name="email"]').first();
        const passwordField = await page.locator('input[type="password"], input[name="password"]').first();
        
        if (!(await emailField.isVisible()) || !(await passwordField.isVisible())) {
            throw new Error('Email or password fields not found');
        }
        
        console.log('✅ Login page structure is correct');
        
    } catch (error) {
        console.error('❌ Login page test failed:', error.message);
        throw error;
    }
}

async function testAdminDashboard(page) {
    console.log('\n🔍 Testing admin dashboard...');
    
    try {
        // Try to access admin dashboard directly
        await page.goto('http://localhost:3000/admin/dashboard');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Check if redirected to login
        if (page.url().includes('/login')) {
            console.log('📋 Admin dashboard requires authentication (expected)');
            
            // Try admin login
            await page.fill('input[type="email"], input[name="email"]', 'admin@scoopify.club');
            await page.fill('input[type="password"], input[name="password"]', 'admin123');
            await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
            
            await page.waitForLoadState('networkidle', { timeout: 10000 });
            
            // Check if login was successful
            if (page.url().includes('/admin')) {
                console.log('✅ Admin login successful');
            } else {
                console.log('⚠️  Admin login may have failed, checking current page');
            }
        }
        
        // Test admin dashboard components
        const stats = await page.locator('[data-testid="admin-stats"], .stats-card, .grid > .card').count();
        console.log(`📊 Found ${stats} stats cards on admin dashboard`);
        
        // Check for navigation
        const navItems = await page.locator('nav a, .nav-link, .sidebar a').count();
        console.log(`🧭 Found ${navItems} navigation items`);
        
        // Test API endpoints by checking for data loading
        await page.waitForTimeout(3000); // Wait for data to load
        
        const errorMessages = await page.locator('.error, [data-testid="error"], .alert-error').count();
        if (errorMessages > 0) {
            console.log(`⚠️  Found ${errorMessages} error messages on admin dashboard`);
        } else {
            console.log('✅ No error messages found on admin dashboard');
        }
        
        console.log('✅ Admin dashboard test completed');
        
    } catch (error) {
        console.error('❌ Admin dashboard test failed:', error.message);
        await page.screenshot({ path: 'admin-dashboard-error.png' });
        throw error;
    }
}

async function testCustomerDashboard(page) {
    console.log('\n🔍 Testing customer dashboard...');
    
    try {
        // Go to login page
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Try customer login
        await page.fill('input[type="email"], input[name="email"]', 'demo@example.com');
        await page.fill('input[type="password"], input[name="password"]', 'demo123');
        await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
        
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Check if redirected to customer dashboard
        if (page.url().includes('/dashboard') || page.url().includes('/customer')) {
            console.log('✅ Customer login successful');
        } else {
            console.log('⚠️  Customer login may have failed or redirected elsewhere');
        }
        
        // Test customer dashboard components
        const serviceCards = await page.locator('.service-card, [data-testid="service"], .card').count();
        console.log(`📋 Found ${serviceCards} cards on customer dashboard`);
        
        // Check for error messages
        const errorMessages = await page.locator('.error, [data-testid="error"], .alert-error').count();
        if (errorMessages > 0) {
            console.log(`⚠️  Found ${errorMessages} error messages on customer dashboard`);
        } else {
            console.log('✅ No error messages found on customer dashboard');
        }
        
        console.log('✅ Customer dashboard test completed');
        
    } catch (error) {
        console.error('❌ Customer dashboard test failed:', error.message);
        await page.screenshot({ path: 'customer-dashboard-error.png' });
        throw error;
    }
}

async function testEmployeeDashboard(page) {
    console.log('\n🔍 Testing employee dashboard...');
    
    try {
        // Go to login page
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Try employee login
        await page.fill('input[type="email"], input[name="email"]', 'employee@scoopify.club');
        await page.fill('input[type="password"], input[name="password"]', 'employee123');
        await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
        
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Check if redirected to employee dashboard
        if (page.url().includes('/employee')) {
            console.log('✅ Employee login successful');
        } else {
            console.log('⚠️  Employee login may have failed or redirected elsewhere');
        }
        
        // Test employee dashboard components
        const dashboardCards = await page.locator('.card, [data-testid="stat"], .stats-card').count();
        console.log(`📊 Found ${dashboardCards} cards on employee dashboard`);
        
        // Check for error messages
        const errorMessages = await page.locator('.error, [data-testid="error"], .alert-error').count();
        if (errorMessages > 0) {
            console.log(`⚠️  Found ${errorMessages} error messages on employee dashboard`);
        } else {
            console.log('✅ No error messages found on employee dashboard');
        }
        
        console.log('✅ Employee dashboard test completed');
        
    } catch (error) {
        console.error('❌ Employee dashboard test failed:', error.message);
        await page.screenshot({ path: 'employee-dashboard-error.png' });
        throw error;
    }
}

async function testAPIEndpoints(page) {
    console.log('\n🔍 Testing API endpoints...');
    
    const endpoints = [
        '/api/admin/dashboard',
        '/api/customer/profile', 
        '/api/employee/dashboard',
        '/api/auth/session'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await page.goto(`http://localhost:3000${endpoint}`);
            const status = response.status();
            
            if (status === 200) {
                console.log(`✅ ${endpoint} - OK (${status})`);
            } else if (status === 401) {
                console.log(`🔒 ${endpoint} - Unauthorized (${status}) - Expected for protected endpoints`);
            } else {
                console.log(`⚠️  ${endpoint} - Status ${status}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint} - Error: ${error.message}`);
        }
    }
}

// Run the tests
testAllDashboards().catch(console.error); 