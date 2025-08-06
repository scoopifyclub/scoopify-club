import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🔧 Creating Test Services for Job Unlocking System');
console.log('==================================================\n');

async function createTestServices() {
    try {
        console.log('📋 Step 1: Check if we have customers and employees...');
        
        // Check for existing customers
        const customers = await prisma.$queryRaw`
            SELECT id, "userId" FROM "Customer" LIMIT 5
        `;
        
        console.log(`Found ${customers.length} customers`);

        // Check for existing employees
        const employees = await prisma.$queryRaw`
            SELECT id, "userId" FROM "Employee" LIMIT 5
        `;
        
        console.log(`Found ${employees.length} employees`);

        // Check for existing service plans
        const servicePlans = await prisma.$queryRaw`
            SELECT id, name FROM "ServicePlan" LIMIT 5
        `;
        
        console.log(`Found ${servicePlans.length} service plans`);

        if (customers.length === 0) {
            console.log('❌ No customers found. Creating test customer...');
            
            // Create a test user first
            const testUser = await prisma.$executeRaw`
                INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
                VALUES ('test-user-1', 'test@example.com', 'Test Customer', 'hashedpassword', 'CUSTOMER', NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            `;
            
            // Create a test customer
            const testCustomer = await prisma.$executeRaw`
                INSERT INTO "Customer" (id, "userId", "createdAt", "updatedAt")
                VALUES ('test-customer-1', 'test-user-1', NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            `;
            
            console.log('✅ Created test customer');
        }

        if (servicePlans.length === 0) {
            console.log('❌ No service plans found. Creating test service plan...');
            
            const testServicePlan = await prisma.$executeRaw`
                INSERT INTO "ServicePlan" (id, name, description, price, duration, type, "isActive", "createdAt", "updatedAt")
                VALUES ('test-plan-1', 'Basic Service', 'Basic yard cleanup', 50.00, 60, 'REGULAR', true, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            `;
            
            console.log('✅ Created test service plan');
        }

        console.log('\n📋 Step 2: Create test services for today...');
        
        // Get today's date and create services at different times
        const today = new Date();
        const serviceTimes = [
            new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),  // 9 AM
            new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0), // 10 AM
            new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0), // 11 AM
            new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0), // 2 PM
            new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0, 0), // 3 PM
        ];

        // Get the first customer and service plan
        const firstCustomer = await prisma.$queryRaw`
            SELECT id FROM "Customer" LIMIT 1
        `;
        
        const firstServicePlan = await prisma.$queryRaw`
            SELECT id FROM "ServicePlan" LIMIT 1
        `;

        if (firstCustomer.length === 0 || firstServicePlan.length === 0) {
            console.log('❌ Missing required data for creating services');
            return;
        }

        const customerId = firstCustomer[0].id;
        const servicePlanId = firstServicePlan[0].id;

        console.log(`Using customer: ${customerId}`);
        console.log(`Using service plan: ${servicePlanId}`);

        // Create test services
        for (let i = 0; i < serviceTimes.length; i++) {
            const serviceTime = serviceTimes[i];
            const serviceId = `test-service-${i + 1}`;
            
            const result = await prisma.$executeRaw`
                INSERT INTO "Service" (
                    id, 
                    "customerId", 
                    "servicePlanId", 
                    status, 
                    "scheduledDate", 
                    "isLocked", 
                    "createdAt", 
                    "updatedAt"
                )
                VALUES (
                    ${serviceId},
                    ${customerId},
                    ${servicePlanId},
                    'SCHEDULED',
                    ${serviceTime},
                    true,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (id) DO NOTHING
            `;
            
            if (result > 0) {
                console.log(`✅ Created service ${serviceId} for ${serviceTime.toLocaleTimeString()}`);
            } else {
                console.log(`⚠️  Service ${serviceId} already exists`);
            }
        }

        console.log('\n📋 Step 3: Verify test services...');
        
        const testServices = await prisma.$queryRaw`
            SELECT 
                id, 
                status, 
                "isLocked", 
                "scheduledDate"
            FROM "Service" 
            WHERE id LIKE 'test-service-%'
            ORDER BY "scheduledDate"
        `;

        console.log(`Created ${testServices.length} test services:`);
        testServices.forEach(service => {
            console.log(`  - ${service.id}: ${service.status} (${service.isLocked ? '🔒 Locked' : '🔓 Unlocked'}) at ${new Date(service.scheduledDate).toLocaleTimeString()}`);
        });

        console.log('\n🎉 Test services created successfully!');
        console.log('\n📊 Summary:');
        console.log(`  - Test customers: ${customers.length > 0 ? customers.length : 1}`);
        console.log(`  - Test service plans: ${servicePlans.length > 0 ? servicePlans.length : 1}`);
        console.log(`  - Test services created: ${testServices.length}`);
        console.log('  - All services are locked by default');
        console.log('  - Ready for job unlocking tests');

    } catch (error) {
        console.error('❌ Error creating test services:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestServices(); 