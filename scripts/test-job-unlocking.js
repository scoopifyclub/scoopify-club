import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🧪 Testing Job Unlocking System');
console.log('================================\n');

async function testJobUnlocking() {
    try {
        console.log('📋 Test 1: Check Current Job Locking Status');
        console.log('===========================================');

        // Get all services for today
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const todaysServices = await prisma.service.findMany({
            where: {
                scheduledDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            select: {
                id: true,
                status: true,
                isLocked: true,
                unlockedAt: true,
                scheduledDate: true,
                employeeId: true
            }
        });

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
                console.log(`  - ${job.id} (${job.status}) - Scheduled: ${job.scheduledDate.toLocaleTimeString()}`);
            });
        }

        if (unlockedJobs.length > 0) {
            console.log('\nUnlocked jobs:');
            unlockedJobs.forEach(job => {
                console.log(`  - ${job.id} (${job.status}) - Unlocked: ${job.unlockedAt?.toLocaleTimeString() || 'Unknown'}`);
            });
        }

        console.log('\n📋 Test 2: Simulate 8 AM Job Unlocking');
        console.log('=======================================');

        // Simulate unlocking jobs
        const unlockResult = await prisma.service.updateMany({
            where: {
                status: 'SCHEDULED',
                isLocked: true,
                scheduledDate: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                employeeId: null
            },
            data: {
                isLocked: false,
                unlockedAt: new Date()
            }
        });

        console.log(`🔓 Unlocked ${unlockResult.count} jobs`);

        // Verify the unlock worked
        const afterUnlock = await prisma.service.findMany({
            where: {
                scheduledDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            select: {
                id: true,
                isLocked: true,
                unlockedAt: true,
                employeeId: true
            }
        });

        const stillLocked = afterUnlock.filter(s => s.isLocked);
        const nowUnlocked = afterUnlock.filter(s => !s.isLocked && !s.employeeId);

        console.log(`✅ Still locked: ${stillLocked.length}`);
        console.log(`✅ Now unlocked: ${nowUnlocked.length}`);

        console.log('\n📋 Test 3: Test Job Availability API');
        console.log('=====================================');

        // Test the availability API logic
        const availableJobs = await prisma.service.findMany({
            where: {
                status: 'SCHEDULED',
                employeeId: null,
                isLocked: false,
                scheduledDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        address: true
                    }
                }
            }
        });

        console.log(`📋 Available jobs for claiming: ${availableJobs.length}`);

        if (availableJobs.length > 0) {
            console.log('\nAvailable jobs:');
            availableJobs.forEach(job => {
                console.log(`  - ${job.id} - Customer: ${job.customer.name} - Address: ${job.customer.address?.zipCode || 'N/A'}`);
            });
        }

        console.log('\n📋 Test 4: Test Job Claiming Logic');
        console.log('===================================');

        // Test claiming a job
        if (availableJobs.length > 0) {
            const testJob = availableJobs[0];
            console.log(`Testing claim for job: ${testJob.id}`);

            // Simulate claiming
            const claimedJob = await prisma.service.update({
                where: { id: testJob.id },
                data: {
                    employeeId: 'test-employee-id',
                    status: 'ASSIGNED',
                    claimedAt: new Date()
                }
            });

            console.log(`✅ Successfully claimed job: ${claimedJob.id}`);

            // Verify it's no longer available
            const stillAvailable = await prisma.service.findMany({
                where: {
                    status: 'SCHEDULED',
                    employeeId: null,
                    isLocked: false,
                    scheduledDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            });

            console.log(`📋 Remaining available jobs: ${stillAvailable.length}`);
        } else {
            console.log('⚠️  No jobs available for testing claiming');
        }

        console.log('\n📋 Test 5: System Logs');
        console.log('======================');

        // Check system logs for job operations
        const recentLogs = await prisma.systemLog.findMany({
            where: {
                category: {
                    in: ['JOB_UNLOCK', 'JOB_CLAIM']
                },
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        console.log(`📝 Recent job-related logs: ${recentLogs.length}`);

        recentLogs.forEach(log => {
            console.log(`  - ${log.category}: ${log.message} (${log.createdAt.toLocaleTimeString()})`);
        });

        console.log('\n🎉 Job Unlocking System Test Complete!');
        console.log('\n📊 Summary:');
        console.log(`  - Total jobs today: ${todaysServices.length}`);
        console.log(`  - Jobs unlocked: ${unlockResult.count}`);
        console.log(`  - Available for claiming: ${availableJobs.length}`);
        console.log(`  - System logs: ${recentLogs.length}`);

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testJobUnlocking(); 