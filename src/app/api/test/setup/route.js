import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { hash } from 'bcryptjs';
export async function POST() {
    try {
        // Create test customer user
        const hashedPassword = await hash('test123', 12);
        const customerUser = await prisma.user.create({
            data: {
                email: 'testcustomer@scoopify.com',
                name: 'Test Customer',
                password: hashedPassword,
                role: 'CUSTOMER',
                emailVerified: true
            },
        });
        // Create test customer
        const customer = await prisma.customer.create({
            data: {
                userId: customerUser.id
            },
        });
        // Create test address
        const address = await prisma.address.create({
            data: {
                customerId: customer.id,
                street: '123 Test St',
                city: 'Test City',
                state: 'CA',
                zipCode: '90210'
            },
        });
        // Create test service plan
        const servicePlan = await prisma.servicePlan.create({
            data: {
                name: 'Weekly Service',
                description: 'Weekly poop scooping service',
                price: 50.00,
                duration: 30,
                type: 'REGULAR',
            },
        });
        // Create test subscription
        const subscription = await prisma.subscription.create({
            data: {
                customerId: customer.id,
                planId: servicePlan.id,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            },
        });
        // Create test service
        const service = await prisma.service.create({
            data: {
                customerId: customer.id,
                status: 'SCHEDULED',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                servicePlanId: servicePlan.id
            },
        });
        return NextResponse.json({
            message: 'Test data created successfully',
            data: {
                customer: {
                    id: customer.id,
                    email: customerUser.email,
                },
                service: {
                    id: service.id,
                    status: service.status,
                    scheduledDate: service.scheduledDate,
                },
            },
        });
    }
    catch (error) {
        console.error('Error creating test data:', error);
        return NextResponse.json({ error: 'Failed to create test data' }, { status: 500 });
    }
}
