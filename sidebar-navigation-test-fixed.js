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
        
        // Define all sidebar navigation items to test with their href patterns
        const sidebarNavItems = [
            { text: 'Overview', href: '/employee/dashboard', urlPattern: '/employee/dashboard' },
            { text: 'Schedule', href: '/employee/dashboard/schedule', urlPattern: '/employee/dashboard/schedule' },
            { text: 'Services', href: '/employee/dashboard/services', urlPattern: '/employee/dashboard/services' },
            { text: 'Maps', href: '/employee/dashboard/maps', urlPattern: '/employee/dashboard/maps' },
            { text: 'Customers', href: '/employee/dashboard/customers', urlPattern: '/employee/dashboard/customers' },
            { text: 'Messages', href: '/employee/dashboard/messages', urlPattern: '/employee/dashboard/messages' },
            { text: 'Notifications', href: '/employee/dashboard/notifications', urlPattern: '/employee/dashboard/notifications' },
            { text: 'Earnings', href: '/employee/dashboard/earnings', urlPattern: '/employee/dashboard/earnings' },
            { text: 'Reports', href: '/employee/dashboard/reports', urlPattern: '/employee/dashboard/reports' },
            { text: 'Settings', href: '/employee/dashboard/settings', urlPattern: '/employee/dashboard/settings' }
        ];
        
        console.log(`\n📋 Testing ${sidebarNavItems.length} sidebar navigation items...\n`);
        
        for (let i = 0; i < sidebarNavItems.length; i++) {
            const navItem = sidebarNavItems[i];
            console.log(`🧪 Test ${i + 1}/${sidebarNavItems.length}: ${navItem.text} Page`);
            
            try {
                // Find link by href attribute
                const linkFound = await page.evaluate((href) => {
                    const links = Array.from(document.querySelectorAll('aside a'));
                    const targetLink = links.find(link => link.href.includes(href));
                    if (targetLink) {
                        targetLink.click();
                        return true;
                    }
                    return false;
                }, navItem.href);
                
                if (!linkFound) {
                    // Alternative: Find by text content
                    const textLinkFound = await page.evaluate((text) => {
                        const links = Array.from(document.querySelectorAll('aside a'));
                        const targetLink = links.find(link => link.textContent.trim().includes(text));
                        if (targetLink) {
                            targetLink.click();
                            return true;
                        }
                        return false;
                    }, navItem.text);
                    
                    if (!textLinkFound) {
                        console.log(`   ❌ Link not found for "${navItem.text}"`);
                        testResults.failed++;
                        testResults.details.push(`${navItem.text}: ❌ Link not found`);
                        continue;
                    }
                }
                
                console.log(`   🔗 Clicked "${navItem.text}" link`);
                
                // Wait for navigation
                await sleep(3000);
                
                // Check current URL
                const currentUrl = page.url();
                console.log(`   📍 Current URL: ${currentUrl}`);
                
                // Verify URL contains expected path
                if (currentUrl.includes(navItem.urlPattern)) {
                    console.log(`   ✅ URL correct: Contains "${navItem.urlPattern}"`);
                } else {
                    console.log(`   ⚠️ URL unexpected: Expected "${navItem.urlPattern}"`);
                }
                
                // Check page content
                const bodyContent = await page.evaluate(() => document.body.textContent);
                
                // Test for common error indicators
                if (bodyContent.includes('404') || bodyContent.includes('Not Found')) {
                    console.log(`   ❌ 404 Error - Page not found`);
                    testResults.failed++;
                    testResults.details.push(`${navItem.text}: ❌ 404 Error`);
                } else if (bodyContent.includes('500') || bodyContent.includes('Internal Server Error')) {
                    console.log(`   ❌ 500 Error - Server error`);
                    testResults.failed++;
                    testResults.details.push(`${navItem.text}: ❌ 500 Error`);
                } else if (bodyContent.includes('Application error')) {
                    console.log(`   ❌ Application Error - Client-side crash`);
                    testResults.failed++;
                    testResults.details.push(`${navItem.text}: ❌ Application Error`);
                } else if (bodyContent.includes('Loading...') && bodyContent.length < 500) {
                    console.log(`   ⚠️ Still loading or minimal content`);
                    testResults.details.push(`${navItem.text}: ⚠️ Loading state`);
                } else {
                    console.log(`   ✅ Page loaded successfully`);
                    testResults.passed++;
                    testResults.details.push(`${navItem.text}: ✅ Working`);
                }
                
                // Check for specific page content indicators
                const lowerContent = bodyContent.toLowerCase();
                if (navItem.text === 'Maps' && (lowerContent.includes('map') || lowerContent.includes('location'))) {
                    console.log(`   🗺️ Maps content detected`);
                } else if (navItem.text === 'Messages' && (lowerContent.includes('message') || lowerContent.includes('chat'))) {
                    console.log(`   💬 Messages content detected`);
                } else if (navItem.text === 'Notifications' && (lowerContent.includes('notification') || lowerContent.includes('alert'))) {
                    console.log(`   🔔 Notifications content detected`);
                } else if (navItem.text === 'Earnings' && (lowerContent.includes('earning') || lowerContent.includes('payment') || lowerContent.includes('income'))) {
                    console.log(`   💰 Earnings content detected`);
                } else if (navItem.text === 'Reports' && (lowerContent.includes('report') || lowerContent.includes('analytics'))) {
                    console.log(`   📊 Reports content detected`);
                } else if (navItem.text === 'Settings' && (lowerContent.includes('setting') || lowerContent.includes('preference'))) {
                    console.log(`   ⚙️ Settings content detected`);
                } else if (navItem.text === 'Schedule' && (lowerContent.includes('schedule') || lowerContent.includes('calendar'))) {
                    console.log(`   📅 Schedule content detected`);
                } else if (navItem.text === 'Services' && (lowerContent.includes('service') || lowerContent.includes('job'))) {
                    console.log(`   🔧 Services content detected`);
                } else if (navItem.text === 'Customers' && (lowerContent.includes('customer') || lowerContent.includes('client'))) {
                    console.log(`   👥 Customers content detected`);
                }
                
                console.log(''); // Add spacing between tests
                
            } catch (error) {
                console.log(`   ❌ Test failed: ${error.message}`);
                testResults.failed++;
                testResults.details.push(`${navItem.text}: ❌ ${error.message}`);
                console.log(''); // Add spacing
            }
        }
        
        // Test Quick Actions buttons
        console.log('⚡ Testing Quick Actions buttons...');
        try {
            // Go back to main dashboard
            await page.goto('https://www.scoopify.club/employee/dashboard');
            await sleep(2000);
            
            const quickActionButtons = await page.$$('button');
            console.log(`✅ Found ${quickActionButtons.length} total buttons on dashboard`);
            
            // Test "View Schedule" button
            const scheduleButtonClicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const scheduleButton = buttons.find(btn => btn.textContent.includes('View Schedule'));
                if (scheduleButton) {
                    scheduleButton.click();
                    return true;
                }
                return false;
            });
            
            if (scheduleButtonClicked) {
                console.log('✅ View Schedule button clicked');
                await sleep(2000);
                const url = page.url();
                if (url.includes('schedule')) {
                    console.log('✅ Navigated to schedule page');
                } else {
                    console.log('⚠️ Schedule navigation may have failed');
                }
            } else {
                console.log('⚠️ View Schedule button not found');
            }
            
        } catch (error) {
            console.log(`❌ Quick Actions test failed: ${error.message}`);
        }
        
        // Final summary
        console.log('\n📋 SIDEBAR NAVIGATION TEST RESULTS:');
        console.log('=====================================');
        console.log(`✅ Passed: ${testResults.passed}`);
        console.log(`❌ Failed: ${testResults.failed}`);
        console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
        
        if (testResults.passed + testResults.failed > 0) {
            console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
        }
        
        console.log('\n📝 Detailed Results:');
        testResults.details.forEach(detail => {
            console.log(`   ${detail}`);
        });
        
        if (testResults.failed === 0) {
            console.log('\n🎉 ALL NAVIGATION TESTS PASSED!');
            console.log('🚀 Every sidebar page is working correctly!');
        } else if (testResults.passed > testResults.failed) {
            console.log('\n✅ Most navigation tests passed!');
            console.log('🔧 Some minor issues found - check details above');
        } else {
            console.log('\n⚠️ Several navigation issues found');
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