import { NextResponse } from 'next/server';
import { requireCronOrAdmin } from '@/lib/cron-auth';
import { prisma } from '@/lib/prisma';
import { sendServiceReminderEmail } from '@/lib/unified-email-service';

export async function POST(request) {
    try {
        const auth = await requireCronOrAdmin(request);
        if (!auth.ok) return auth.response;

        console.log('🕐 Starting service reminder email job...');

        // Get services scheduled for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        const servicesDueTomorrow = await prisma.service.findMany({
            where: {
                scheduledDate: {
                    gte: tomorrow,
                    lt: dayAfterTomorrow
                },
                status: 'SCHEDULED',
                workflowStatus: 'CLAIMED'
            },
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                email: true,
                                name: true
                            }
                        }
                    }
                },
                servicePlan: {
                    select: {
                        name: true,
                        creditsRequired: true
                    }
                }
            }
        });

        console.log(`📧 Found ${servicesDueTomorrow.length} services due tomorrow`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        // Send reminder emails for each service
        for (const service of servicesDueTomorrow) {
            try {
                const result = await sendServiceReminderEmail(service);
                
                if (result.success) {
                    successCount++;
                    console.log(`✅ Reminder sent to ${service.customer.user.email} for service on ${service.scheduledDate.toLocaleDateString()}`);
                } else {
                    errorCount++;
                    console.error(`❌ Failed to send reminder to ${service.customer.user.email}: ${result.error}`);
                }
                
                results.push({
                    serviceId: service.id,
                    customerEmail: service.customer.user.email,
                    scheduledDate: service.scheduledDate,
                    success: result.success,
                    error: result.error
                });

            } catch (error) {
                errorCount++;
                console.error(`❌ Error sending reminder for service ${service.id}:`, error);
                results.push({
                    serviceId: service.id,
                    customerEmail: service.customer.user.email,
                    scheduledDate: service.scheduledDate,
                    success: false,
                    error: error.message
                });
            }
        }

        console.log(`🎉 Service reminder job completed: ${successCount} successful, ${errorCount} failed`);

        return NextResponse.json({
            success: true,
            message: 'Service reminder emails sent',
            summary: {
                total: servicesDueTomorrow.length,
                successful: successCount,
                failed: errorCount
            },
            results: results
        });

    } catch (error) {
        console.error('💥 Error in service reminder job:', error);
        return NextResponse.json({
            success: false,
            error: 'Service reminder job failed',
            details: error.message
        }, { status: 500 });
    }
}
