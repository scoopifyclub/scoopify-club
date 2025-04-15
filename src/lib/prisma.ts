import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Enable connection pooling
    connectionLimit: 10,
    // Add query timeout
    queryTimeout: 5000,
    // Enable prepared statements
    preparedStatements: true,
    // Enable connection validation
    connectionValidation: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} 