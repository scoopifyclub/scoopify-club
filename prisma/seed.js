console.log('Executing seed file:', __filename);
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  try {
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'admin@scoopify.club',
        name: 'Admin User',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });

    // Create demo/customer user
    const customer = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'demo@example.com',
        name: 'Demo Customer',
        password: await bcrypt.hash('demo123', 10),
        role: 'CUSTOMER',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });

    // Create employee user
    const employee = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'employee@scoopify.club',
        name: 'Test Employee',
        password: await bcrypt.hash('employee123', 10),
        role: 'EMPLOYEE',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });

    // Create service plan
    const basicPlan = await prisma.servicePlan.create({
      data: {
        id: uuidv4(),
        name: 'Basic Plan',
        description: 'Basic service plan',
        price: 99.99,
        duration: 30,
        type: 'BASIC',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });

    // Create customer profile
    const customerProfile = await prisma.customer.create({
      data: {
        id: uuidv4(),
        userId: customer.id,
        subscriptionId: null,
        stripeCustomerId: `cus_test_${Date.now()}`,
        gateCode: '1234',
        phone: '123-456-7890',
        serviceDay: 'Monday',
        cashAppName: 'democustomer',
        referralCode: `REF_${Date.now()}`,
        referrerId: null,
        referredId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create address
    const address = await prisma.address.create({
      data: {
        id: uuidv4(),
        street: '123 Main St',
        city: 'Example City',
        state: 'EX',
        zipCode: '12345',
        customerId: customerProfile.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create employee profile
    const employeeProfile = await prisma.employee.create({
      data: {
        id: uuidv4(),
        userId: employee.id,
        phone: '987-654-3210',
        status: 'ACTIVE',
        completedJobs: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });

    // Create a payment
    await prisma.payment.create({
      data: {
        id: uuidv4(),
        amount: basicPlan.price,
        type: 'SUBSCRIPTION',
        serviceId: null,
        customerId: customerProfile.id,
        status: 'PENDING',
        paymentMethod: 'CASH_APP',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('An error occurred while running the seed command:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
