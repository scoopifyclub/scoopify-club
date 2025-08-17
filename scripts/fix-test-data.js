import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTestData() {
  try {
    console.log('🔧 Fixing test data...');
    
    // First, let's check what customers exist
    const customers = await prisma.customer.findMany({
      include: {
        user: true,
        address: true
      }
    });
    
    console.log(`📊 Found ${customers.length} customers:`);
    customers.forEach(customer => {
      console.log(`- Customer ID: ${customer.id}`);
      console.log(`  User: ${customer.user?.firstName} ${customer.user?.lastName}`);
      console.log(`  Address: ${customer.address?.zipCode || 'No address'}`);
      console.log('---');
    });
    
    // Check if we have any customers in Matthew's coverage area (80927)
    const coloradoSpringsCustomers = customers.filter(c => 
      c.address?.zipCode?.startsWith('809')
    );
    
    if (coloradoSpringsCustomers.length === 0) {
      console.log('❌ No customers in Colorado Springs area. Creating test customer...');
      
      // Create a test customer in 80927
      const testCustomer = await prisma.customer.create({
        data: {
          id: crypto.randomUUID(),
          userId: (await prisma.user.findFirst({ where: { role: 'CUSTOMER' } }))?.id || 'test-user-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          address: {
            create: {
              id: crypto.randomUUID(),
              street: '123 Test Street',
              city: 'Colorado Springs',
              state: 'CO',
              zipCode: '80927',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        },
        include: {
          address: true,
          user: true
        }
      });
      
      console.log('✅ Created test customer:', testCustomer.id);
    }
    
    // Now let's create a test service in 80927
    const servicePlan = await prisma.servicePlan.findFirst();
    if (!servicePlan) {
      console.log('❌ No service plans found. Creating test plan...');
      await prisma.servicePlan.create({
        data: {
          id: 'test-weekly-1',
          name: 'Weekly Service - 1 Dog',
          description: 'Weekly pooper scooper service for 1 dog',
          price: 5000, // $50.00
          duration: 7,
          type: 'WEEKLY',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Create a test service in 80927
    const testService = await prisma.service.create({
      data: {
        id: crypto.randomUUID(),
        customerId: coloradoSpringsCustomers[0]?.id || 'test-customer-id',
        servicePlanId: servicePlan?.id || 'test-weekly-1',
        status: 'PENDING',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Created test service in 80927:', testService.id);
    
    // Verify the job pool API can find this service
    console.log('🔍 Testing job pool API...');
    
    // Get Matthew's employee ID
    const matthew = await prisma.employee.findFirst({
      where: {
        user: {
          firstName: 'Matthew'
        }
      },
      include: {
        serviceAreas: true
      }
    });
    
    if (matthew) {
      console.log(`👷 Matthew's coverage: ${matthew.serviceAreas.length} ZIP codes`);
      console.log(`   Includes 80927: ${matthew.serviceAreas.some(area => area.zipCode === '80927')}`);
      
      // Check if the service is in his coverage area
      const availableJobs = await prisma.service.findMany({
        where: {
          status: {
            in: ['PENDING', 'SCHEDULED']
          },
          employeeId: null,
          customer: {
            address: {
              zipCode: {
                in: matthew.serviceAreas.map(area => area.zipCode)
              }
            }
          }
        }
      });
      
      console.log(`📋 Available jobs in Matthew's area: ${availableJobs.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTestData();
