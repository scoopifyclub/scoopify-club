import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function addServicePlans() {
  try {
    console.log('Adding service plans...');

    // Delete existing services first to avoid foreign key constraints
    await prisma.service.deleteMany();
    console.log('Deleted existing services');
    
    // Delete existing plans
    await prisma.servicePlan.deleteMany();
    console.log('Deleted existing service plans');

    const now = new Date();

    // Create service plans based on dog count
    const servicePlans = [
      {
        id: uuidv4(),
        name: 'Small Yard (1-2 dogs)',
        description: 'Perfect for small yards with 1-2 dogs. Weekly maintenance to keep your yard clean.',
        price: 79.99,
        duration: 20,
        type: 'SMALL_YARD',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Medium Yard (3-4 dogs)',
        description: 'Ideal for medium yards with 3-4 dogs. More frequent attention to high-traffic areas.',
        price: 99.99,
        duration: 30,
        type: 'MEDIUM_YARD',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Large Yard (5+ dogs)',
        description: 'For large yards with 5+ dogs. Comprehensive coverage and extra attention to detail.',
        price: 129.99,
        duration: 45,
        type: 'LARGE_YARD',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Initial Cleanup',
        description: 'One-time deep cleaning to prepare your yard for weekly maintenance. Required for all new customers.',
        price: 89.00,
        duration: 60,
        type: 'INITIAL_CLEANUP',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
    ];

    for (const plan of servicePlans) {
      await prisma.servicePlan.create({
        data: plan
      });
      console.log(`Created plan: ${plan.name} - $${plan.price}/month`);
    }

    console.log('✅ Service plans created successfully!');
    console.log('\nPlan Structure:');
    console.log('- Initial Cleanup: $89 (one-time, separate from monthly)');
    console.log('- Small Yard: $79.99/month (4 weekly credits)');
    console.log('- Medium Yard: $99.99/month (4 weekly credits)');
    console.log('- Large Yard: $129.99/month (4 weekly credits)');
    console.log('\nTotal for new customers: Initial Cleanup ($89) + Monthly Plan ($79.99-$129.99)');

  } catch (error) {
    console.error('Error creating service plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addServicePlans();
