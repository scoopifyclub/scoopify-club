// Check Neon database status
const https = require('https');

console.log('☁️  Checking Neon Database Status\n');

// Extract hostname from DATABASE_URL
const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4Jp1QuMdbHzw@ep-wispy-firefly-a6dll41z.us-west-2.aws.neon.tech/neondb?sslmode=require';
const hostname = dbUrl.match(/@([^\/]+)/)?.[1];

if (!hostname) {
  console.log('❌ Could not extract hostname from DATABASE_URL');
  process.exit(1);
}

console.log('📋 Hostname:', hostname);

// Test if we can reach the Neon server
console.log('\n🌐 Testing connectivity to Neon servers...');

const req = https.request({
  hostname: hostname,
  port: 443,
  method: 'GET',
  timeout: 10000
}, (res) => {
  console.log('   ✅ Can reach Neon servers');
  console.log('   📊 Status:', res.statusCode);
  console.log('   📋 Headers:', res.headers);
  
  if (res.statusCode === 200) {
    console.log('   🎉 Neon server is responding');
  } else {
    console.log('   ⚠️  Neon server responded with unexpected status');
  }
});

req.on('error', (error) => {
  console.log('   ❌ Cannot reach Neon servers:', error.message);
  console.log('   💡 This might indicate:');
  console.log('      - Database is suspended');
  console.log('      - Network connectivity issues');
  console.log('      - Database has been deleted');
});

req.on('timeout', () => {
  console.log('   ⏰ Connection timeout');
  req.destroy();
});

req.end();

// Also test the specific database endpoint
console.log('\n🗄️  Testing database endpoint...');

const dbReq = https.request({
  hostname: hostname,
  port: 5432,
  method: 'GET',
  timeout: 5000
}, (res) => {
  console.log('   ✅ Database port is accessible');
});

dbReq.on('error', (error) => {
  console.log('   ❌ Database port not accessible:', error.message);
  console.log('   💡 This is normal - PostgreSQL doesn\'t respond to HTTP requests');
});

dbReq.on('timeout', () => {
  console.log('   ⏰ Database connection timeout');
  dbReq.destroy();
});

dbReq.end();

console.log('\n📋 Next Steps:');
console.log('1. Go to https://console.neon.tech');
console.log('2. Check if your database "neondb" is active');
console.log('3. If suspended, click "Resume" to reactivate it');
console.log('4. Copy the exact connection string from the dashboard');
console.log('5. Update your .env.local file with the new connection string');

console.log('\n🔧 If the database is suspended:');
console.log('- Neon suspends inactive databases to save costs');
console.log('- You need to manually resume it from the dashboard');
console.log('- After resuming, the connection should work immediately'); 