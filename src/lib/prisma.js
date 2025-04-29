import { PrismaClient } from '@prisma/client';
import { isEdgeRuntime, isVercel, isProduction } from './vercel-runtime';
// Maximum connection retries
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
// Connection pool configuration - matches schema.prisma settings
const POOL_CONFIG = {
    connection_limit: isVercel() && isProduction() ? 10 : 5 // Reduce for dev environments
};
// Create a variable to hold our client
let prisma;
/**
 * Attempts to connect to the database with retry logic
 */
async function connectWithRetry(client, retries = MAX_RETRIES) {
    try {
        await client.$connect();
        console.log('Successfully connected to database');
    }
    catch (error) {
        console.error(`Connection attempt failed:`, error);
        if (retries > 0) {
            console.log(`Retrying connection in ${RETRY_DELAY_MS}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return connectWithRetry(client, retries - 1);
        }
        else {
            console.error('Failed to connect to database after multiple attempts');
            // Don't throw - we want to allow the app to start anyway
            // The connection will be retried on the first query
        }
    }
}
if (!isEdgeRuntime()) {
    // Only use Prisma in Node.js environments, not in Edge Runtime
    const globalForPrisma = globalThis;
    prisma = globalForPrisma.prisma ?? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });
    if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma;
    }
    // Connect to the database asynchronously (only in Node.js environment)
    // This allows the app to start even if the database is not available
    connectWithRetry(prisma).catch((err) => {
        console.error('Failed to initiate database connection:', err);
        process.exit(1);
    });
}
else {
    // In Edge Runtime, create a dummy prisma client that works with middleware
    prisma = new Proxy({}, {
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
// Export the Prisma client instance
export default prisma;
// Helper for transactions with retry logic
export async function withRetry(fn, retries = MAX_RETRIES) {
    try {
        return await fn();
    }
    catch (error) {
        // Check if this is a connection error that can be retried
        if (retries > 0 && (error.code === 'P1001' || // Error connecting to database
            error.code === 'P1002' || // Database server timeout
            error.code === 'P1008' || // Operations timed out
            error.code === 'P1017' // Server closed the connection
        )) {
            console.log(`Database operation failed with ${error.code}, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return withRetry(fn, retries - 1);
        }
        throw error;
    }
}
// Helper method for executing queries with retry logic
export async function executeQuery(queryFn) {
    return withRetry(queryFn);
}
