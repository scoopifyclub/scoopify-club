const https = require('https');

console.log('🧪 Testing Admin Dashboard Connection Pool Fixes\n');

const BASE_URL = 'https://scoopify-club-git-main-scoopifys-projects.vercel.app';

// Test admin login first
async function testAdminLogin() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            email: 'admin@scoopify.club',
            password: 'admin123'
        });

        const options = {
            hostname: 'scoopify-club-git-main-scoopifys-projects.vercel.app',
            port: 443,
            path: '/api/admin/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (res.statusCode === 200) {
                        console.log('✅ Admin login successful');
                        // Extract cookies for subsequent requests
                        const cookies = res.headers['set-cookie'];
                        resolve({ success: true, cookies, response });
                    } else {
                        console.log('❌ Admin login failed:', response.error);
                        resolve({ success: false, error: response.error });
                    }
                } catch (error) {
                    console.log('❌ Admin login parse error:', error.message);
                    resolve({ success: false, error: error.message });
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Admin login request error:', error.message);
            resolve({ success: false, error: error.message });
        });

        req.write(postData);
        req.end();
    });
}

// Test admin stats endpoint
async function testAdminStats(cookies) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'scoopify-club-git-main-scoopifys-projects.vercel.app',
            port: 443,
            path: '/api/admin/stats',
            method: 'GET',
            headers: {
                'Cookie': cookies ? cookies.join('; ') : ''
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (res.statusCode === 200) {
                        console.log('✅ Admin stats endpoint working');
                        console.log(`   - Total customers: ${response.totalCustomers}`);
                        console.log(`   - Total employees: ${response.totalEmployees}`);
                        console.log(`   - Active services: ${response.activeServices}`);
                        resolve({ success: true, response });
                    } else {
                        console.log('❌ Admin stats failed:', response.error);
                        if (response.code === 'CONNECTION_TIMEOUT') {
                            console.log('🚨 Still experiencing connection timeouts!');
                        }
                        resolve({ success: false, error: response.error });
                    }
                } catch (error) {
                    console.log('❌ Admin stats parse error:', error.message);
                    resolve({ success: false, error: error.message });
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Admin stats request error:', error.message);
            resolve({ success: false, error: error.message });
        });

        req.end();
    });
}

// Test admin employees endpoint
async function testAdminEmployees(cookies) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'scoopify-club-git-main-scoopifys-projects.vercel.app',
            port: 443,
            path: '/api/admin/employees',
            method: 'GET',
            headers: {
                'Cookie': cookies ? cookies.join('; ') : ''
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (res.statusCode === 200) {
                        console.log('✅ Admin employees endpoint working');
                        console.log(`   - Found ${response.length} employees`);
                        resolve({ success: true, response });
                    } else {
                        console.log('❌ Admin employees failed:', response.error);
                        if (response.code === 'CONNECTION_TIMEOUT') {
                            console.log('🚨 Still experiencing connection timeouts!');
                        }
                        resolve({ success: false, error: response.error });
                    }
                } catch (error) {
                    console.log('❌ Admin employees parse error:', error.message);
                    resolve({ success: false, error: error.message });
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Admin employees request error:', error.message);
            resolve({ success: false, error: error.message });
        });

        req.end();
    });
}

async function runTests() {
    console.log('🔐 Testing admin login...');
    const loginResult = await testAdminLogin();
    
    if (!loginResult.success) {
        console.log('\n❌ Cannot proceed with tests - admin login failed');
        return;
    }

    console.log('\n📊 Testing admin stats endpoint...');
    const statsResult = await testAdminStats(loginResult.cookies);

    console.log('\n👥 Testing admin employees endpoint...');
    const employeesResult = await testAdminEmployees(loginResult.cookies);

    console.log('\n📋 TEST SUMMARY:');
    console.log(`- Admin Login: ${loginResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Admin Stats: ${statsResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Admin Employees: ${employeesResult.success ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = loginResult.success && statsResult.success && employeesResult.success;
    
    if (allPassed) {
        console.log('\n🎉 ALL TESTS PASSED! Admin dashboard connection pool fixes are working!');
    } else {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }
}

runTests().catch(console.error); 