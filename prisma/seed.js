console.log('Executing seed file:', __filename);
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database cleanup...');
  // Delete all data in the correct order to avoid foreign key issues
  await prisma.payment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.address.deleteMany();
  await prisma.coverageArea.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.servicePlan.deleteMany();

  console.log('Database cleaned. Seeding test accounts...');

  const now = new Date();

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'admin@scoopify.club',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
      updatedAt: now,
    },
  });

  // Create demo customer
  const customerPassword = await bcrypt.hash('demo123', 10);
  const customerUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'demo@example.com',
      password: customerPassword,
      name: 'Demo Customer',
      role: 'CUSTOMER',
      emailVerified: true,
      updatedAt: now,
      customer: {
        create: {
          id: uuidv4(),
          phone: '555-0123',
          referralCode: 'DEMO123',
          updatedAt: now,
        },
      },
    },
  });
  // Fetch the customer profile
  const customer = await prisma.customer.findUnique({ where: { userId: customerUser.id } });

  // Create demo employee
  const employeePassword = await bcrypt.hash('employee123', 10);
  const employeeUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'employee@scoopify.club',
      password: employeePassword,
      name: 'Demo Employee',
      role: 'EMPLOYEE',
      emailVerified: true,
      updatedAt: now,
      employee: {
        create: {
          id: uuidv4(),
          phone: '555-0124',
          status: 'ACTIVE',
          hasSetServiceArea: true,
          updatedAt: now,
          serviceAreas: {
            create: {
              id: uuidv4(),
              zipCode: '12345',
              travelDistance: 20,
              active: true,
              updatedAt: now,
            },
          },
        },
      },
    },
  });
  // Fetch the employee profile
  const employee = await prisma.employee.findUnique({ where: { userId: employeeUser.id } });

  // Create address for customer
  await prisma.address.create({
    data: {
      id: uuidv4(),
      street: '123 Main St',
      city: 'Example City',
      state: 'EX',
      zipCode: '12345',
      customerId: customer.id,
      createdAt: now,
      updatedAt: now,
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
      createdAt: now,
      updatedAt: now,
    },
  });

  // Create Initial Cleanup Plan
  const initialCleanupPlan = await prisma.servicePlan.create({
    data: {
      id: uuidv4(),
      name: 'Initial Cleanup',
      description: 'Discounted initial cleanup for new customers',
      price: 69.0,
      duration: 1,
      type: 'INITIAL_CLEANUP',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  // Create a sample initial cleanup Service for the demo customer (50% off)
  const discountedCleanupFee = 69.0 * 0.5;
  await prisma.service.create({
    data: {
      id: uuidv4(),
      customerId: customer.id,
      status: 'SCHEDULED',
      scheduledDate: now,
      servicePlanId: initialCleanupPlan.id,
      potentialEarnings: discountedCleanupFee,
      paymentStatus: 'PAID',
      workflowStatus: 'AVAILABLE',
      createdAt: now,
      updatedAt: now,
    },
  });

  // Create a payment
  await prisma.payment.create({
    data: {
      id: uuidv4(),
      amount: basicPlan.price,
      type: 'SUBSCRIPTION',
      serviceId: null,
      customerId: customer.id,
      status: 'PENDING',
      paymentMethod: 'CASH_APP',
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log('Demo accounts created successfully:');
  console.log('Admin:', admin.email);
  console.log('Customer:', customerUser.email);
  console.log('Employee:', employeeUser.email);
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('An error occurred while running the seed command:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
