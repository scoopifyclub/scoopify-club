// Script to verify and fix Service model relationships
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting relation verification script...');
  
  try {
    // Force Prisma to recognize the schema changes by performing a simple query
    const serviceCount = await prisma.service.count();
    console.log(`Found ${serviceCount} services`);
    
    // Try to access one service with its relations to verify everything is working
    if (serviceCount > 0) {
      const testService = await prisma.service.findFirst({
        include: {
          customer: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          employee: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          servicePlan: true
        }
      });
      
      console.log('Successfully queried a service with its relations:');
      console.log(`Service ID: ${testService?.id}`);
      console.log(`Customer ID: ${testService?.customer?.id}`);
      console.log(`Employee ID: ${testService?.employee?.id}`);
      console.log(`Service Plan ID: ${testService?.servicePlan?.id}`);
    } else {
      console.log('No services found to test relations.');
    }
  } catch (error) {
    console.error('Error verifying relations:', error);
  }
  
  console.log('Relation verification completed');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 