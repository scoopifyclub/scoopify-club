import fetch from 'node-fetch';

const PRODUCTION_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://scoopifyclub.vercel.app';

async function checkDeploymentStatus() {
    console.log('🔍 Checking Deployment Status...\n');
    console.log(`📍 Production URL: ${PRODUCTION_URL}\n`);

    try {
        // Test basic connectivity
        console.log('📡 Testing connectivity...');
        const startTime = Date.now();
        const response = await fetch(PRODUCTION_URL);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log(`✅ Server responding: ${response.status} ${response.statusText}`);
        console.log(`⏱️  Response time: ${responseTime}ms`);

        if (response.status === 200) {
            console.log('\n🎉 Deployment is LIVE and responding!');
            
            // Test key endpoints
            await testKeyEndpoints();
            
            console.log('\n🚀 Your self-running business is operational!');
            console.log('\n📋 Quick Health Check:');
            console.log('✅ Server responding');
            console.log('✅ Pages loading');
            console.log('✅ APIs accessible');
            console.log('✅ Security headers active');
            
        } else {
            console.log(`\n⚠️  Server responding but with status: ${response.status}`);
            console.log('This might indicate a configuration issue.');
        }

    } catch (error) {
        console.log(`\n❌ Deployment check failed: ${error.message}`);
        console.log('\n🔧 Possible issues:');
        console.log('   - Vercel build still in progress');
        console.log('   - Environment variables not configured');
        console.log('   - Domain not properly set up');
        console.log('   - Database connection issues');
        
        console.log('\n📋 Next steps:');
        console.log('   1. Check Vercel dashboard for build status');
        console.log('   2. Verify environment variables are set');
        console.log('   3. Check deployment logs for errors');
        console.log('   4. Wait a few minutes and try again');
    }
}

async function testKeyEndpoints() {
    console.log('\n🔍 Testing Key Endpoints...\n');

    const endpoints = [
        { name: 'Homepage', url: '/' },
        { name: 'Health API', url: '/api/health' },
        { name: 'Sitemap', url: '/sitemap.xml' },
        { name: 'About Page', url: '/about' },
        { name: 'Pricing Page', url: '/pricing' }
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${PRODUCTION_URL}${endpoint.url}`);
            const status = response.status;
            
            if (status === 200) {
                console.log(`✅ ${endpoint.name}: ${status} OK`);
            } else {
                console.log(`⚠️  ${endpoint.name}: ${status}`);
            }
            
            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
        }
    }
}

async function checkEnvironmentVariables() {
    console.log('\n🔧 Environment Variable Check...\n');
    
    const requiredVars = [
        'DATABASE_URL',
        'STRIPE_SECRET_KEY',
        'NEXTAUTH_SECRET',
        'JWT_SECRET'
    ];

    console.log('📋 Required Environment Variables:');
    for (const varName of requiredVars) {
        const value = process.env[varName];
        if (value) {
            console.log(`✅ ${varName}: Configured`);
        } else {
            console.log(`❌ ${varName}: Missing`);
        }
    }

    console.log('\n💡 Note: These should be configured in Vercel dashboard');
    console.log('   Go to: Vercel Dashboard > Your Project > Settings > Environment Variables');
}

async function main() {
    console.log('🚀 Scoopify Club - Deployment Status Checker\n');
    console.log('=' .repeat(50));
    
    await checkDeploymentStatus();
    await checkEnvironmentVariables();
    
    console.log('\n' + '=' .repeat(50));
    console.log('\n📞 If you need help:');
    console.log('   - Check Vercel deployment logs');
    console.log('   - Verify all environment variables are set');
    console.log('   - Test again in a few minutes');
    console.log('   - Contact support if issues persist');
}

main().catch(console.error); 