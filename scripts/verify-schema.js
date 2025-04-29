const { PrismaClient } = require('@prisma/client');

async function verifySchema() {
    const prisma = new PrismaClient();
    
    try {
        console.log('Verifying database connection...');
        await prisma.$connect();
        console.log('Database connection successful');

        console.log('Verifying schema...');
        // Try to query each model to verify schema
        const models = [
            'user',
            'customer',
            'employee',
            'service',
            'servicePlan',
            'serviceRating',
            'payment',
            'subscription',
            'notification',
            'refreshToken'
        ];

        for (const model of models) {
            console.log(`Verifying ${model} model...`);
            await prisma[model].findFirst();
            console.log(`${model} model verified`);
        }

        console.log('All models verified successfully');
        process.exit(0);
    } catch (error) {
        console.error('Schema verification failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifySchema(); 