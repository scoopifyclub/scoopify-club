import { PrismaClient, UserRole, CustomerStatus, ServiceStatus, PhotoType, PaymentStatus, PaymentMethod } from '@prisma/client';
import Stripe from 'stripe';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function testAuthentication() {
  try {
    // Create a test customer
    const hashedPassword = await hash('testpassword123', 10);
    const customer = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test Customer',
        role: UserRole.CUSTOMER,
        customer: {
          create: {
            email: 'test@example.com',
            phone: '555-0123',
            status: CustomerStatus.ACTIVE,
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
    console.log('✅ Test customer created:', customer.email);

    // Create a test employee
    const employee = await prisma.user.create({
      data: {
        email: 'employee@example.com',
        password: hashedPassword,
        name: 'Test Employee',
        role: UserRole.EMPLOYEE,
        employee: {
          create: {
            name: 'Test Employee',
            email: 'employee@example.com',
            phone: '555-0124',
            status: 'ACTIVE'
          }
        }
      },
      include: {
        employee: true
      }
    });
    console.log('✅ Test employee created:', employee.email);

    return { customer, employee };
  } catch (error) {
    console.error('❌ Error in testAuthentication:', error);
    throw error;
  }
}

async function testServiceScheduling(customerId: string) {
  try {
    const service = await prisma.service.create({
      data: {
        customerId: customerId,
        status: ServiceStatus.SCHEDULED,
        type: 'REGULAR',
        scheduledFor: new Date(),
        amount: 50.00,
        description: 'Test service'
      }
    });
    console.log('✅ Test service created:', service.id);
    return service;
  } catch (error) {
    console.error('❌ Error in testServiceScheduling:', error);
    throw error;
  }
}

async function testEmployeeAssignment(serviceId: string, employeeId: string) {
  try {
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        employeeId: employeeId,
        status: ServiceStatus.CLAIMED,
        claimedAt: new Date()
      }
    });
    console.log('✅ Service assigned to employee:', updatedService.id);
    return updatedService;
  } catch (error) {
    console.error('❌ Error in testEmployeeAssignment:', error);
    throw error;
  }
}

async function testPhotoUpload(serviceId: string) {
  try {
    const preCleanPhoto = await prisma.servicePhoto.create({
      data: {
        serviceId: serviceId,
        type: PhotoType.PRE_CLEAN,
        url: 'https://example.com/pre-clean.jpg'
      }
    });
    console.log('✅ Pre-clean photo uploaded');

    const postCleanPhoto = await prisma.servicePhoto.create({
      data: {
        serviceId: serviceId,
        type: PhotoType.POST_CLEAN,
        url: 'https://example.com/post-clean.jpg'
      }
    });
    console.log('✅ Post-clean photo uploaded');

    return { preCleanPhoto, postCleanPhoto };
  } catch (error) {
    console.error('❌ Error in testPhotoUpload:', error);
    throw error;
  }
}

async function testPaymentProcessing(serviceId: string) {
  try {
    const payment = await prisma.payment.create({
      data: {
        amount: 50.00,
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.CARD,
        date: new Date(),
        serviceId: serviceId
      }
    });
    console.log('✅ Payment processed:', payment.id);
    return payment;
  } catch (error) {
    console.error('❌ Error in testPaymentProcessing:', error);
    throw error;
  }
}

async function cleanupTestData(customerId: string) {
  try {
    // Delete all related records
    await prisma.servicePhoto.deleteMany({
      where: { service: { customerId: customerId } }
    });
    await prisma.payment.deleteMany({
      where: { service: { customerId: customerId } }
    });
    await prisma.service.deleteMany({
      where: { customerId: customerId }
    });
    await prisma.address.deleteMany({
      where: { customer: { userId: customerId } }
    });
    await prisma.customer.deleteMany({
      where: { userId: customerId }
    });
    await prisma.user.delete({
      where: { id: customerId }
    });
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Error in cleanupTestData:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting tests...');
    
    // Test authentication
    const { customer, employee } = await testAuthentication();
    
    // Test service scheduling
    const service = await testServiceScheduling(customer.customer!.id);
    
    // Test employee assignment
    await testEmployeeAssignment(service.id, employee.employee!.id);
    
    // Test photo upload
    await testPhotoUpload(service.id);
    
    // Test payment processing
    await testPaymentProcessing(service.id);
    
    // Clean up test data
    await cleanupTestData(customer.id);
    
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 