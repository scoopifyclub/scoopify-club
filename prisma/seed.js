import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting database setup...');
    
    // Clean existing data
    await prisma.$transaction([
        prisma.service.deleteMany(),
        prisma.subscription.deleteMany(),
        prisma.customer.deleteMany(),
        prisma.employee.deleteMany(),
        prisma.user.deleteMany(),
        prisma.servicePlan.deleteMany(),
        prisma.address.deleteMany(),
        prisma.coverageArea.deleteMany(),
    ]);
    console.log('✅ Database cleaned');

    // Create service plans with Stripe IDs
    const servicePlans = await prisma.servicePlan.createMany({
        data: [
            // Monthly subscriptions
            {
                name: 'Single Dog',
                description: 'Weekly service for 1 dog',
                price: 55.00,
                type: 'MONTHLY',
                frequency: 'month',
                serviceCount: 4,
                stripePriceId: process.env.STRIPE_MONTHLY_1_DOG_PRICE_ID || null,
                features: ['Weekly service', '1 dog', '4 services per month']
            },
            {
                name: 'Two Dogs',
                description: 'Weekly service for 2 dogs',
                price: 70.00,
                type: 'MONTHLY',
                frequency: 'month',
                serviceCount: 4,
                stripePriceId: process.env.STRIPE_MONTHLY_2_DOGS_PRICE_ID || null,
                features: ['Weekly service', '2 dogs', '4 services per month']
            },
            {
                name: 'Three+ Dogs',
                description: 'Weekly service for 3+ dogs',
                price: 100.00,
                type: 'MONTHLY',
                frequency: 'month',
                serviceCount: 4,
                stripePriceId: process.env.STRIPE_MONTHLY_3_PLUS_DOGS_PRICE_ID || null,
                features: ['Weekly service', '3+ dogs', '4 services per month']
            },
            // One-time services
            {
                name: 'One-Time Service - 1 Dog',
                description: 'Single cleanup for 1 dog',
                price: 25.00,
                type: 'ONE_TIME',
                frequency: 'once',
                serviceCount: 1,
                stripePriceId: process.env.STRIPE_ONETIME_1_DOG_PRICE_ID || null,
                features: ['One-time cleanup', '1 dog', 'Single service']
            },
            {
                name: 'One-Time Service - 2 Dogs',
                description: 'Single cleanup for 2 dogs',
                price: 35.00,
                type: 'ONE_TIME',
                frequency: 'once',
                serviceCount: 1,
                stripePriceId: process.env.STRIPE_ONETIME_2_DOGS_PRICE_ID || null,
                features: ['One-time cleanup', '2 dogs', 'Single service']
            },
            {
                name: 'One-Time Service - 3+ Dogs',
                description: 'Single cleanup for 3+ dogs',
                price: 45.00,
                type: 'ONE_TIME',
                frequency: 'once',
                serviceCount: 1,
                stripePriceId: process.env.STRIPE_ONETIME_3_PLUS_DOGS_PRICE_ID || null,
                features: ['One-time cleanup', '3+ dogs', 'Single service']
            },
            // Initial cleanup
            {
                name: 'Initial Cleanup',
                description: 'One-time initial cleanup for new customers',
                price: 32.00,
                type: 'INITIAL_CLEANUP',
                isActive: true,
                stripePriceId: process.env.STRIPE_INITIAL_CLEANUP_PRICE_ID || null,
                code: 'initial-cleanup',
                features: ['Initial cleanup', 'One-time service', 'Required for new customers']
            }
        ]
    });
    console.log('✅ Service plans created');

    // Create users
    const admin = await prisma.user.create({
        data: {
            email: 'admin@scoopify.club',
            firstName: 'Admin',
            lastName: 'User',
            password: await bcrypt.hash('Admin123!@#', 12),
            role: 'ADMIN',
            emailVerified: true
        }
    });

    const customerUser = await prisma.user.create({
        data: {
            email: 'demo@example.com',
            firstName: 'Demo',
            lastName: 'Customer',
            password: await bcrypt.hash('Demo123!@#', 12),
            role: 'CUSTOMER',
            emailVerified: true
        }
    });

    const employeeUser = await prisma.user.create({
        data: {
            email: 'employee@scoopify.club',
            firstName: 'Demo',
            lastName: 'Employee',
            password: await bcrypt.hash('Employee123!@#', 12),
            role: 'EMPLOYEE',
            emailVerified: true
        }
    });
    console.log('✅ Users created');

    // Create profiles
    const customer = await prisma.customer.create({
        data: {
            userId: customerUser.id,
            name: `${customerUser.firstName} ${customerUser.lastName}`,
            phone: '(555) 123-4567',
            serviceCredits: 4,
            status: 'ACTIVE'
        }
    });

    const employee = await prisma.employee.create({
        data: {
            userId: employeeUser.id,
            name: `${employeeUser.firstName} ${employeeUser.lastName}`,
            phone: '(555) 987-6543',
            status: 'ACTIVE',
            hireDate: new Date('2023-01-15'),
            serviceAreas: {
                create: [
                    { zipCode: '80831', name: 'Peyton Area', active: true },
                    { zipCode: '80921', name: 'Colorado Springs East', active: true }
                ]
            }
        }
    });
    console.log('✅ Profiles created');

    // Create addresses and service areas
    const customerAddress = await prisma.address.create({
        data: {
            customerId: customer.id,
            street: '7525 Gallard Heights',
            city: 'Peyton',
            state: 'CO',
            zipCode: '80831',
            isDefault: true
        }
    });

    const employeeAddress = await prisma.address.create({
        data: {
            employeeId: employee.id,
            street: '7535 Gallard Heights',
            city: 'Peyton',
            state: 'CO',
            zipCode: '80831',
            isDefault: true
        }
    });
    console.log('✅ Addresses created');

    // Create test services
    const singleDogPlan = await prisma.servicePlan.findFirst({
        where: { name: 'Single Dog' }
    });

    if (singleDogPlan) {
        await prisma.service.create({
            data: {
                customerId: customer.id,
                servicePlanId: singleDogPlan.id,
                type: 'PET_WASTE_CLEANUP',
                status: 'SCHEDULED',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                potentialEarnings: 13.75 // $55 / 4 services
            }
        });
    }
    console.log('✅ Test services created');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('📧 Admin:', admin.email);
    console.log('👤 Customer:', customerUser.email);
    console.log('👷 Employee:', employeeUser.email);
    console.log('💳 Service Plans:', '7 plans created with Stripe IDs');
    console.log('\n🔑 Demo Account Credentials:');
    console.log('Admin: admin@scoopify.club / Admin123!@#');
    console.log('Customer: demo@example.com / Demo123!@#');
    console.log('Employee: employee@scoopify.club / Employee123!@#');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
