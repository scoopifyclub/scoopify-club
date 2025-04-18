import { PrismaClient, ServiceStatus, ServiceType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function setupTestService() {
  try {
    // Create test customer
    const customerPassword = await hash('Customer123!', 12);
    const customer = await prisma.user.create({
      data: {
        email: 'testcustomer@scoopify.com',
        password: customerPassword,
        role: 'CUSTOMER',
        name: 'Test Customer',
        customer: {
          create: {
            email: 'testcustomer@scoopify.com',
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
      },
      include: {
        customer: true
      }
    });

    // Create service plan
    const servicePlan = await prisma.servicePlan.create({
      data: {
        name: 'Test Service Plan',
        description: 'Test service plan for employee workflow testing',
        price: 50.00,
        duration: 60,
        type: ServiceType.REGULAR,
        isActive: true
      }
    });

    // Create test service
    const service = await prisma.service.create({
      data: {
        customerId: customer.customer!.id,
        status: ServiceStatus.SCHEDULED,
        scheduledDate: new Date(),
        servicePlanId: servicePlan.id
      }
    });

    console.log('✅ Test service created:', service.id);
    console.log('Test customer created:', customer.email);
    return { customer, service };
  } catch (error) {
    console.error('❌ Error setting up test service:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestService(); 