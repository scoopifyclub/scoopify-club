import axios from 'axios';

console.log('🔍 Testing Vercel Deployment');
console.log('============================\n');

const BASE_URL = 'https://scoopifyclub.vercel.app';

async function testEndpoint(path, description) {
    try {
        const response = await axios.get(`${BASE_URL}${path}`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log(`✅ ${description}`);
        console.log(`   URL: ${BASE_URL}${path}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.headers['content-type']}`);
        console.log(`   Content-Length: ${response.headers['content-length'] || 'Unknown'}`);
        
        if (response.data && typeof response.data === 'string' && response.data.length > 100) {
            console.log(`   Preview: ${response.data.substring(0, 100)}...`);
        }
        
        return true;
    } catch (error) {
        console.log(`❌ ${description}`);
        console.log(`   URL: ${BASE_URL}${path}`);
        console.log(`   Status: ${error.response?.status || 'Network Error'}`);
        console.log(`   Error: ${error.message}`);
        
        if (error.response?.data) {
            console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        
        return false;
    }
}

async function testVercelDeployment() {
    console.log('📋 Testing Key Endpoints:\n');
    
    const tests = [
        { path: '/', description: 'Homepage' },
        { path: '/about', description: 'About Page' },
        { path: '/signup', description: 'Customer Signup' },
        { path: '/auth/scooper-signup', description: 'Employee Signup' },
        { path: '/pricing', description: 'Pricing Page' },
        { path: '/check-coverage', description: 'Coverage Check' },
        { path: '/api/health', description: 'Health API' },
        { path: '/api/test-db', description: 'Database Test API' },
        { path: '/robots.txt', description: 'Robots.txt' },
        { path: '/sitemap.xml', description: 'Sitemap' }
    ];
    
    let successCount = 0;
    let totalCount = tests.length;
    
    for (const test of tests) {
        const success = await testEndpoint(test.path, test.description);
        if (success) successCount++;
        console.log(''); // Add spacing between tests
    }
    
    console.log('📊 Test Results Summary:');
    console.log(`   Total Tests: ${totalCount}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${totalCount - successCount}`);
    console.log(`   Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
    
    if (successCount === totalCount) {
        console.log('\n🎉 All tests passed! Vercel deployment is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. There may be deployment issues.');
        console.log('\n🔧 Troubleshooting Steps:');
        console.log('   1. Check Vercel build logs for errors');
        console.log('   2. Verify environment variables are set');
        console.log('   3. Check database connectivity');
        console.log('   4. Review middleware configuration');
    }
}

testVercelDeployment().catch(console.error); 