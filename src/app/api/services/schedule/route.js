import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { addDays, startOfDay, endOfDay, setHours } from 'date-fns';
export async function POST(request) {
    try {
        const { startDate, endDate } = await request.json();
        // Validate dates
        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
        }
        // First, handle unclaimed services from previous day
        const yesterday = addDays(new Date(), -1);
        const unclaimedServices = await prisma.service.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledDate: {
                    lt: endOfDay(yesterday)
                }
            }
        });
        // Reschedule unclaimed services to next available day
        if (unclaimedServices.length > 0) {
            const today = new Date();
            await prisma.$transaction(unclaimedServices.map(service => prisma.service.update({
                where: { id: service.id },
                data: {
                    scheduledDate: addDays(today, 1),
                    status: 'SCHEDULED',
                    notes: `Rescheduled from ${service.scheduledDate.toLocaleDateString()} (unclaimed)`
                }
            })));
        }
        // Get all active subscriptions with service day
        const subscriptions = await prisma.subscription.findMany({
            where: {
                status: 'ACTIVE',
                customer: {
                    serviceDay: { not: null }
                }
            },
            include: {
                customer: {
                    include: {
                        address: true
                    }
                }
            }
        });
        // Get the default service plan for regular services
        const defaultServicePlan = await prisma.servicePlan.findFirst({
            where: {
                type: 'REGULAR',
                isActive: true
            }
        });
        if (!defaultServicePlan) {
            return NextResponse.json({ error: 'No active regular service plan found' }, { status: 404 });
        }
        // Generate services for each subscription
        const services = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (const subscription of subscriptions) {
            if (!subscription.customer.serviceDay)
                continue;
            // Get all dates for this service day between start and end
            let currentDate = start;
            while (currentDate <= end) {
                // Check if this is the customer's service day
                if (currentDate.getDay() === getDayNumber(subscription.customer.serviceDay)) {
                    // Set service time to 7 AM by default
                    const serviceDate = setHours(currentDate, 7);
                    // Check if service already exists
                    const existingService = await prisma.service.findFirst({
                        where: {
                            customerId: subscription.customer.id,
                            scheduledDate: {
                                gte: startOfDay(serviceDate),
                                lte: endOfDay(serviceDate)
                            }
                        }
                    });
                    if (!existingService) {
                        services.push({
                            customerId: subscription.customer.id,
                            servicePlanId: defaultServicePlan.id,
                            status: 'SCHEDULED',
                            scheduledDate: serviceDate,
                        });
                    }
                }
                currentDate = addDays(currentDate, 1);
            }
        }
        // Create services in a transaction
        if (services.length > 0) {
            await prisma.$transaction(services.map(service => prisma.service.create({
                data: service
            })));
        }
        return NextResponse.json({
            message: `Created ${services.length} services, rescheduled ${unclaimedServices.length} unclaimed services`,
            services,
            rescheduledServices: unclaimedServices
        });
    }
    catch (error) {
        console.error('Service scheduling error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// Helper function to convert ServiceDay enum to day number
function getDayNumber(day) {
    const days = {
        SUNDAY: 0,
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6
    };
    return days[day];
}
