import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';
export async function POST(req) {
    var _a, _b;
    try {
        // Verify admin authorization
        const token = (_a = req.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get all active subscriptions with their customer details
        const subscriptions = await prisma.subscription.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                customer: {
                    include: {
                        address: true,
                    },
                },
            },
        });
        const createdJobs = [];
        const currentDate = new Date();
        // For each subscription, create a service job for the next week
        for (const subscription of subscriptions) {
            if (!((_b = subscription.customer) === null || _b === void 0 ? void 0 : _b.serviceDay))
                continue;
            // Calculate the next service date based on the customer's preferred day
            const nextServiceDate = new Date(currentDate);
            const daysUntilNextService = (subscription.customer.serviceDay.charCodeAt(0) - currentDate.getDay() + 7) % 7;
            nextServiceDate.setDate(currentDate.getDate() + daysUntilNextService + 7); // Add 7 days to get next week
            // Create the service job
            const job = await prisma.service.create({
                data: {
                    customerId: subscription.customer.id,
                    status: 'SCHEDULED',
                    scheduledDate: nextServiceDate,
                    servicePlanId: subscription.planId,
                },
            });
            createdJobs.push(job);
        }
        return NextResponse.json({
            message: `Successfully created ${createdJobs.length} service jobs`,
            jobs: createdJobs,
        });
    }
    catch (error) {
        console.error('Error scheduling jobs:', error);
        return NextResponse.json({ error: 'Failed to schedule jobs' }, { status: 500 });
    }
}
