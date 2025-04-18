import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Successfully connected to database');
    console.log('Query result:', result);
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 