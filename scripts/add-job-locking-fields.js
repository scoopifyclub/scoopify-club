import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🔧 Adding Job Locking Fields to Service Table');
console.log('=============================================\n');

async function addJobLockingFields() {
    try {
        console.log('📋 Step 1: Adding isLocked field...');
        
        // Add isLocked field with default true
        await prisma.$executeRaw`
            ALTER TABLE "Service" 
            ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN DEFAULT true
        `;
        console.log('✅ Added isLocked field');

        console.log('\n📋 Step 2: Adding unlockedAt field...');
        
        // Add unlockedAt field
        await prisma.$executeRaw`
            ALTER TABLE "Service" 
            ADD COLUMN IF NOT EXISTS "unlockedAt" TIMESTAMP
        `;
        console.log('✅ Added unlockedAt field');

        console.log('\n📋 Step 3: Adding lockExpiresAt field...');
        
        // Add lockExpiresAt field
        await prisma.$executeRaw`
            ALTER TABLE "Service" 
            ADD COLUMN IF NOT EXISTS "lockExpiresAt" TIMESTAMP
        `;
        console.log('✅ Added lockExpiresAt field');

        console.log('\n📋 Step 4: Adding index for isLocked...');
        
        // Add index for isLocked field
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "Service_isLocked_idx" ON "Service"("isLocked")
        `;
        console.log('✅ Added isLocked index');

        console.log('\n📋 Step 5: Setting existing services to unlocked...');
        
        // Set all existing services to unlocked (for testing)
        const updateResult = await prisma.service.updateMany({
            where: {
                isLocked: true
            },
            data: {
                isLocked: false,
                unlockedAt: new Date()
            }
        });
        
        console.log(`✅ Updated ${updateResult.count} existing services to unlocked`);

        console.log('\n📋 Step 6: Verifying the changes...');
        
        // Verify the fields were added
        const sampleService = await prisma.service.findFirst({
            select: {
                id: true,
                isLocked: true,
                unlockedAt: true,
                lockExpiresAt: true
            }
        });

        if (sampleService) {
            console.log('✅ Sample service data:');
            console.log(`  - ID: ${sampleService.id}`);
            console.log(`  - isLocked: ${sampleService.isLocked}`);
            console.log(`  - unlockedAt: ${sampleService.unlockedAt}`);
            console.log(`  - lockExpiresAt: ${sampleService.lockExpiresAt}`);
        }

        console.log('\n🎉 Job locking fields added successfully!');
        console.log('\n📊 Summary:');
        console.log('  - Added isLocked field (default: true)');
        console.log('  - Added unlockedAt field');
        console.log('  - Added lockExpiresAt field');
        console.log('  - Added isLocked index');
        console.log('  - Updated existing services to unlocked');

    } catch (error) {
        console.error('❌ Error adding job locking fields:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addJobLockingFields(); 