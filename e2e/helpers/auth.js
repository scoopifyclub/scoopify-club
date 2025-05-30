import prisma from "@/lib/prisma";
import { hash } from 'bcryptjs';
export const testUsers = {
    customer: {
        email: 'customer@scoopifyclub.com',
        password: 'Test123!@#',
        name: 'Test Customer',
        role: 'CUSTOMER',
    },
    employee: {
        email: 'employee@scoopifyclub.com',
        password: 'Test123!@#',
        name: 'Test Employee',
        role: 'EMPLOYEE',
    },
    admin: {
        email: 'admin@scoopifyclub.com',
        password: 'Test123!@#',
        name: 'Test Admin',
        role: 'ADMIN',
    },
};
export async function setupTestUser(role) {
    const userData = testUsers[role.toLowerCase()];
    const hashedPassword = await hash(userData.password, 10);
    // Create user
    const user = await prisma.user.create({
        data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: role,
            emailverified: true,
        },
    });
    // Create role-specific data
    if (role === 'CUSTOMER') {
        await prisma.customer.create({
            data: {
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
        await prisma.employee.create({
            data: {
                userId: user.id,
                status: 'ACTIVE',
            },
        });
    }
    return {
        user,
        credentials: {
            email: userData.email,
            password: userData.password,
        },
    };
}
export async function cleanupTestData() {
    try {
        console.log('\n=== Starting Test Data Cleanup ===');
        // First, get all test user IDs
        const testUserEmails = Object.values(testUsers).map(u => u.email);
        console.log('Looking for test users with emails:', testUserEmails);
        const foundTestUsers = await prisma.user.findMany({
            where: {
                email: {
                    in: testUserEmails
                }
            },
            select: {
                id: true,
                email: true
            }
        });
        console.log('Found test users:', foundTestUsers.map(u => ({ id: u.id, email: u.email })));
        const testUserIds = foundTestUsers.map(u => u.id);
        // Delete in correct order to respect foreign key constraints
        console.log('\nDeleting customer data...');
        const customerResult = await prisma.customer.deleteMany({
            where: {
                userId: {
                    in: testUserIds
                }
            }
        });
        console.log(`Deleted ${customerResult.count} customer records`);
        console.log('\nDeleting employee data...');
        const employeeResult = await prisma.employee.deleteMany({
            where: {
                userId: {
                    in: testUserIds
                }
            }
        });
        console.log(`Deleted ${employeeResult.count} employee records`);
        console.log('\nDeleting user data...');
        const userResult = await prisma.user.deleteMany({
            where: {
                id: {
                    in: testUserIds
                }
            }
        });
        console.log(`Deleted ${userResult.count} user records`);
        console.log('\n=== Test Data Cleanup Complete ===\n');
    }
    catch (error) {
        console.error('\n=== Error during Test Data Cleanup ===');
        console.error('Error details:', error);
        console.error('=== End of Error Details ===\n');
        throw error;
    }
}
export async function loginAs(page, role) {
    const user = testUsers[role];
    console.log(`\n=== Starting login process for ${role} ===`);
    console.log('Attempting to login with:', { email: user.email, role: user.role });
    // Navigate to login page
    await page.goto('/login');
    console.log('Navigated to login page');
    // Fill in login form
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    console.log('Filled login form');
    // Submit form and wait for response
    const loginEndpoint = role === 'customer'
        ? '/api/auth/customer-login'
        : role === 'employee'
            ? '/api/auth/employee-login'
            : '/api/auth/admin-login';
    console.log(`Using login endpoint: ${loginEndpoint}`);
    // Click submit and wait for response
    await Promise.all([
        page.waitForResponse((res) => res.url().includes(loginEndpoint)),
        page.click('button[type="submit"]')
    ]);
    // Wait for navigation
    console.log('Waiting for navigation...');
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    console.log('Navigation complete');
    // Log current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    // Wait for dashboard content to be visible
    const dashboardSelector = role === 'customer'
        ? 'text=Customer Dashboard'
        : role === 'employee'
            ? 'text=Employee Dashboard'
            : 'text=Admin Dashboard';
    console.log(`Waiting for dashboard content: ${dashboardSelector}`);
    await page.waitForSelector(dashboardSelector, { timeout: 10000 });
    console.log(`=== Login successful for ${role} ===\n`);
}
