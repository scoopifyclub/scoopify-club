import { NextResponse } from 'next/server';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getUserFullName } from '@/lib/user-utils';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value || 
                     cookieStore.get('token')?.value || 
                     cookieStore.get('refreshToken')?.value;
        
        if (!token) {
            // No token found in cookies
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        
        const decoded = await validateUserToken(token);
        // Token verification completed
        
        if (!decoded || decoded.role !== 'CUSTOMER') {
            // Invalid token or not customer
            return NextResponse.json({ error: 'Unauthorized - Not customer' }, { status: 401 });
        }

        // Fetching customer dashboard data
        
        // Get customer data with related information
        const customer = await prisma.customer.findFirst({
            where: { userId: decoded.userId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                },
                address: true,
                subscription: {
                    include: {
                        plan: true
                    }
                },
                services: {
                    take: 5,
                    orderBy: {
                        scheduledDate: 'desc'
                    },
                    include: {
                        servicePlan: true,
                        employee: {
                            include: {
                                                         user: {
                             select: {
                                 firstName: true,
                                 lastName: true
                             }
                         }
                            }
                        },
                        location: true,
                        photos: true
                    }
                },
                payments: {
                    take: 5,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        servicePlan: true
                    }
                }
            }
        });

        if (!customer) {
            // Customer not found for user
            return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
        }

        // Get additional stats
        const [totalServices, completedServices, totalPayments, totalSpent] = await Promise.all([
            prisma.service.count({
                where: { customerId: customer.id }
            }),
            prisma.service.count({
                where: { 
                    customerId: customer.id,
                    status: 'COMPLETED'
                }
            }),
            prisma.payment.count({
                where: { customerId: customer.id }
            }),
            prisma.payment.aggregate({
                where: { 
                    customerId: customer.id,
                    status: 'PAID'
                },
                _sum: {
                    amount: true
                }
            })
        ]);

        // Format dashboard data
        const dashboardData = {
            profile: {
                id: customer.id,
                name: getUserFullName(customer.user),
                email: customer.user.email,
                phone: customer.phone,
                address: customer.address ? {
                    street: customer.address.street,
                    city: customer.address.city,
                    state: customer.address.state,
                    zipCode: customer.address.zipCode
                } : null,
                subscription: customer.subscription ? {
                    status: customer.subscription.status,
                    plan: customer.subscription.plan?.name || 'Unknown',
                    startDate: customer.subscription.startDate,
                    endDate: customer.subscription.endDate
                } : null
            },
            stats: {
                totalServices,
                completedServices,
                totalPayments,
                totalSpent: totalSpent._sum.amount || 0,
                serviceCredits: customer.serviceCredits || 0
            },
            recentServices: customer.services.map(service => ({
                id: service.id,
                status: service.status,
                scheduledDate: service.scheduledDate,
                completedDate: service.completedDate,
                servicePlan: service.servicePlan?.name || 'Unknown',
                                 employee: service.employee ? {
                     name: getUserFullName(service.employee.user) || 'Unassigned'
                 } : null,
                location: service.location ? {
                    address: service.location.address
                } : null,
                photos: service.photos || []
            })),
            recentPayments: customer.payments.map(payment => ({
                id: payment.id,
                amount: payment.amount,
                status: payment.status,
                type: payment.type,
                createdAt: payment.createdAt,
                servicePlan: payment.servicePlan?.name || 'Unknown'
            }))
        };

        // Customer dashboard data generated successfully
        
        return NextResponse.json({
            success: true,
            data: dashboardData
        });
        
    } catch (error) {
        // Customer dashboard API error
        
        if (error.code === 'P2024') {
            return NextResponse.json({ 
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ 
            error: 'Failed to fetch customer dashboard data',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
