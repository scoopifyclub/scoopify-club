console.log('Executing seed file:', __filename);
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  const now = new Date();

  // Create test users (all required fields, no referredId)
  const admin = await prisma.user.create({
    data: {
      id: 'admin-1',
      email: 'admin@scoopify.club',
      name: 'Admin User',
      role: 'ADMIN',
      password: await bcrypt.hash('admin123', 10),
      emailVerified: true,
      image: null,
      deviceFingerprint: null,
      createdAt: now,
      updatedAt: now
    }
  });

  const customer = await prisma.user.create({
    data: {
      id: 'customer-1',
      email: 'demo@example.com',
      name: 'Test Customer',
      role: 'CUSTOMER',
      password: await bcrypt.hash('demo123', 10),
      emailVerified: true,
      image: null,
      deviceFingerprint: null,
      createdAt: now,
      updatedAt: now
    }
  });

  const employee = await prisma.user.create({
    data: {
      id: 'employee-1',
      email: 'employee@scoopify.club',
      name: 'Test Employee',
      role: 'EMPLOYEE',
      password: await bcrypt.hash('employee123', 10),
      emailVerified: true,
      image: null,
      deviceFingerprint: null,
      createdAt: now,
      updatedAt: now
    }
  });

  await prisma.customer.create({
    data: {
      userId: customer.id,
      referralCode: 'REF123',
      createdAt: now,
      updatedAt: now,
      subscriptionId: null,
      stripeCustomerId: null,
      gateCode: null,
      phone: null,
      serviceDay: null,
      cashAppName: null
    }
  });

  await prisma.employee.create({
    data: {
      userId: employee.id,
      status: 'ACTIVE',
      phone: null,
      cashAppUsername: null,
      stripeAccountId: null,
      bio: null,
      availability: null,
      rating: null,
      completedJobs: 0,
      createdAt: now,
      updatedAt: now,
      averageRating: null,
      preferredPaymentMethod: null
    }
  });

  // Create test service plan
  const servicePlan = await prisma.servicePlan.create({
    data: {
      id: 'plan-1',
      name: 'Basic Cleaning',
      description: 'Standard cleaning service',
      price: 50.0,
      duration: 60,
      type: 'ONE_TIME',
      isActive: true,
      createdAt: now,
      updatedAt: now
    }
  });

  // Create test service
  const service = await prisma.service.create({
    data: {
      id: 'service-1',
      customerId: customer.id,
      scheduledDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      servicePlanId: servicePlan.id,
      employeeId: employee.id,
      status: 'SCHEDULED',
      createdAt: now,
      updatedAt: now
    }
  });

  // Create test payment
  await prisma.payment.create({
    data: {
      id: 'payment-1',
      amount: 50.0,
      type: 'SERVICE',
      serviceId: service.id,
      customerId: customer.id,
      status: 'PAID',
      createdAt: now,
      updatedAt: now,
      paidAt: now
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch(e => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
