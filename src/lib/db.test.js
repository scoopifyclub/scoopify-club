import { prisma } from '../tests/setup';
describe('Database Utility', () => {
    it('should connect to the database', async () => {
        try {
            await prisma.$connect();
            expect(prisma).toBeDefined();
            await prisma.$disconnect();
        }
        catch (error) {
            expect(error).toBeNull();
        }
    });
    it('should handle database operations', async () => {
        try {
            await prisma.$connect();
            // Test if we can execute a raw query
            const result = await prisma.$executeRaw `SELECT 1 + 1 as result`;
            expect(result).toBe(1); // One row affected
            await prisma.$disconnect();
        }
        catch (error) {
            expect(error).toBeNull();
        }
    });
});
