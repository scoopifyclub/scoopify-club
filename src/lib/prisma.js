import { PrismaClient } from '@prisma/client';
import { isEdgeRuntime, isVercel, isProduction } from './vercel-runtime';
// Maximum connection retries
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;
// Connection pool configuration for different environments
const POOL_CONFIG = {
    connection_limit: isVercel() && isProduction() ? 15 : 10, // Increased for better admin dashboard performance
    pool_timeout: 30, // Increased to 30 seconds
    idle_timeout: 60, // Increased to 60 seconds
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
                // Use DIRECT_URL for non-pooled connections to avoid connection issues
                url: process.env.DIRECT_URL || process.env.DATABASE_URL
            }
        },
        // Optimize for serverless with increased timeouts and connection limits
        __internal: {
            engine: {
                connectionTimeout: 30000, // Increased to 30 seconds
                pollInterval: 100, // 100ms
                connectionLimit: POOL_CONFIG.connection_limit,
                maxIdleTime: POOL_CONFIG.idle_timeout * 1000, // Convert to milliseconds
                poolTimeout: POOL_CONFIG.pool_timeout * 1000, // Convert to milliseconds
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
        // Changed from process.exit(1) to allow app to continue
        console.warn('App will continue but database operations may fail');
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
export { prisma };
export default prisma;
// Helper for transactions with optimized retry logic
export async function withRetry(fn, retries = 5) {
    const delays = [500, 1000, 2000, 4000, 8000]; // Progressive delay - added longer delays
    
    try {
        return await fn();
    } catch (error) {
        if (retries > 0 && (
            error.code === 'P1001' || // Connection error
            error.code === 'P1002' || // Timeout
            error.code === 'P1008' || // Operations timeout
            error.code === 'P1017' || // Connection closed
            error.code === 'P2024'    // Connection pool timeout
        )) {
            console.log(`Database operation failed with ${error.code}, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delays[5 - retries]));
            return withRetry(fn, retries - 1);
        }
        throw error;
    }
}
// Helper function to safely execute database operations with proper cleanup
export async function withDatabase(operation) {
    try {
        return await operation(prisma);
    } catch (error) {
        // Log the error but don't disconnect here as it might be shared
        console.error('Database operation failed:', error);
        throw error;
    }
}
// Helper for admin routes that need proper connection management
export async function withAdminDatabase(operation) {
    try {
        console.log('🔧 Admin database operation starting...');
        const result = await withRetry(() => operation(prisma));
        console.log('✅ Admin database operation completed successfully');
        return result;
    } catch (error) {
        console.error('❌ Admin database operation failed:', error);
        
        // Specific handling for connection pool timeouts
        if (error.code === 'P2024') {
            console.error('🚨 Connection pool timeout detected - consider increasing pool size');
        }
        
        throw error;
    }
}
