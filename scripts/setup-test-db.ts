import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function setupTestDatabase() {
  try {
    // Create test users
    const customerPassword = await hash('Test123!', 12);
    const employeePassword = await hash('Employee123!', 12);
    const adminPassword = await hash('Admin123!', 12);

    // Create test customer
    const customer = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test Customer',
        password: customerPassword,
        role: 'CUSTOMER',
        deviceFingerprint: 'test-device-1',
        emailVerified: true,
        customer: {
          create: {
            address: {
              create: {
                street: '123 Test St',
                city: 'Test City',
                state: 'CA',
                zipCode: '12345'
              }
            }
          }
        }
      }
    });

    // Create test employee
    const employee = await prisma.user.create({
      data: {
        email: 'employee@example.com',
        name: 'Test Employee',
        password: employeePassword,
        role: 'EMPLOYEE',
        deviceFingerprint: 'test-device-2',
        emailVerified: true,
        employee: {
          create: {}
        }
      }
    });

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Test Admin',
        password: adminPassword,
        role: 'ADMIN',
        deviceFingerprint: 'test-device-3',
        emailVerified: true
      }
    });

    console.log('✅ Test database setup completed');
    console.log('Test users created:');
    console.log('- Customer:', customer.email);
    console.log('- Employee:', employee.email);
    console.log('- Admin:', admin.email);

  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestDatabase(); 