import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting final database setup...');
    
    // Clear existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.payment.deleteMany();
    await prisma.service.deleteMany();
    await prisma.address.deleteMany();
    await prisma.coverageArea.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.servicePlan.deleteMany();
    
    console.log('✅ Database cleaned');
    
    const now = new Date();
    
    // Step 1: Create service plans with Stripe price IDs
    console.log('📋 Creating service plans with Stripe IDs...');
    
    const monthly1DogPlan = await prisma.servicePlan.create({
      data: {
        id: uuidv4(),
        name: 'Monthly Service - 1 Dog',
        description: 'Monthly subscription for 1 dog (4 services per month)',
        price: 55.00,
        duration: 30,
        type: 'MONTHLY',
        isActive: true,
        stripePriceId: 'price_1RDxEPQ8d6yK8uhzrmZfPvWr',
        code: 'monthly-1',
        createdAt: now,
        updatedAt: now,
      },
    });
    
    const monthly2DogsPlan = await prisma.servicePlan.create({
      data: {
        id: uuidv4(),
        name: 'Monthly Service - 2 Dogs',
        description: 'Monthly subscription for 2 dogs (4 services per month)',
        price: 70.00,
        duration: 30,
        type: 'MONTHLY',
        isActive: true,
        stripePriceId: 'price_1RDxEQQ8d6yK8uhzfZSPpH78',
        code: 'monthly-2',
        createdAt: now,
        updatedAt: now,
      },
    });
    
    const monthly3PlusDogsPlan = await prisma.servicePlan.create({
      data: {
        id: uuidv4(),
        name: 'Monthly Service - 3+ Dogs',
        description: 'Monthly subscription for 3+ dogs (4 services per month)',
        price: 100.00,
        duration: 30,
        type: 'MONTHLY',
        isActive: true,
        stripePriceId: 'price_1RDxEQQ8d6yK8uhzZudAc4tu',
        code: 'monthly-3',
        createdAt: now,
        updatedAt: now,
      },
    });
    
    const oneTime1DogPlan = await prisma.servicePlan.create({
      data: {
        id: uuidv4(),
        name: 'One-Time Service - 1 Dog',
        description: 'One-time service for 1 dog',
        price: 50.00,
        duration: 1,
        type: 'ONE_TIME',
        isActive: true,
        stripePriceId: 'price_1RDxERQ8d6yK8uhzdukcSTxA',
        code: 'one-time-1',
        createdAt: now,
        updatedAt: now,
      },
    });
    
    const oneTime2DogsPlan = await prisma.servicePlan.create({
      data: {
        id: uuidv4(),
        name: 'One-Time Service - 2 Dogs',
        description: 'One-time service for 2 dogs',
        price: 50.00,
        duration: 1,
        type: 'ONE_TIME',
        isActive: true,
        stripePriceId: 'price_1RDxERQ8d6yK8uhzuQm3XxVE',
        code: 'one-time-2',
        createdAt: now,
        updatedAt: now,
      },
    });
    
    const oneTime3PlusDogsPlan = await prisma.servicePlan.create({
      data: {
        id: uuidv4(),
        name: 'One-Time Service - 3+ Dogs',
        description: 'One-time service for 3 or more dogs',
        price: 75.00,
        duration: 1,
        type: 'ONE_TIME',
        isActive: true,
        stripePriceId: 'price_1RDxERQ8d6yK8uhzZu0OItnc',
        code: 'one-time-3',
        createdAt: now,
        updatedAt: now,
      },
    });
    
    const initialCleanupPlan = await prisma.servicePlan.create({
      data: {
        id: uuidv4(),
        name: 'Initial Cleanup',
        description: 'Initial cleanup fee for new customers (includes 1 service credit)',
        price: 32.00,
        duration: 1,
        type: 'INITIAL_CLEANUP',
        isActive: true,
        stripePriceId: 'price_1RDxERQ8d6yK8uhzdukcSTxA-cleanup',
        code: 'initial-cleanup',
        createdAt: now,
        updatedAt: now,
      },
    });
    
    console.log('✅ Service plans created with Stripe IDs');
    
    // Step 2: Create users
    console.log('👥 Creating users...');
    
    const adminPassword = await bcrypt.hash('Admin123!@#', 10);
    const admin = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'admin@scoopify.club',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        emailVerified: true,
        updatedAt: now,
      },
    });
    
    const customerPassword = await bcrypt.hash('Demo123!@#', 10);
    const customerUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'demo@example.com',
        password: customerPassword,
        firstName: 'Demo',
        lastName: 'Customer',
        role: 'CUSTOMER',
        emailVerified: true,
        updatedAt: now,
      },
    });
    
    const employeePassword = await bcrypt.hash('Employee123!@#', 10);
    const employeeUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'employee@scoopify.club',
        password: employeePassword,
        firstName: 'Demo',
        lastName: 'Employee',
        role: 'EMPLOYEE',
        emailVerified: true,
        updatedAt: now,
      },
    });
    
    console.log('✅ Users created');
    
    // Step 3: Create customer and employee profiles
    console.log('👤 Creating profiles...');
    
    const customer = await prisma.customer.create({
      data: {
        id: uuidv4(),
        userId: customerUser.id,
        phone: '555-0123',
        referralCode: 'DEMO123',
        updatedAt: now,
      },
    });
    
    const employee = await prisma.employee.create({
      data: {
        id: uuidv4(),
        userId: employeeUser.id,
        phone: '555-0124',
        status: 'ACTIVE',
        hasSetServiceArea: true,
        updatedAt: now,
      },
    });
    
    console.log('✅ Profiles created');
    
    // Step 4: Create address and service areas
    console.log('📍 Creating addresses and service areas...');
    
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
    
    await prisma.coverageArea.create({
      data: {
        id: uuidv4(),
        employeeId: employee.id,
        zipCode: '12345',
        travelDistance: 20,
        active: true,
        updatedAt: now,
      },
    });
    
    console.log('✅ Addresses and service areas created');
    
    // Step 5: Create test services
    console.log('🔧 Creating test services...');
    
    await prisma.service.create({
      data: {
        id: uuidv4(),
        customerId: customer.id,
        status: 'SCHEDULED',
        scheduledDate: now,
        servicePlanId: initialCleanupPlan.id,
        potentialEarnings: 69.0 * 0.5,
        paymentStatus: 'PAID',
        workflowStatus: 'AVAILABLE',
        createdAt: now,
        updatedAt: now,
      },
    });
    
    console.log('✅ Test services created');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('📧 Admin:', admin.email);
    console.log('👤 Customer:', customerUser.email);
    console.log('👷 Employee:', employeeUser.email);
    console.log('💳 Service Plans:', '6 plans created with Stripe IDs');
    console.log('\n🔑 Demo Account Credentials:');
    console.log('Admin: admin@scoopify.club / Admin123!@#');
    console.log('Customer: demo@example.com / Demo123!@#');
    console.log('Employee: employee@scoopify.club / Employee123!@#');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
