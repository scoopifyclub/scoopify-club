// Add missing database indexes
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

console.log('📈 Adding Missing Database Indexes\n');

async function addMissingIndexes() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected successfully');
    
    // Add missing indexes
    const indexes = [
      {
        name: 'Payment_stripePaymentIntentId_idx',
        table: 'Payment',
        column: 'stripePaymentIntentId',
        query: 'CREATE INDEX IF NOT EXISTS "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId")'
      },
      {
        name: 'Payment_status_idx',
        table: 'Payment',
        column: 'status',
        query: 'CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status")'
      },
      {
        name: 'Service_status_idx',
        table: 'Service',
        column: 'status',
        query: 'CREATE INDEX IF NOT EXISTS "Service_status_idx" ON "Service"("status")'
      },
      {
        name: 'Service_scheduledDate_idx',
        table: 'Service',
        column: 'scheduledDate',
        query: 'CREATE INDEX IF NOT EXISTS "Service_scheduledDate_idx" ON "Service"("scheduledDate")'
      },
      {
        name: 'User_emailVerified_idx',
        table: 'User',
        column: 'emailVerified',
        query: 'CREATE INDEX IF NOT EXISTS "User_emailVerified_idx" ON "User"("emailVerified")'
      }
    ];
    
    console.log(`📋 Adding ${indexes.length} indexes...`);
    
    for (const index of indexes) {
      try {
        console.log(`   📈 Adding ${index.name}...`);
        await prisma.$executeRawUnsafe(index.query);
        console.log(`   ✅ ${index.name} added successfully`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  ${index.name} already exists`);
        } else {
          console.log(`   ❌ Failed to add ${index.name}: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 Index addition completed!');
    console.log('💡 Database performance should be improved.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingIndexes(); 