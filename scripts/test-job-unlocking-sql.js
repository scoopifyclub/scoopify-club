import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🧪 Testing Job Unlocking System (SQL Version)');
console.log('=============================================\n');

async function testJobUnlockingSQL() {
    try {
        console.log('📋 Test 1: Check Current Job Locking Status');
        console.log('===========================================');

        // Get all services for today using raw SQL
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const todaysServices = await prisma.$queryRaw`
            SELECT 
                id, 
                status, 
                "isLocked", 
                "unlockedAt", 
                "scheduledDate", 
                "employeeId"
            FROM "Service" 
            WHERE "scheduledDate" >= ${startOfDay} 
            AND "scheduledDate" <= ${endOfDay}
        `;

        console.log(`Found ${todaysServices.length} services scheduled for today`);
        
        const lockedJobs = todaysServices.filter(s => s.isLocked);
        const unlockedJobs = todaysServices.filter(s => !s.isLocked);
        const claimedJobs = todaysServices.filter(s => s.employeeId);

        console.log(`🔒 Locked jobs: ${lockedJobs.length}`);
        console.log(`🔓 Unlocked jobs: ${unlockedJobs.length}`);
        console.log(`👤 Claimed jobs: ${claimedJobs.length}`);

        if (lockedJobs.length > 0) {
            console.log('\nLocked jobs:');
            lockedJobs.forEach(job => {
                console.log(`  - ${job.id} (${job.status}) - Scheduled: ${new Date(job.scheduledDate).toLocaleTimeString()}`);
            });
        }

        if (unlockedJobs.length > 0) {
            console.log('\nUnlocked jobs:');
            unlockedJobs.forEach(job => {
                console.log(`  - ${job.id} (${job.status}) - Unlocked: ${job.unlockedAt ? new Date(job.unlockedAt).toLocaleTimeString() : 'Unknown'}`);
            });
        }

        console.log('\n📋 Test 2: Simulate 8 AM Job Unlocking');
        console.log('=======================================');

        // Simulate unlocking jobs using raw SQL
        const unlockResult = await prisma.$executeRaw`
            UPDATE "Service" 
            SET "isLocked" = false, "unlockedAt" = ${new Date()}
            WHERE status = 'SCHEDULED' 
            AND "isLocked" = true 
            AND "scheduledDate" >= ${startOfDay} 
            AND "scheduledDate" <= ${endOfDay}
            AND "employeeId" IS NULL
        `;

        console.log(`🔓 Unlocked jobs (affected rows: ${unlockResult})`);

        // Verify the unlock worked
        const afterUnlock = await prisma.$queryRaw`
            SELECT 
                id, 
                "isLocked", 
                "unlockedAt", 
                "employeeId"
            FROM "Service" 
            WHERE "scheduledDate" >= ${startOfDay} 
            AND "scheduledDate" <= ${endOfDay}
        `;

        const stillLocked = afterUnlock.filter(s => s.isLocked);
        const nowUnlocked = afterUnlock.filter(s => !s.isLocked && !s.employeeId);

        console.log(`✅ Still locked: ${stillLocked.length}`);
        console.log(`✅ Now unlocked: ${nowUnlocked.length}`);

        console.log('\n📋 Test 3: Test Job Availability Logic');
        console.log('=======================================');

        // Test the availability logic using raw SQL
        const availableJobs = await prisma.$queryRaw`
            SELECT 
                s.id,
                s.status,
                s."scheduledDate",
                c.name as customer_name,
                a."zipCode" as customer_zip
            FROM "Service" s
            LEFT JOIN "Customer" c ON s."customerId" = c.id
            LEFT JOIN "Address" a ON c.id = a."customerId"
            WHERE s.status = 'SCHEDULED'
            AND s."employeeId" IS NULL
            AND s."isLocked" = false
            AND s."scheduledDate" >= ${startOfDay}
            AND s."scheduledDate" <= ${endOfDay}
        `;

        console.log(`📋 Available jobs for claiming: ${availableJobs.length}`);

        if (availableJobs.length > 0) {
            console.log('\nAvailable jobs:');
            availableJobs.forEach(job => {
                console.log(`  - ${job.id} - Customer: ${job.customer_name || 'Unknown'} - Address: ${job.customer_zip || 'N/A'}`);
            });
        }

        console.log('\n📋 Test 4: Test Job Claiming Logic');
        console.log('===================================');

        // Test claiming a job using raw SQL
        if (availableJobs.length > 0) {
            const testJob = availableJobs[0];
            console.log(`Testing claim for job: ${testJob.id}`);

            // Simulate claiming
            const claimResult = await prisma.$executeRaw`
                UPDATE "Service" 
                SET "employeeId" = 'test-employee-id', 
                    status = 'ASSIGNED', 
                    "claimedAt" = ${new Date()}
                WHERE id = ${testJob.id}
            `;

            console.log(`✅ Successfully claimed job: ${testJob.id} (affected rows: ${claimResult})`);

            // Verify it's no longer available
            const stillAvailable = await prisma.$queryRaw`
                SELECT id FROM "Service" 
                WHERE status = 'SCHEDULED'
                AND "employeeId" IS NULL
                AND "isLocked" = false
                AND "scheduledDate" >= ${startOfDay}
                AND "scheduledDate" <= ${endOfDay}
            `;

            console.log(`📋 Remaining available jobs: ${stillAvailable.length}`);
        } else {
            console.log('⚠️  No jobs available for testing claiming');
        }

        console.log('\n📋 Test 5: System Logs');
        console.log('======================');

        // Check system logs for job operations
        const recentLogs = await prisma.$queryRaw`
            SELECT 
                type,
                message,
                "createdAt"
            FROM "SystemLog" 
            WHERE type IN ('JOB_UNLOCK', 'JOB_CLAIM')
            AND "createdAt" >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
            ORDER BY "createdAt" DESC
            LIMIT 10
        `;

        console.log(`📝 Recent job-related logs: ${recentLogs.length}`);

        recentLogs.forEach(log => {
            console.log(`  - ${log.type}: ${log.message} (${new Date(log.createdAt).toLocaleTimeString()})`);
        });

        console.log('\n🎉 Job Unlocking System Test Complete!');
        console.log('\n📊 Summary:');
        console.log(`  - Total jobs today: ${todaysServices.length}`);
        console.log(`  - Jobs unlocked: ${unlockResult}`);
        console.log(`  - Available for claiming: ${availableJobs.length}`);
        console.log(`  - System logs: ${recentLogs.length}`);

        console.log('\n🔧 Next Steps:');
        console.log('  1. Fix Prisma client generation');
        console.log('  2. Update job creation to set isLocked: true');
        console.log('  3. Test the 8 AM cron job');
        console.log('  4. Update employee dashboard UI');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testJobUnlockingSQL(); 