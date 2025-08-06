import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🔧 Adding Missing Service Columns');
console.log('==================================\n');

async function addMissingServiceColumns() {
    try {
        console.log('📋 Step 1: Adding claimedAt column...');
        await prisma.$executeRaw`
            ALTER TABLE "Service"
            ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP
        `;
        console.log('✅ Added claimedAt column');

        console.log('\n📋 Step 2: Adding arrivalDeadline column...');
        await prisma.$executeRaw`
            ALTER TABLE "Service"
            ADD COLUMN IF NOT EXISTS "arrivalDeadline" TIMESTAMP
        `;
        console.log('✅ Added arrivalDeadline column');

        console.log('\n📋 Step 3: Verifying the changes...');
        const sampleService = await prisma.$queryRaw`
            SELECT 
                id,
                "claimedAt",
                "arrivalDeadline",
                "isLocked",
                "unlockedAt"
            FROM "Service" 
            LIMIT 1
        `;

        if (sampleService.length > 0) {
            console.log('✅ Sample service data:');
            console.log(`  - ID: ${sampleService[0].id}`);
            console.log(`  - claimedAt: ${sampleService[0].claimedAt || 'NULL'}`);
            console.log(`  - arrivalDeadline: ${sampleService[0].arrivalDeadline || 'NULL'}`);
            console.log(`  - isLocked: ${sampleService[0].isLocked}`);
            console.log(`  - unlockedAt: ${sampleService[0].unlockedAt || 'NULL'}`);
        }

        console.log('\n🎉 Missing service columns added successfully!');
        console.log('\n📊 Summary:');
        console.log('  - Added claimedAt field');
        console.log('  - Added arrivalDeadline field');
        console.log('  - Verified existing job locking fields');

    } catch (error) {
        console.error('❌ Error adding missing service columns:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addMissingServiceColumns(); 