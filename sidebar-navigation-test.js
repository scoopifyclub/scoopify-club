const puppeteer = require('puppeteer');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSidebarNavigation() {
    console.log('🚀 Starting comprehensive sidebar navigation test...');
    
    const browser = await puppeteer.launch({ 
        headless: false, // Keep visible so we can see what's happening
        devtools: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Track test results
    const testResults = {
        passed: 0,
        failed: 0,
        details: []
    };
    
    try {
        console.log('📍 Navigating to employee dashboard...');
        await page.goto('https://www.scoopify.club/employee/dashboard', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        console.log('⏳ Waiting for dashboard to load...');
        await sleep(3000);
        
        // Define all sidebar navigation items to test
        const sidebarNavItems = [
            { text: 'Overview', expectedUrl: '/employee/dashboard' },
            { text: 'Schedule', expectedUrl: '/employee/dashboard/schedule' },
            { text: 'Services', expectedUrl: '/employee/dashboard/services' },
            { text: 'Maps', expectedUrl: '/employee/dashboard/maps' },
            { text: 'Customers', expectedUrl: '/employee/dashboard/customers' },
            { text: 'Messages', expectedUrl: '/employee/dashboard/messages' },
            { text: 'Notifications', expectedUrl: '/employee/dashboard/notifications' },
            { text: 'Earnings', expectedUrl: '/employee/dashboard/earnings' },
            { text: 'Reports', expectedUrl: '/employee/dashboard/reports' },
            { text: 'Settings', expectedUrl: '/employee/dashboard/settings' }
        ];
        
        console.log(`\n📋 Testing ${sidebarNavItems.length} sidebar navigation items...\n`);
        
        for (let i = 0; i < sidebarNavItems.length; i++) {
            const navItem = sidebarNavItems[i];
            console.log(`🧪 Test ${i + 1}/${sidebarNavItems.length}: ${navItem.text} Page`);
            
            try {
                // Find and click the navigation link
                const linkSelector = `aside nav a:has-text("${navItem.text}")`;
                await page.click(linkSelector);
                console.log(`   🔗 Clicked "${navItem.text}" link`);
                
                // Wait for navigation
                await sleep(3000);
                
                // Check current URL
                const currentUrl = page.url();
                console.log(`   📍 Current URL: ${currentUrl}`);
                
                // Verify URL contains expected path
                if (currentUrl.includes(navItem.expectedUrl)) {
                    console.log(`   ✅ URL correct: Contains "${navItem.expectedUrl}"`);
                } else {
                    console.log(`   ⚠️ URL unexpected: Expected "${navItem.expectedUrl}"`);
                }
                
                // Check page content
                const bodyContent = await page.evaluate(() => document.body.textContent);
                
                // Test for common error indicators
                if (bodyContent.includes('404') || bodyContent.includes('Not Found')) {
                    console.log(`   ❌ 404 Error - Page not found`);
                    testResults.failed++;
                    testResults.details.push(`${navItem.text}: 404 Error`);
                } else if (bodyContent.includes('500') || bodyContent.includes('Internal Server Error')) {
                    console.log(`   ❌ 500 Error - Server error`);
                    testResults.failed++;
                    testResults.details.push(`${navItem.text}: 500 Error`);
                } else if (bodyContent.includes('Application error')) {
                    console.log(`   ❌ Application Error - Client-side crash`);
                    testResults.failed++;
                    testResults.details.push(`${navItem.text}: Application Error`);
                } else if (bodyContent.includes('Loading...') && bodyContent.length < 500) {
                    console.log(`   ⚠️ Still loading or minimal content`);
                    testResults.details.push(`${navItem.text}: Loading state`);
                } else {
                    console.log(`   ✅ Page loaded successfully`);
                    testResults.passed++;
                    testResults.details.push(`${navItem.text}: ✅ Working`);
                }
                
                // Check for specific page content
                if (navItem.text === 'Maps' && bodyContent.includes('map')) {
                    console.log(`   🗺️ Maps content detected`);
                } else if (navItem.text === 'Messages' && bodyContent.includes('message')) {
                    console.log(`   💬 Messages content detected`);
                } else if (navItem.text === 'Notifications' && bodyContent.includes('notification')) {
                    console.log(`   🔔 Notifications content detected`);
                } else if (navItem.text === 'Earnings' && bodyContent.includes('earning')) {
                    console.log(`   💰 Earnings content detected`);
                } else if (navItem.text === 'Reports' && bodyContent.includes('report')) {
                    console.log(`   📊 Reports content detected`);
                } else if (navItem.text === 'Settings' && bodyContent.includes('setting')) {
                    console.log(`   ⚚ Settings content detected`);
                }
                
                console.log(''); // Add spacing between tests
                
            } catch (error) {
                console.log(`   ❌ Test failed: ${error.message}`);
                testResults.failed++;
                testResults.details.push(`${navItem.text}: ❌ ${error.message}`);
                console.log(''); // Add spacing
            }
        }
        
        // Test mobile menu toggle
        console.log('📱 Testing mobile navigation...');
        try {
            await page.setViewport({ width: 375, height: 667 });
            await page.reload();
            await sleep(2000);
            
            // Look for mobile menu button
            const mobileMenuButton = await page.$('button[class*="lg:hidden"]');
            if (mobileMenuButton) {
                console.log('✅ Mobile menu button found');
                await mobileMenuButton.click();
                await sleep(1000);
                console.log('✅ Mobile menu toggled');
            } else {
                console.log('⚠️ Mobile menu button not found');
            }
            
            // Reset to desktop viewport
            await page.setViewport({ width: 1280, height: 720 });
        } catch (error) {
            console.log(`❌ Mobile test failed: ${error.message}`);
        }
        
        // Final summary
        console.log('\n📋 SIDEBAR NAVIGATION TEST RESULTS:');
        console.log('=====================================');
        console.log(`✅ Passed: ${testResults.passed}`);
        console.log(`❌ Failed: ${testResults.failed}`);
        console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
        console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
        
        console.log('\n📝 Detailed Results:');
        testResults.details.forEach(detail => {
            console.log(`   ${detail}`);
        });
        
        if (testResults.failed === 0) {
            console.log('\n🎉 ALL NAVIGATION TESTS PASSED!');
            console.log('🚀 Every sidebar page is working correctly!');
        } else {
            console.log('\n⚠️ Some navigation issues found');
            console.log('🔧 Check the failed pages above for specific issues');
        }
        
        console.log('\n🏁 Navigation testing complete!');
        
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    } finally {
        // Keep browser open for 5 seconds so you can see the final state
        console.log('\nKeeping browser open for 5 seconds...');
        await sleep(5000);
        await browser.close();
    }
}

testSidebarNavigation().catch(console.error); 