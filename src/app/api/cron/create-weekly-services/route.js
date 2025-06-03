import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        // Verify this is a cron request
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        console.log(`[CRON] Creating weekly services for ${today.toDateString()}`);

        // Get all active customers with subscriptions
        const customers = await prisma.customer.findMany({
            where: {
                subscription: {
                    status: 'ACTIVE'
                },
                serviceDay: {
                    not: null
                }
            },
            include: {
                subscription: {
                    include: {
                        plan: true
                    }
                },
                address: true,
                user: true
            }
        });

        console.log(`[CRON] Found ${customers.length} active customers with subscriptions`);

        let servicesCreated = 0;
        const errors = [];

        for (const customer of customers) {
            try {
                // Convert service day to day number (0 = Sunday, 1 = Monday, etc.)
                const getDayNumber = (dayName) => {
                    const days = {
                        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
                        'Thursday': 4, 'Friday': 5, 'Saturday': 6
                    };
                    return days[dayName] || 1; // Default to Monday
                };

                const targetDayOfWeek = getDayNumber(customer.serviceDay);
                
                // Find the next occurrence of the customer's service day
                let nextServiceDate = new Date(today);
                while (nextServiceDate.getDay() !== targetDayOfWeek) {
                    nextServiceDate.setDate(nextServiceDate.getDate() + 1);
                }
                
                // If the next service day is today, create the service
                if (nextServiceDate.toDateString() === today.toDateString()) {
                    // Check if service already exists for today
                    const existingService = await prisma.service.findFirst({
                        where: {
                            customerId: customer.id,
                            scheduledDate: {
                                gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                                lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
                            }
                        }
                    });

                    if (!existingService) {
                        // Set service time to 8 AM
                        const serviceDateTime = new Date(today);
                        serviceDateTime.setHours(8, 0, 0, 0);

                        // Create the service
                        const service = await prisma.service.create({
                            data: {
                                customerId: customer.id,
                                scheduledDate: serviceDateTime,
                                status: 'SCHEDULED',
                                serviceType: customer.subscription.planId || 'Pet Waste Cleanup'
                            }
                        });

                        servicesCreated++;
                        console.log(`[CRON] Created service ${service.id} for customer ${customer.user.name} on ${serviceDateTime.toDateString()}`);
                    } else {
                        console.log(`[CRON] Service already exists for customer ${customer.user.name} on ${today.toDateString()}`);
                    }
                }
            } catch (error) {
                console.error(`[CRON] Error creating service for customer ${customer.id}:`, error);
                errors.push({
                    customerId: customer.id,
                    customerName: customer.user.name,
                    error: error.message
                });
            }
        }

        console.log(`[CRON] Created ${servicesCreated} new services`);

        return NextResponse.json({
            success: true,
            servicesCreated,
            customersProcessed: customers.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('[CRON] Error in create-weekly-services:', error);
        return NextResponse.json(
            { error: 'Failed to create weekly services', details: error.message },
            { status: 500 }
        );
    }
} 