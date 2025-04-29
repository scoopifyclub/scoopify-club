import { PrismaClient } from '@prisma/client';
import { TEST_USERS } from './test-data';
// Initialize a new Prisma client specifically for tests
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});
async function globalTeardown(config) {
    console.log('🧹 Cleaning up test environment...');
    try {
        // Get test user emails
        const testUserEmails = Object.values(TEST_USERS).map(u => u.email);
        // Find test users
        const testUsers = await prisma.user.findMany({
            where: {
                email: {
                    in: testUserEmails
                }
            },
            select: {
                id: true,
                email: true,
                role: true
            }
        });
        const userIds = testUsers.map(u => u.id);
        // Delete test services
        await prisma.service.deleteMany({
            where: {
                OR: [
                    {
                        customer: {
                            userId: { in: userIds }
                        }
                    },
                    {
                        employee: {
                            userId: { in: userIds }
                        }
                    }
                ]
            }
        });
        // Delete payments
        await prisma.payment.deleteMany({
            where: {
                OR: [
                    {
                        customer: {
                            userId: { in: userIds }
                        }
                    },
                    {
                        employee: {
                            userId: { in: userIds }
                        }
                    }
                ]
            }
        });
        // Delete customer addresses
        await prisma.address.deleteMany({
            where: {
                customer: {
                    userId: { in: userIds }
                }
            }
        });
        // Delete customers
        await prisma.customer.deleteMany({
            where: {
                userId: { in: userIds }
            }
        });
        // Delete employees
        await prisma.employee.deleteMany({
            where: {
                userId: { in: userIds }
            }
        });
        // Don't actually delete test users to maintain persistent auth state between test runs
        // This helps avoid auth issues when running tests repeatedly
        console.log(`✅ Test environment cleanup completed`);
    }
    catch (error) {
        console.error('Error during test environment cleanup:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
export default globalTeardown;
