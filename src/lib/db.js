// Re-export from the main prisma client
export { prisma as default } from './prisma.js';

// Also export the query function for backward compatibility
import { prisma } from './prisma.js';

export const sql = async (text, params) => {
    try {
        const start = Date.now();
        const result = await prisma.$queryRawUnsafe(text, ...(params || []));
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration });
        return result;
    }
    catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

// Export query as an alias for sql for backward compatibility
export const query = sql; 