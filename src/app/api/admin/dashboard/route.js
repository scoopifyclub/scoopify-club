import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('adminToken')?.value;
        
        if (!token) {
            console.log('No admin token found in cookies');
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        
        const decoded = await verifyToken(token);
        console.log('Token verification result:', decoded);
        
        if (!decoded || decoded.role !== 'ADMIN') {
            console.log('Invalid token or not admin:', decoded?.role);
            return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
        }

        // Get current date ranges
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Fetch dashboard data in parallel
        const [
            totalCustomers,
            totalEmployees,
            activeServices,
            thisMonthRevenue,
            lastMonthRevenue,
            thisMonthCustomers,
            lastMonthCustomers,
            serviceCompletion,
            recentActivity,
            payments,
            pendingPayments
        ] = await Promise.all([
            // Total customers
            prisma.customer.count(),
            
            // Total employees
            prisma.employee.count(),
            
            // Active/scheduled services
            prisma.service.count({
                where: {
                    status: {
                        in: ['SCHEDULED', 'IN_PROGRESS', 'PENDING']
                    }
                }
            }),
            
            // This month's revenue
            prisma.payment.aggregate({
                where: {
                    status: 'PAID',
                    createdAt: {
                        gte: thisMonth,
                        lte: thisMonthEnd
                    }
                },
                _sum: {
                    amount: true
                }
            }),
            
            // Last month's revenue for comparison
            prisma.payment.aggregate({
                where: {
                    status: 'PAID',
                    createdAt: {
                        gte: lastMonth,
                        lt: thisMonth
                    }
                },
                _sum: {
                    amount: true
                }
            }),
            
            // This month's new customers
            prisma.customer.count({
                where: {
                    createdAt: {
                        gte: thisMonth
                    }
                }
            }),
            
            // Last month's new customers for comparison
            prisma.customer.count({
                where: {
                    createdAt: {
                        gte: lastMonth,
                        lt: thisMonth
                    }
                }
            }),
            
            // Service completion stats
            prisma.service.groupBy({
                by: ['status'],
                where: {
                    createdAt: {
                        gte: thisMonth
                    }
                },
                _count: true
            }),
            
            // Recent activity (last 5 services)
            prisma.service.findMany({
                take: 5,
                orderBy: {
                    updatedAt: 'desc'
                },
                include: {
                    customer: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    employee: {
                        include: {
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            }),
            
            // Payment stats
            prisma.payment.aggregate({
                where: {
                    createdAt: {
                        gte: thisMonth
                    }
                },
                _count: true,
                _sum: {
                    amount: true
                }
            }),
            
            // Pending payments
            prisma.payment.count({
                where: {
                    status: 'PENDING'
                }
            })
        ]);

        // Calculate percentage changes
        const thisMonthRevenueAmount = thisMonthRevenue._sum.amount || 0;
        const lastMonthRevenueAmount = lastMonthRevenue._sum.amount || 0;
        const revenueChange = lastMonthRevenueAmount > 0 
            ? ((thisMonthRevenueAmount - lastMonthRevenueAmount) / lastMonthRevenueAmount) * 100 
            : 0;

        const customerChange = lastMonthCustomers > 0 
            ? ((thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100 
            : 0;

        // Calculate service completion rate
        const completedServices = serviceCompletion.find(s => s.status === 'COMPLETED')?._count || 0;
        const totalServices = serviceCompletion.reduce((acc, curr) => acc + curr._count, 0);

        // Format recent activity
        const recentActivityFormatted = recentActivity.map(service => {
            let type, description;
            
            switch (service.status) {
                case 'COMPLETED':
                    type = 'service_completed';
                    description = `Service completed for ${service.customer?.user?.name || 'Unknown Customer'}`;
                    break;
                case 'SCHEDULED':
                    type = 'service_scheduled';
                    description = `Service scheduled for ${service.customer?.user?.name || 'Unknown Customer'}`;
                    break;
                case 'IN_PROGRESS':
                    type = 'service_in_progress';
                    description = `Service in progress for ${service.customer?.user?.name || 'Unknown Customer'}`;
                    break;
                case 'PENDING':
                    type = 'service_pending';
                    description = `Service pending for ${service.customer?.user?.name || 'Unknown Customer'}`;
                    break;
                default:
                    type = 'service_updated';
                    description = `Service updated for ${service.customer?.user?.name || 'Unknown Customer'}`;
            }

            return {
                id: service.id,
                type,
                status: service.status === 'COMPLETED' ? 'success' : 'info',
                description,
                time: service.updatedAt
            };
        });

        // Generate some system alerts (you can customize this logic)
        const alerts = [];
        
        if (pendingPayments > 5) {
            alerts.push({
                id: 'pending-payments',
                severity: 'high',
                message: `${pendingPayments} payments are pending review`,
                time: new Date().toISOString()
            });
        }

        const response = {
            totalCustomers,
            totalEmployees,
            activeServices,
            monthlyRevenue: thisMonthRevenueAmount,
            revenueChange: Number(revenueChange.toFixed(1)),
            customerChange: Number(customerChange.toFixed(1)),
            serviceCompletion: {
                completed: completedServices,
                total: totalServices
            },
            recentActivity: recentActivityFormatted,
            paymentStats: {
                total: payments._count,
                amount: payments._sum.amount || 0,
                pending: pendingPayments
            },
            alerts
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch dashboard data',
            details: error.message 
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