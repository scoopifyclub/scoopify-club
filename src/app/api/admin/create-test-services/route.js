import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        // Verify admin session
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { count = 5, hours = 2 } = await request.json();

        console.log(`[ADMIN] Creating ${count} test services`);

        // Get all active customers with addresses
        const customers = await prisma.customer.findMany({
            where: {
                address: {
                    isNot: null
                }
            },
            include: {
                address: true,
                user: true
            },
            take: count
        });

        if (customers.length === 0) {
            return NextResponse.json({ error: 'No customers with addresses found' }, { status: 400 });
        }

        const servicesCreated = [];
        const now = new Date();

        for (let i = 0; i < Math.min(count, customers.length); i++) {
            const customer = customers[i];
            
            // Create service scheduled for next few hours
            const serviceTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
            
            try {
                const service = await prisma.service.create({
                    data: {
                        customerId: customer.id,
                        scheduledDate: serviceTime,
                        status: 'SCHEDULED',
                        serviceType: 'Pet Waste Cleanup',
                        specialInstructions: `Test service created by admin - Customer: ${customer.user.name}`
                    },
                    include: {
                        customer: {
                            include: {
                                user: true,
                                address: true
                            }
                        }
                    }
                });

                servicesCreated.push({
                    id: service.id,
                    customerName: customer.user.name,
                    address: `${customer.address.street}, ${customer.address.city}, ${customer.address.zipCode}`,
                    scheduledDate: service.scheduledDate,
                    zipCode: customer.address.zipCode
                });

                console.log(`[ADMIN] Created test service ${service.id} for ${customer.user.name} at ${service.scheduledDate}`);
            } catch (error) {
                console.error(`[ADMIN] Error creating service for customer ${customer.id}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Created ${servicesCreated.length} test services`,
            services: servicesCreated
        });

    } catch (error) {
        console.error('[ADMIN] Error creating test services:', error);
        return NextResponse.json(
            { error: 'Failed to create test services', details: error.message },
            { status: 500 }
        );
    }
} 