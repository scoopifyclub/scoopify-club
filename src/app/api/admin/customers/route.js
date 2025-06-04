import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { withAdminDatabase } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';

export async function GET(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await withAdminDatabase(async (prisma) => {
            console.log('📊 Fetching admin customers...');
            
            // First check if we can count customers
            try {
                const customerCount = await prisma.customer.count();
                console.log(`Total customers in database: ${customerCount}`);
            } catch (countError) {
                console.error('Failed to count customers:', countError);
            }

            // Fetch customers with detailed error handling
            try {
                // First try to get just the customers without relationships
                const basicCustomers = await prisma.customer.findMany();
                console.log(`Found ${basicCustomers.length} basic customers`);

                // Then get the full data
                const customers = await prisma.customer.findMany({
                    include: {
                        User: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        },
                        address: true,
                        subscription: true
                    }
                });

                console.log(`Successfully fetched ${customers.length} customers with relationships`);

                const formattedCustomers = customers.map(customer => {
                    // Log each customer's data structure for debugging
                    console.log(`Processing customer ${customer.id}:`, {
                        hasUser: !!customer.User,
                        hasAddress: !!customer.address,
                        hasSubscription: !!customer.subscription
                    });

                    return {
                        id: customer.id,
                        user: customer.User ? {
                            id: customer.User.id,
                            name: customer.User.name,
                            email: customer.User.email,
                            role: customer.User.role
                        } : null,
                        address: customer.address ? {
                            street: customer.address.street,
                            city: customer.address.city,
                            state: customer.address.state,
                            zipCode: customer.address.zipCode
                        } : null,
                        phone: customer.phone,
                        stripeCustomerId: customer.stripeCustomerId,
                        cashAppName: customer.cashAppName,
                        serviceDay: customer.serviceDay,
                        subscription: customer.subscription ? {
                            id: customer.subscription.id,
                            status: customer.subscription.status,
                            startDate: customer.subscription.startDate,
                            endDate: customer.subscription.endDate,
                            planId: customer.subscription.planId
                        } : null,
                        createdAt: customer.createdAt,
                        updatedAt: customer.updatedAt
                    };
                });

                return {
                    success: true,
                    customers: formattedCustomers,
                    total: formattedCustomers.length
                };

            } catch (dbError) {
                console.error('Database query error:', dbError);
                
                if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
                    console.error('Prisma error details:', {
                        code: dbError.code,
                        message: dbError.message,
                        meta: dbError.meta
                    });
                    
                    switch (dbError.code) {
                        case 'P2021':
                            throw new Error('Database Error: Required table not found. Database might need migration.');
                        case 'P2002':
                            throw new Error('Database Error: Unique constraint violation');
                        case 'P2025':
                            throw new Error('Database Error: Record not found');
                        default:
                            throw new Error(`Database Error: Prisma error ${dbError.code}`);
                    }
                }
                
                if (dbError instanceof Prisma.PrismaClientValidationError) {
                    console.error('Prisma validation error:', dbError.message);
                    throw new Error('Database Error: Invalid query structure');
                }
                
                throw new Error('Database Error: An unexpected database error occurred');
            }
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('❌ Unexpected error in GET /api/admin/customers:', error);
        
        if (error.code === 'P2024') {
            return NextResponse.json({
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT'
            }, { status: 503 });
        }
        
        return NextResponse.json({
            error: 'Server Error',
            details: error instanceof Error ? error.message : 'An unexpected error occurred'
        }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, ...data } = await request.json();

        const updatedCustomer = await withAdminDatabase(async (prisma) => {
            return await prisma.customer.update({
                where: { id },
                data,
                include: {
                    User: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            createdAt: true,
                        },
                    },
                },
            });
        });

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        console.error('❌ Error updating customer:', error);
        
        if (error.code === 'P2024') {
            return NextResponse.json({
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT'
            }, { status: 503 });
        }
        
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await request.json();

        await withAdminDatabase(async (prisma) => {
            return await prisma.customer.delete({
                where: { id },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting customer:', error);
        
        if (error.code === 'P2024') {
            return NextResponse.json({
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT'
            }, { status: 503 });
        }
        
        return NextResponse.json(
            { error: 'Failed to delete customer' },
            { status: 500 }
        );
    }
}
