const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const verifyDatabase = require('./verify-db');

async function testMigration() {
    const prisma = new PrismaClient();

    try {
        console.log('🚀 Starting migration test process...');

        // 1. Verify database connection
        const isConnected = await verifyDatabase();
        if (!isConnected) {
            process.exit(1);
        }

        // 2. Run migrations
        console.log('\n🔄 Running migrations...');
        try {
            execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        } catch (error) {
            console.error('❌ Migration deployment failed');
            process.exit(1);
        }

        // 3. Verify schema
        console.log('\n✅ Verifying schema...');
        await require('./verify-schema');

        // 4. Run basic data operations test
        console.log('\n🧪 Testing basic data operations...');
        await testBasicOperations(prisma);

        console.log('\n✨ Migration test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration test failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function testBasicOperations(prisma) {
    try {
        // Test user creation
        const user = await prisma.user.create({
            data: {
                email: 'test@migration.com',
                name: 'Test User',
                password: 'test-password',
                role: 'CUSTOMER'
            }
        });

        // Test user retrieval
        const retrievedUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!retrievedUser) {
            throw new Error('Failed to retrieve created user');
        }

        // Test user update
        await prisma.user.update({
            where: { id: user.id },
            data: { name: 'Updated Test User' }
        });

        // Test user deletion
        await prisma.user.delete({
            where: { id: user.id }
        });

        console.log('✅ Basic data operations successful');
    } catch (error) {
        console.error('❌ Data operations failed:', error.message);
        throw error;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testMigration().catch(error => {
        console.error('Migration test failed:', error);
        process.exit(1);
    });
} 