import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function createTestDatabase() {
  try {
    // Try to connect to the default database first
    const defaultUrl = process.env.DATABASE_URL?.replace('/scoopify_test', '/postgres');
    
    // Create the test database
    await execAsync(`"C:\\Program Files\\PostgreSQL\\16\\bin\\createdb" -U postgres scoopify_test`);
    
    console.log('✅ Test database created');
    
    // Run Prisma migrations
    await execAsync('npx prisma migrate deploy');
    
    console.log('✅ Database migrations applied');
    
  } catch (error) {
    console.error('Error creating test database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDatabase(); 