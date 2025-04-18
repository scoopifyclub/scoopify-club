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
        password: customerPassword,
        role: 'CUSTOMER',
        name: 'Test Customer',
        customer: {
          create: {
            email: 'test@example.com',
            phone: '555-123-4567',
            status: 'ACTIVE',
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
        password: employeePassword,
        role: 'EMPLOYEE',
        name: 'Test Employee',
        employee: {
          create: {
            name: 'Test Employee',
            email: 'employee@example.com',
            phone: '555-987-6543',
            status: 'ACTIVE'
          }
        }
      }
    });

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: adminPassword,
        role: 'ADMIN',
        name: 'Test Admin'
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