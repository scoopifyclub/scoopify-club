import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function createServicePlans() {
  try {
    console.log('🚀 Creating service plans...');

    const servicePlans = [
      {
        id: 'weekly-1',
        name: 'Weekly Service - 1 Dog',
        description: 'Weekly yard cleanup service for households with 1 dog',
        price: 50.00,
        duration: 30,
        type: 'weekly'
      },
      {
        id: 'weekly-2',
        name: 'Weekly Service - 2 Dogs',
        description: 'Weekly yard cleanup service for households with 2 dogs',
        price: 60.00,
        duration: 45,
        type: 'weekly'
      },
      {
        id: 'weekly-3',
        name: 'Weekly Service - 3+ Dogs',
        description: 'Weekly yard cleanup service for households with 3 or more dogs',
        price: 75.00,
        duration: 60,
        type: 'weekly'
      },
      {
        id: 'one-time-1',
        name: 'One-Time Service - 1 Dog',
        description: 'Single yard cleanup service for households with 1 dog',
        price: 50.00,
        duration: 30,
        type: 'one-time'
      },
      {
        id: 'one-time-2',
        name: 'One-Time Service - 2 Dogs',
        description: 'Single yard cleanup service for households with 2 dogs',
        price: 60.00,
        duration: 45,
        type: 'one-time'
      },
      {
        id: 'one-time-3',
        name: 'One-Time Service - 3+ Dogs',
        description: 'Single yard cleanup service for households with 3 or more dogs',
        price: 75.00,
        duration: 60,
        type: 'one-time'
      }
    ];

    let createdCount = 0;

    for (const planData of servicePlans) {
      // Check if plan already exists
      const existingPlan = await prisma.servicePlan.findUnique({
        where: { id: planData.id }
      });

      if (existingPlan) {
        console.log(`⚠️  Service plan ${planData.id} already exists`);
        continue;
      }

      // Create the service plan
      const plan = await prisma.servicePlan.create({
        data: {
          id: planData.id,
          name: planData.name,
          description: planData.description,
          price: planData.price,
          duration: planData.duration,
          type: planData.type,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Created service plan: ${plan.name} - $${plan.price}`);
      createdCount++;
    }

    console.log(`🎉 Successfully created ${createdCount} service plans!`);
    
    // Show summary
    const totalPlans = await prisma.servicePlan.count();
    console.log(`\n📊 Total service plans in database: ${totalPlans}`);

  } catch (error) {
    console.error('❌ Error creating service plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createServicePlans();
