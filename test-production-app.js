const { chromium } = require('playwright');

async function testProductionApp() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🚀 Testing Production ScoopifyClub App (https://www.scoopify.club)\n');
    
    const issues = [];
    
    try {
        // Test all main user flows
        await testPublicPages(page, issues);
        await testAuthenticationFlow(page, issues);
        await testAdminDashboard(page, issues);
        await testCustomerDashboard(page, issues);
        await testEmployeeDashboard(page, issues);
        await testAPIEndpoints(page, issues);
        
        // Summary
        console.log('\n📋 TESTING SUMMARY');
        console.log('==================');
        
        if (issues.length === 0) {
            console.log('✅ No issues found! App is ready for launch.');
        } else {
            console.log(`❌ Found ${issues.length} issues that need fixing:\n`);
            issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.type}: ${issue.description}`);
                if (issue.fix) {
                    console.log(`   💡 Fix: ${issue.fix}`);
                }
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('\n❌ Testing failed:', error);
        issues.push({
            type: 'CRITICAL_ERROR',
            description: `Testing script failed: ${error.message}`,
            fix: 'Debug test script and ensure production site is accessible'
        });
    } finally {
        await browser.close();
        
        // Return issues for programmatic use
        return issues;
    }
}

async function testPublicPages(page, issues) {
    console.log('🌐 Testing Public Pages...');
    
    try {
        // Test homepage
        await page.goto('https://www.scoopify.club/');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        const homeTitle = await page.title();
        if (!homeTitle || homeTitle.trim() === '') {
            issues.push({
                type: 'SEO_ISSUE',
                description: 'Homepage has no title tag',
                fix: 'Add proper <title> tag to homepage'
            });
        } else {
            console.log(`✅ Homepage title: "${homeTitle}"`);
        }
        
        // Check for main navigation
        const navLinks = await page.locator('nav a, .nav-link').count();
        if (navLinks < 3) {
            issues.push({
                type: 'UI_ISSUE',
                description: 'Navigation appears incomplete or missing',
                fix: 'Ensure main navigation with Home, Services, Pricing, About links'
            });
        } else {
            console.log(`✅ Navigation has ${navLinks} links`);
        }
        
        // Test signup flow
        const signupButton = await page.locator('button:has-text("Join the Club"), a:has-text("Join the Club")').first();
        if (!(await signupButton.isVisible())) {
            issues.push({
                type: 'UI_ISSUE',
                description: 'Join the Club button not found on homepage',
                fix: 'Ensure signup CTA is prominently displayed'
            });
        } else {
            console.log('✅ Join the Club button found');
        }
        
    } catch (error) {
        issues.push({
            type: 'PAGE_ERROR',
            description: `Homepage failed to load: ${error.message}`,
            fix: 'Debug homepage rendering and ensure all components load properly'
        });
    }
}

async function testAuthenticationFlow(page, issues) {
    console.log('\n🔐 Testing Authentication Flow...');
    
    try {
        // Test login page
        await page.goto('https://www.scoopify.club/login');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        const forms = await page.locator('form').count();
        const emailInputs = await page.locator('input[type="email"]').count();
        const passwordInputs = await page.locator('input[type="password"]').count();
        const submitButtons = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Sign In")').count();
        
        if (forms === 0) {
            issues.push({
                type: 'AUTH_ERROR',
                description: 'Login form not found on login page',
                fix: 'Ensure login form renders properly with email/password fields'
            });
        } else if (emailInputs === 0 || passwordInputs === 0) {
            issues.push({
                type: 'AUTH_ERROR',
                description: 'Login form missing email or password field',
                fix: 'Add proper email and password input fields to login form'
            });
        } else if (submitButtons === 0) {
            issues.push({
                type: 'AUTH_ERROR',
                description: 'Login form missing submit button',
                fix: 'Add submit button to login form'
            });
        } else {
            console.log('✅ Login form structure is complete');
            
            // Test login with demo admin account
            await testAdminLogin(page, issues);
        }
        
    } catch (error) {
        issues.push({
            type: 'AUTH_ERROR',
            description: `Login page failed to load: ${error.message}`,
            fix: 'Debug login page routing and component rendering'
        });
    }
}

async function testAdminLogin(page, issues) {
    try {
        console.log('🔑 Testing admin login...');
        
        await page.fill('input[type="email"]', 'admin@scoopify.club');
        await page.fill('input[type="password"]', 'admin123');
        
        const submitButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Sign In")').first();
        await submitButton.click();
        
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        if (page.url().includes('/admin')) {
            console.log('✅ Admin login successful');
            return true;
        } else if (page.url().includes('/login')) {
            // Check for error messages
            const errorMsg = await page.locator('.error, .alert-error, [role="alert"]').textContent().catch(() => null);
            issues.push({
                type: 'AUTH_ERROR',
                description: `Admin login failed: ${errorMsg || 'Unknown error'}`,
                fix: 'Check admin credentials in database and authentication logic'
            });
        } else {
            issues.push({
                type: 'AUTH_ERROR',
                description: `Admin login redirected to unexpected page: ${page.url()}`,
                fix: 'Check admin role-based routing logic'
            });
        }
        
    } catch (error) {
        issues.push({
            type: 'AUTH_ERROR',
            description: `Admin login process failed: ${error.message}`,
            fix: 'Debug admin login flow and error handling'
        });
    }
    
    return false;
}

async function testAdminDashboard(page, issues) {
    console.log('\n📊 Testing Admin Dashboard...');
    
    try {
        // If not already logged in as admin, try login
        if (!page.url().includes('/admin')) {
            await page.goto('https://www.scoopify.club/login');
            await page.waitForLoadState('networkidle');
            
            await page.fill('input[type="email"]', 'admin@scoopify.club');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Sign In")');
            await page.waitForLoadState('networkidle', { timeout: 15000 });
        }
        
        if (page.url().includes('/admin')) {
            // Test dashboard elements
            await page.waitForTimeout(3000); // Wait for data to load
            
            const statsCards = await page.locator('.card, [data-testid="stat"]').count();
            const errorElements = await page.locator('.error, [data-testid="error"]').count();
            const loadingElements = await page.locator('.loading, .spinner').count();
            
            console.log(`📋 Stats cards found: ${statsCards}`);
            console.log(`❌ Error elements: ${errorElements}`);
            console.log(`⏳ Loading elements: ${loadingElements}`);
            
            if (statsCards === 0) {
                issues.push({
                    type: 'DASHBOARD_ERROR',
                    description: 'Admin dashboard has no stats cards',
                    fix: 'Check admin dashboard API endpoints and component rendering'
                });
            }
            
            if (errorElements > 0) {
                const errorText = await page.locator('.error, [data-testid="error"]').first().textContent().catch(() => 'Unknown error');
                issues.push({
                    type: 'DASHBOARD_ERROR',
                    description: `Admin dashboard showing errors: ${errorText}`,
                    fix: 'Debug admin dashboard API calls and error states'
                });
            }
            
            // Test navigation
            const navItems = await page.locator('nav a, .sidebar a').count();
            if (navItems < 5) {
                issues.push({
                    type: 'UI_ISSUE',
                    description: 'Admin dashboard navigation appears incomplete',
                    fix: 'Ensure all admin navigation items are present (Dashboard, Customers, Employees, Services, etc.)'
                });
            } else {
                console.log(`✅ Admin navigation has ${navItems} items`);
            }
            
        } else {
            issues.push({
                type: 'AUTH_ERROR',
                description: 'Could not access admin dashboard after login',
                fix: 'Check admin authentication and role-based routing'
            });
        }
        
    } catch (error) {
        issues.push({
            type: 'DASHBOARD_ERROR',
            description: `Admin dashboard test failed: ${error.message}`,
            fix: 'Debug admin dashboard component and API integration'
        });
    }
}

async function testCustomerDashboard(page, issues) {
    console.log('\n👤 Testing Customer Dashboard...');
    
    try {
        // Login as customer
        await page.goto('https://www.scoopify.club/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[type="email"]', 'demo@example.com');
        await page.fill('input[type="password"]', 'demo123');
        await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Sign In")');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        if (page.url().includes('/dashboard') || page.url().includes('/customer')) {
            console.log('✅ Customer login successful');
            
            await page.waitForTimeout(3000);
            
            const serviceElements = await page.locator('.service, [data-testid="service"]').count();
            const profileElements = await page.locator('.profile, [data-testid="profile"]').count();
            const errorElements = await page.locator('.error').count();
            
            console.log(`📋 Service elements: ${serviceElements}`);
            console.log(`👤 Profile elements: ${profileElements}`);
            console.log(`❌ Errors: ${errorElements}`);
            
            if (errorElements > 0) {
                const errorText = await page.locator('.error').first().textContent().catch(() => 'Unknown error');
                issues.push({
                    type: 'DASHBOARD_ERROR',
                    description: `Customer dashboard showing errors: ${errorText}`,
                    fix: 'Debug customer dashboard API calls and data loading'
                });
            }
            
        } else {
            issues.push({
                type: 'AUTH_ERROR',
                description: 'Customer login failed or redirected incorrectly',
                fix: 'Check customer credentials and role-based routing'
            });
        }
        
    } catch (error) {
        issues.push({
            type: 'DASHBOARD_ERROR',
            description: `Customer dashboard test failed: ${error.message}`,
            fix: 'Debug customer authentication and dashboard rendering'
        });
    }
}

async function testEmployeeDashboard(page, issues) {
    console.log('\n👷 Testing Employee Dashboard...');
    
    try {
        // Login as employee
        await page.goto('https://www.scoopify.club/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[type="email"]', 'employee@scoopify.club');
        await page.fill('input[type="password"]', 'employee123');
        await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Sign In")');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        if (page.url().includes('/employee')) {
            console.log('✅ Employee login successful');
            
            await page.waitForTimeout(3000);
            
            const jobElements = await page.locator('.job, [data-testid="job"]').count();
            const statsElements = await page.locator('.stat, [data-testid="stat"]').count();
            const errorElements = await page.locator('.error').count();
            
            console.log(`💼 Job elements: ${jobElements}`);
            console.log(`📊 Stats elements: ${statsElements}`);
            console.log(`❌ Errors: ${errorElements}`);
            
            if (errorElements > 0) {
                const errorText = await page.locator('.error').first().textContent().catch(() => 'Unknown error');
                issues.push({
                    type: 'DASHBOARD_ERROR',
                    description: `Employee dashboard showing errors: ${errorText}`,
                    fix: 'Debug employee dashboard API calls and component rendering'
                });
            }
            
        } else {
            issues.push({
                type: 'AUTH_ERROR',
                description: 'Employee login failed or redirected incorrectly',
                fix: 'Check employee credentials and role-based routing'
            });
        }
        
    } catch (error) {
        issues.push({
            type: 'DASHBOARD_ERROR',
            description: `Employee dashboard test failed: ${error.message}`,
            fix: 'Debug employee authentication and dashboard rendering'
        });
    }
}

async function testAPIEndpoints(page, issues) {
    console.log('\n🚀 Testing API Endpoints...');
    
    const endpoints = [
        { url: '/api/auth/session', expectedStatus: [200, 401] },
        { url: '/api/admin/dashboard', expectedStatus: [200, 401] },
        { url: '/api/customer/profile', expectedStatus: [200, 401] },
        { url: '/api/employee/dashboard', expectedStatus: [200, 401] },
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await page.goto(`https://www.scoopify.club${endpoint.url}`);
            const status = response.status();
            
            if (endpoint.expectedStatus.includes(status)) {
                console.log(`✅ ${endpoint.url}: ${status}`);
            } else if (status >= 500) {
                issues.push({
                    type: 'API_ERROR',
                    description: `${endpoint.url} returning server error: ${status}`,
                    fix: 'Debug API route handler and check for runtime errors'
                });
            } else {
                console.log(`⚠️  ${endpoint.url}: ${status} (unexpected but not critical)`);
            }
            
        } catch (error) {
            issues.push({
                type: 'API_ERROR',
                description: `${endpoint.url} failed to respond: ${error.message}`,
                fix: 'Check API route exists and handles requests properly'
            });
        }
    }
}

// Run the test and export for use in other scripts
if (require.main === module) {
    testProductionApp().then(issues => {
        if (issues.length > 0) {
            process.exit(1); // Exit with error code if issues found
        }
    }).catch(console.error);
}

module.exports = { testProductionApp }; 