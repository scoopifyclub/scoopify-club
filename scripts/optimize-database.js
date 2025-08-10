#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function optimizeDatabase() {
  console.log('🗄️ Optimizing database performance...');

  try {
    // Add missing indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_service_scheduled_date ON "Service"("scheduledDate")',
      'CREATE INDEX IF NOT EXISTS idx_service_customer_id ON "Service"("customerId")',
      'CREATE INDEX IF NOT EXISTS idx_service_employee_id ON "Service"("employeeId")',
      'CREATE INDEX IF NOT EXISTS idx_service_status ON "Service"("status")',
      'CREATE INDEX IF NOT EXISTS idx_payment_customer_id ON "Payment"("customerId")',
      'CREATE INDEX IF NOT EXISTS idx_payment_status ON "Payment"("status")',
      'CREATE INDEX IF NOT EXISTS idx_user_email ON "User"("email")',
      'CREATE INDEX IF NOT EXISTS idx_user_role ON "User"("role")',
      'CREATE INDEX IF NOT EXISTS idx_coverage_area_zip ON "CoverageArea"("zipCode")',
      'CREATE INDEX IF NOT EXISTS idx_coverage_area_employee ON "CoverageArea"("employeeId")'
    ];

    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index);
        console.log(`✅ Created index: ${index.split(' ')[2]}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️ Index already exists: ${index.split(' ')[2]}`);
        } else {
          console.log(`⚠️ Failed to create index: ${index.split(' ')[2]} - ${error.message}`);
        }
      }
    }

    // Analyze table statistics
    await prisma.$executeRawUnsafe('ANALYZE');
    console.log('✅ Database statistics updated');

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeDatabase();