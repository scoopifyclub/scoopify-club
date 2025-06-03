const prisma = require('./lib/prisma');

async function testAdminStatsFix() {
    console.log('🔍 Testing Prisma relationships after fixes...\n');
    
    try {
        // Test 1: Basic Service query
        console.log('1. Testing basic Service query...');
        const services = await prisma.service.findMany({
            take: 1
        });
        console.log(`✅ Found ${services.length} services`);
        
        // Test 2: Service with Customer relationship  
        console.log('\n2. Testing Service -> Customer -> User relationship...');
        const serviceWithCustomer = await prisma.service.findFirst({
            include: {
                customer: {
                    include: {
                        User: true  // Capital U
                    }
                }
            }
        });
        console.log('✅ Service with Customer relationship works');
        if (serviceWithCustomer?.customer?.User) {
            console.log(`   Customer name: ${serviceWithCustomer.customer.User.name}`);
        }
        
        // Test 3: Service with Employee relationship
        console.log('\n3. Testing Service -> Employee -> User relationship...');
        const serviceWithEmployee = await prisma.service.findFirst({
            where: {
                employeeId: { not: null }
            },
            include: {
                employee: {
                    include: {
                        User: true  // Capital U
                    }
                }
            }
        });
        console.log('✅ Service with Employee relationship works');
        if (serviceWithEmployee?.employee?.User) {
            console.log(`   Employee name: ${serviceWithEmployee.employee.User.name}`);
        }
        
        // Test 4: Count operations
        console.log('\n4. Testing count operations...');
        const [customerCount, employeeCount, serviceCount] = await Promise.all([
            prisma.customer.count(),
            prisma.employee.count(),
            prisma.service.count()
        ]);
        console.log(`✅ Customers: ${customerCount}, Employees: ${employeeCount}, Services: ${serviceCount}`);
        
        // Test 5: GroupBy operations
        console.log('\n5. Testing groupBy operations...');
        const servicesByStatus = await prisma.service.groupBy({
            by: ['status'],
            _count: true
        });
        console.log('✅ Service status groupBy works');
        servicesByStatus.forEach(group => {
            console.log(`   ${group.status}: ${group._count} services`);
        });
        
        const employeesByStatus = await prisma.employee.groupBy({
            by: ['status'],
            _count: true
        });
        console.log('✅ Employee status groupBy works');
        employeesByStatus.forEach(group => {
            console.log(`   ${group.status}: ${group._count} employees`);
        });
        
        console.log('\n🎉 All Prisma relationship tests passed!');
        console.log('The admin stats API should now work correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAdminStatsFix(); 