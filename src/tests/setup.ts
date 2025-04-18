import { PrismaClient } from '@prisma/client';
import fs from 'fs';

// Set test environment variables
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret-key';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';

// Create a new Prisma client for testing
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Global setup for database tests
beforeAll(async () => {
  // Ensure test database is clean
  try {
    await prisma.$connect();
    // Only try to delete if tables exist
    try {
      await prisma.user.deleteMany();
      await prisma.customer.deleteMany();
      await prisma.employee.deleteMany();
      await prisma.emailVerification.deleteMany();
      await prisma.passwordResetToken.deleteMany();
    } catch (error) {
      // If tables don't exist, that's fine - we'll create them
      console.log('Tables not found, will be created by migrations');
    }
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  // Clean up test database file
  try {
    if (fs.existsSync('test.db')) {
      fs.unlinkSync('test.db');
    }
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
}); 