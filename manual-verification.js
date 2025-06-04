const { chromium } = require('playwright');

async function manualVerification() {
    const browser = await chromium.launch({ headless: false, slowMo: 1000 }); // Visible and slow for manual verification
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const baseUrl = 'https://scoopify-club-git-main-scoopifys-projects.vercel.app';
    console.log(`🔍 Manual Verification - Opening ${baseUrl}/login`);
    console.log('👀 Browser will open for manual testing...\n');
    
    try {
        // Go to login page
        await page.goto(`${baseUrl}/login`);
        await page.waitForLoadState('networkidle');
        
        console.log('✅ Login page loaded');
        console.log('📋 You can now manually test the following:');
        console.log('   1. Admin: admin@scoopify.club / admin123');
        console.log('   2. Customer: demo@example.com / demo123');
        console.log('   3. Employee: employee@scoopify.club / employee123');
        console.log('\n🕐 Browser will stay open for 2 minutes for manual testing...');
        
        // Also test the API directly
        console.log('\n🧪 Testing API directly on correct deployment...');
        
        const response = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@scoopify.club',
                password: 'admin123'
            })
        });
        
        console.log(`📊 API Response Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ API Login successful!`);
            console.log(`🔄 Redirect URL: ${data.redirectTo}`);
            console.log(`👤 User Role: ${data.user?.role}`);
        } else {
            const errorData = await response.json();
            console.log(`❌ API Login failed: ${errorData.error}`);
        }
        
        // Keep browser open for manual testing
        await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await browser.close();
    }
}

manualVerification().catch(console.error); 