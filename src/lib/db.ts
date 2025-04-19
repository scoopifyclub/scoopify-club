import { PrismaClient } from '@prisma/client';

// Create a single PrismaClient instance
const prisma = new PrismaClient();

// Export the PrismaClient instance
export default prisma;

// Export a function to run a raw query
export const query = async (text: string, params?: any[]) => {
  try {
    const start = Date.now();
    const result = await prisma.$queryRawUnsafe(text, ...(params || []));
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration });
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}; 