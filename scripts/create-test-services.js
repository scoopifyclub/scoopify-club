import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function createTestServices() {
  try {
    console.log('🚀 Creating test services...');

    // First, let's check if we have any customers
    const customers = await prisma.customer.findMany({
      include: {
        user: true,
        address: true
      },
      take: 5
    });

    if (customers.length === 0) {
      console.log('❌ No customers found. Please create some customers first.');
      return;
    }

    console.log(`📋 Found ${customers.length} customers`);

    // Create some test services
    const testServices = [
      {
        servicePlanId: 'weekly-1',
        status: 'PENDING',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        potentialEarnings: 3750, // $37.50 (75% of $50)
        notes: 'Test weekly service for 1 dog'
      },
      {
        servicePlanId: 'weekly-2',
        status: 'SCHEDULED',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        potentialEarnings: 4500, // $45.00 (75% of $60)
        notes: 'Test weekly service for 2 dogs'
      },
      {
        servicePlanId: 'one-time-1',
        status: 'PENDING',
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        potentialEarnings: 3750, // $37.50 (75% of $50)
        notes: 'Test one-time service for 1 dog'
      }
    ];

    let createdCount = 0;

    for (const serviceData of testServices) {
      // Pick a random customer
      const customer = customers[Math.floor(Math.random() * customers.length)];
      
      // Check if this customer already has a service with this plan
      const existingService = await prisma.service.findFirst({
        where: {
          customerId: customer.id,
          servicePlanId: serviceData.servicePlanId,
          status: {
            in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS']
          }
        }
      });

      if (existingService) {
        console.log(`⚠️  Customer ${customer.user.name} already has a ${serviceData.servicePlanId} service`);
        continue;
      }

      // Create the service
      const service = await prisma.service.create({
        data: {
          id: crypto.randomUUID(),
          customerId: customer.id,
          servicePlanId: serviceData.servicePlanId,
          status: serviceData.status,
          scheduledDate: serviceData.scheduledDate,
          potentialEarnings: serviceData.potentialEarnings,
          notes: serviceData.notes,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Created service for ${customer.user.name}: ${serviceData.servicePlanId} - $${(serviceData.potentialEarnings / 100).toFixed(2)}`);
      createdCount++;
    }

    console.log(`🎉 Successfully created ${createdCount} test services!`);
    
    // Show summary
    const totalServices = await prisma.service.count();
    const pendingServices = await prisma.service.count({
      where: { status: 'PENDING' }
    });
    const scheduledServices = await prisma.service.count({
      where: { status: 'SCHEDULED' }
    });

    console.log('\n📊 Database Summary:');
    console.log(`Total Services: ${totalServices}`);
    console.log(`Pending: ${pendingServices}`);
    console.log(`Scheduled: ${scheduledServices}`);

  } catch (error) {
    console.error('❌ Error creating test services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestServices();
