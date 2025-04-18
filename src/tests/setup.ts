import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import fs from 'fs';
import { beforeAll, afterAll } from '@jest/globals';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.DATABASE_URL = 'file:./test.db';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';

// Initialize Prisma client
const prisma = new PrismaClient();

// Test users with different roles
export const testUsers = {
  customer: {
    email: 'customer@example.com',
    password: 'StrongPass123!',
    role: 'CUSTOMER',
  },
  employee: {
    email: 'employee@example.com',
    password: 'StrongPass123!',
    role: 'EMPLOYEE',
  },
  admin: {
    email: 'admin@example.com',
    password: 'StrongPass123!',
    role: 'ADMIN',
  },
};

// Helper functions
export async function createTestUser(userData: typeof testUsers[keyof typeof testUsers]) {
  const hashedPassword = await hash(userData.password, 12);
  return prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  });
}

export function generateTestToken(userId: string, role: string) {
  return sign(
    { id: userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
}

export function generateTestRefreshToken(userId: string) {
  return sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: '7d' }
  );
}

/**
 * Cleans up the test database by deleting all data from all tables
 */
export async function cleanupDatabase() {
  try {
    // Get all table names from SQLite
    const tables = await prisma.$queryRaw<{ name: string }[]>`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_prisma_%';
    `;

    // Delete all data from each table
    for (const { name } of tables) {
      await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
      // Reset SQLite sequences
      await prisma.$executeRawUnsafe(`DELETE FROM "sqlite_sequence" WHERE name="${name}";`);
    }
  } catch (error) {
    console.error('Error cleaning up database:', error);
    throw error;
  }
}

// Test request mock
export function createTestRequest(
  method: string = 'GET',
  body: any = null,
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {}
) {
  return {
    method,
    json: async () => body,
    headers: new Headers(headers),
    cookies: {
      get: (name: string) => cookies[name],
      getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
    },
  } as any;
}

// Test response mock
export function createTestResponse() {
  const headers = new Headers();
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    headers,
    setHeader: (name: string, value: string) => headers.set(name, value),
  } as any;
}

// Run cleanup before all tests
beforeAll(async () => {
  await cleanupDatabase();
});

// Run cleanup after all tests
afterAll(async () => {
  await cleanupDatabase();
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

// Reset database between tests
beforeEach(async () => {
  await cleanupDatabase();
}); 