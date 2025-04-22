import { PrismaClient } from '@prisma/client'

// We need to define global types
declare global {
  var prisma: PrismaClient | undefined
}

// Check if we're in an Edge environment - Edge has self but no window
const isEdge = typeof self !== 'undefined' && typeof window === 'undefined' ||
              typeof process === 'undefined';

// Create a variable to hold our client
let prisma: PrismaClient;

if (!isEdge) {
  // Only use Prisma in Node.js environments, not in Edge Runtime
  prisma = global.prisma || new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
  }

  // Connect to the database (only in Node.js environment)
  prisma.$connect().catch((err) => {
    console.error('Failed to connect to database:', err);
  });
} else {
  // In Edge Runtime, create a dummy prisma client that works with middleware
  prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
      // If this is a property access, we need to throw an error
      console.error(`Cannot use PrismaClient.${String(prop)} in Edge Runtime`);
      
      if (prop === '$connect' || prop === '$disconnect') {
        return () => Promise.resolve();
      }
      
      throw new Error('PrismaClient cannot be used in Edge Runtime');
    }
  });
}

export default prisma 