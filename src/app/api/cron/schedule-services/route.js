import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { endOfDay, startOfDay, setHours, format } from 'date-fns';
export async function POST(request) {
    try {
        // Get API key from request header for authorization
        const apiKey = request.headers.get('x-api-key');
        if (apiKey !== process.env.CRON_API_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const results = {
            rescheduled: 0,
            scheduled: 0,
            errors: []
        };
        // Step 1: Handle unclaimed services from previous day
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const unclaimedServices = await prisma.service.findMany({
            where: {
                status: 'SCHEDULED',
                employeeId: null,
                scheduledDate: {
                    lt: endOfDay(yesterday)
                }
            }
        });
        // Reschedule unclaimed services to today at 7am
        const today = new Date();
        const sevenAM = setHours(startOfDay(today), 7);
        for (const service of unclaimedServices) {
            try {
                await prisma.service.update({
                    where: { id: service.id },
                    data: {
                        scheduledDate: sevenAM,
                        notes: service.notes
                            ? `${service.notes}\nRescheduled from ${format(service.scheduledDate, 'MM/dd/yyyy')} (unclaimed)`
                            : `Rescheduled from ${format(service.scheduledDate, 'MM/dd/yyyy')} (unclaimed)`
                    }
                });
                results.rescheduled++;
            }
            catch (error) {
                console.error(`Error rescheduling service ${service.id}:`, error);
                results.errors.push(`Failed to reschedule service ${service.id}`);
            }
        }
        // Step 2: Schedule new services based on customer preferences
        // Get all active customers with preferred service day
        const customers = await prisma.customer.findMany({
            where: {
                serviceDay: { not: null },
                subscription: {
                    status: 'ACTIVE'
                }
            },
            include: {
                subscription: {
                    include: {
                        plan: true
                    }
                }
            }
        });
        // Get the current day of week
        const currentDayOfWeek = format(today, 'EEEE');
        // Schedule services for customers whose service day is today
        for (const customer of customers) {
            try {
                // Only schedule if today is the customer's preferred day
                if (customer.serviceDay === currentDayOfWeek) {
                    // Check if a service is already scheduled for today
                    const existingService = await prisma.service.findFirst({
                        where: {
                            customerId: customer.id,
                            scheduledDate: {
                                gte: startOfDay(today),
                                lt: endOfDay(today)
                            }
                        }
                    });
                    if (!existingService) {
                        // Create a new service for this customer
                        await prisma.service.create({
                            data: {
                                customerId: customer.id,
                                status: 'SCHEDULED',
                                scheduledDate: sevenAM, // Schedule for 7 AM today
                                servicePlanId: customer.subscription.planId,
                                availableUntil: setHours(startOfDay(today), 19) // Available until 7 PM
                            }
                        });
                        results.scheduled++;
                    }
                }
            }
            catch (error) {
                console.error(`Error scheduling service for customer ${customer.id}:`, error);
                results.errors.push(`Failed to schedule service for customer ${customer.id}`);
            }
        }
        return NextResponse.json(Object.assign({ message: 'Service scheduling completed' }, results));
    }
    catch (error) {
        console.error('Error in service scheduling:', error);
        return NextResponse.json({ error: 'Failed to process service scheduling' }, { status: 500 });
    }
}
