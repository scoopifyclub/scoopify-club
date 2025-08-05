// Quick database connection test
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

console.log('🔌 Quick Database Connection Test\n');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📡 Attempting to connect...');
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Query successful:', result[0].current_time);
    
    console.log('\n🎉 Your database is working!');
    console.log('💡 You can now continue with Phase 2 of the production readiness roadmap.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('invalid port number')) {
      console.log('\n🔧 This usually means your Neon database is suspended.');
      console.log('📋 Please:');
      console.log('   1. Go to https://console.neon.tech');
      console.log('   2. Find your database "neondb"');
      console.log('   3. Click "Resume" if it shows suspended');
      console.log('   4. Wait 30-60 seconds');
      console.log('   5. Run this test again');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 