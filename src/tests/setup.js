import fs from 'fs';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import path from 'path';
// Set up environment for tests
// Note: NODE_ENV is read-only during build
process.env.JWT_SECRET = 'test-secret';
process.env.STRIPE_SECRET_KEY = 'test-stripe-key';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/scoopify_test';
process.env.RESEND_API_KEY = 'test-resend-key';
// Initialize Prisma client with test database
export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});
// Tables in order of deletion (respecting foreign key constraints)
const tablesToClean = [
    'ServiceMessage',
    'ChatMessage',
    'Notification',
    'ServicePhoto',
    'ServiceChecklist',
    'TimeExtension',
    'ServiceDelay',
    'Service',
    'PaymentRetry',
    'Payment',
    'RefreshToken',
    'Referral',
    'Subscription',
    'ServicePlan',
    'ServiceArea',
    'Location',
    'Address',
    'Customer',
    'Employee',
    'User'
];
export async function cleanupDatabase() {
    try {
        // Disable foreign key checks for cleanup
        await prisma.$executeRaw `PRAGMA foreign_keys = OFF`;
        // Get list of existing tables
        const existingTables = await prisma.$queryRaw `
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_prisma_%'
    `;
        // Clean all existing tables in order
        for (const table of tablesToClean) {
            if (existingTables.some(t => t.name === table)) {
                await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
            }
        }
        // Re-enable foreign key checks
        await prisma.$executeRaw `PRAGMA foreign_keys = ON`;
    }
    catch (error) {
        console.error('Error cleaning database:', error);
        throw error;
    }
}
export async function setupTestDatabase() {
    try {
        // Delete the test database file if it exists
        const testDbPath = path.resolve('./prisma/test.db');
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        // Generate Prisma Client
        execSync('npx prisma generate', { stdio: 'inherit' });
        // Push the schema to the database (this is faster than running migrations for tests)
        execSync('npx prisma db push --accept-data-loss --force-reset', { stdio: 'inherit', env: Object.assign(Object.assign({}, process.env), { DATABASE_URL: process.env.DATABASE_URL }) });
        // Additional cleanup after schema push
        await cleanupDatabase();
    }
    catch (error) {
        console.error('Error setting up test database:', error);
        throw error;
    }
}
// Test user data
export const testUsers = {
    customer: {
        email: 'customer@test.com',
        password: 'Test123!@#',
        name: 'Test Customer',
        role: 'CUSTOMER',
        deviceFingerprint: 'test-customer-device'
    },
    employee: {
        email: 'employee@test.com',
        password: 'Test123!@#',
        name: 'Test Employee',
        role: 'EMPLOYEE',
        deviceFingerprint: 'test-employee-device'
    },
    admin: {
        email: 'admin@test.com',
        password: 'Test123!@#',
        name: 'Test Admin',
        role: 'ADMIN',
        deviceFingerprint: 'test-admin-device'
    }
};
export async function createTestUser(role) {
    const userData = testUsers[role.toLowerCase()];
    const hashedPassword = await hash(userData.password, 10);
    const user = await prisma.user.create({
        data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: role,
            deviceFingerprint: userData.deviceFingerprint,
            emailVerified: true
        }
    });
    if (role === 'CUSTOMER') {
        // Create customer record with address and subscription
        const customer = await prisma.customer.create({
            data: {
                userId: user.id,
                address: {
                    create: {
                        street: '123 Test St',
                        city: 'Test City',
                        state: 'CA',
                        zipCode: '12345'
                    }
                }
            }
        });
        // Create a service plan and subscription for the customer
        const servicePlan = await prisma.servicePlan.create({
            data: {
                name: 'Test Plan',
                description: 'Test Description',
                price: 9999,
                type: 'REGULAR',
                duration: 30, // Duration in minutes
                isActive: true
            }
        });
        await prisma.subscription.create({
            data: {
                customerId: customer.id,
                planId: servicePlan.id,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            }
        });
    }
    else if (role === 'EMPLOYEE') {
        await prisma.employee.create({
            data: {
                userId: user.id,
                status: 'ACTIVE'
            }
        });
    }
    return {
        user,
        credentials: {
            email: userData.email,
            password: userData.password,
            deviceFingerprint: userData.deviceFingerprint
        }
    };
}
// Cleanup after all tests
process.on('beforeExit', async () => {
    await cleanupDatabase();
    await prisma.$disconnect();
});
