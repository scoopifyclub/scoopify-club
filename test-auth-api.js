const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAuthAPI() {
    console.log('🧪 Testing Authentication API Directly...\n');
    
    const testUsers = [
        { email: 'admin@scoopify.club', password: 'admin123', role: 'ADMIN' },
        { email: 'demo@example.com', password: 'demo123', role: 'CUSTOMER' },
        { email: 'employee@scoopify.club', password: 'employee123', role: 'EMPLOYEE' }
    ];
    
    for (const user of testUsers) {
        console.log(`\n🔑 Testing ${user.role} login: ${user.email}`);
        
        try {
            const response = await fetch('https://www.scoopify.club/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    password: user.password
                })
            });
            
            console.log(`📊 Response Status: ${response.status}`);
            console.log(`📊 Response Headers:`, Object.fromEntries(response.headers.entries()));
            
            const data = await response.json();
            console.log(`📊 Response Data:`, data);
            
            if (response.ok) {
                console.log(`✅ ${user.role} login successful!`);
                
                // Check if we got the expected redirect URL
                if (data.redirectTo) {
                    console.log(`🔄 Redirect URL: ${data.redirectTo}`);
                }
                
                // Check if user data is correct
                if (data.user && data.user.role === user.role) {
                    console.log(`✅ User role matches: ${data.user.role}`);
                } else {
                    console.log(`❌ User role mismatch. Expected: ${user.role}, Got: ${data.user?.role || 'undefined'}`);
                }
            } else {
                console.log(`❌ ${user.role} login failed: ${data.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.log(`❌ ${user.role} login error: ${error.message}`);
        }
    }
    
    // Test session endpoint
    console.log('\n🔍 Testing session endpoint...');
    try {
        const sessionResponse = await fetch('https://www.scoopify.club/api/auth/session');
        console.log(`📊 Session Status: ${sessionResponse.status}`);
        
        const sessionData = await sessionResponse.json();
        console.log(`📊 Session Data:`, sessionData);
        
    } catch (error) {
        console.log(`❌ Session test error: ${error.message}`);
    }
}

testAuthAPI().catch(console.error); 