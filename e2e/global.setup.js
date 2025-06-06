import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { TEST_USERS } from './test-data';
// Initialize a new Prisma client specifically for tests
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});
async function globalSetup(config) {
    console.log('🔧 Setting up test environment...');
    // Create .auth directory if it doesn't exist
    const authDir = path.join(__dirname, '..', '.auth');
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }
    // Create test user
    await createTestUser('CUSTOMER');
    // Set up logged-in state for tests
    const storageState = path.join(authDir, 'user.json');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    // Navigate to login page
    await page.goto(`${config.projects[0].use.baseURL}/login`);
    // Login as customer
    await page.fill('input[name="email"]', TEST_USERS.customer.email);
    await page.fill('input[name="password"]', TEST_USERS.customer.password);
    await page.click('button[type="submit"]');
    // Wait for successful login
    await page.waitForURL('**/dashboard');
    // Save signed-in state
    await page.context().storageState({ path: storageState });
    await browser.close();
    console.log('✅ Test environment setup complete');
}
async function createTestUser(role) {
    const userData = TEST_USERS[role.toLowerCase()];
    const hashedPassword = await hash(userData.password, 10);
    try {
        // Create user
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: {
                email: userData.email,
                password: hashedPassword,
                name: userData.name,
                role: role,
                emailverified: true,
            },
        });
        // Create role-specific data
        if (role === 'CUSTOMER') {
            await prisma.customer.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    address: {
                        create: {
                            street: '123 Test St',
                            city: 'Test City',
                            state: 'CA',
                            zipCode: '12345',
                        },
                    },
                },
            });
        }
        else if (role === 'EMPLOYEE') {
            await prisma.employee.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    status: 'ACTIVE',
                },
            });
        }
        console.log(`Created test ${role.toLowerCase()} user: ${userData.email}`);
        return user;
    }
    catch (error) {
        console.error(`Error creating test ${role.toLowerCase()} user:`, error);
        throw error;
    }
}
export default globalSetup;
