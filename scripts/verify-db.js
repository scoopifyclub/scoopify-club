const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function verifyDatabase() {
    console.log('🔍 Verifying database configuration...');

    // Check environment variables
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not set in .env file');
        process.exit(1);
    }

    // Parse database URL
    try {
        const url = new URL(process.env.DATABASE_URL);
        console.log('📊 Database configuration:');
        console.log(`- Host: ${url.hostname}`);
        console.log(`- Port: ${url.port}`);
        console.log(`- Database: ${url.pathname.slice(1)}`);
        console.log(`- SSL: ${url.searchParams.has('sslmode')}`);
    } catch (error) {
        console.error('❌ Invalid DATABASE_URL format');
        process.exit(1);
    }

    // Test connection
    const prisma = new PrismaClient();
    try {
        console.log('\n🔌 Testing database connection...');
        await prisma.$connect();
        console.log('✅ Successfully connected to database');

        // Test query
        console.log('\n🧪 Testing simple query...');
        const result = await prisma.$queryRaw`SELECT version();`;
        console.log('✅ Query successful');
        console.log(`- PostgreSQL version: ${result[0].version}`);

        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        
        if (error.message.includes("Can't reach database server")) {
            console.log('\n🔧 Troubleshooting steps:');
            console.log('1. Check if the database server is running');
            console.log('2. Verify your IP is allowed in the database firewall');
            console.log('3. Check if the database credentials are correct');
            console.log('4. Verify SSL configuration if required');
        }
        
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    verifyDatabase().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = verifyDatabase; 