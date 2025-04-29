const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function verifyDatabaseConnection() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Verifying database connection...');
        
        // Try to connect to the database
        await prisma.$connect();
        console.log('✅ Successfully connected to database');
        
        // Try a simple query
        const result = await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Successfully executed test query');
        
        // Check if we can access the User table
        await prisma.user.count();
        console.log('✅ Successfully accessed User table');
        
        return true;
    } catch (error) {
        console.error('❌ Database verification failed:', error);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the verification if this script is run directly
if (require.main === module) {
    verifyDatabaseConnection()
        .then(success => {
            if (!success) {
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Error during database verification:', error);
            process.exit(1);
        });
}

module.exports = verifyDatabaseConnection; 