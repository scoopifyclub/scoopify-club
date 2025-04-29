const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    // Use the non-pooler URL as it's more direct for testing
    process.env.DATABASE_URL = "postgres://neondb_owner:npg_4Jp1QuMdbHzw@ep-wispy-firefly-a6dll41z.us-west-2.aws.neon.tech/neondb?sslmode=require";
    
    const prisma = new PrismaClient();
    
    try {
        console.log('Attempting to connect to the database...');
        console.log('Using URL:', process.env.DATABASE_URL);
        // Try to query something simple
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('Successfully connected to the database!');
        console.log('Test query result:', result);
        
        // Try to query a table
        console.log('\nTesting table access...');
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Successfully queried users table:', users);
        
    } catch (error) {
        console.error('Failed to connect to the database:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection(); 