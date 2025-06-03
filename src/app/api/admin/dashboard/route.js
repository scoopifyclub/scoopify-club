import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        
        if (!token) {
            console.log('No access token found in cookies');
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
            prisma.customer.count().catch(err => {
                console.error('Error counting customers:', err);
                return 0;
            }),
            
            // Total employees
            prisma.employee.count().catch(err => {
                console.error('Error counting employees:', err);
                return 0;
            }),
            
            // Active/scheduled services
            prisma.service.count({
                where: {
                    status: {
                        in: ['SCHEDULED', 'IN_PROGRESS', 'PENDING']
                    }
                }
            }).catch(err => {
                console.error('Error counting active services:', err);
                return 0;
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
            }).catch(err => {
                console.error('Error calculating this month revenue:', err);
                return { _sum: { amount: 0 } };
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
            }).catch(err => {
                console.error('Error calculating last month revenue:', err);
                return { _sum: { amount: 0 } };
            }),
            
            // This month's new customers
            prisma.customer.count({
                where: {
                    createdAt: {
                        gte: thisMonth
                    }
                }
            }).catch(err => {
                console.error('Error counting this month customers:', err);
                return 0;
            }),
            
            // Last month's new customers for comparison
            prisma.customer.count({
                where: {
                    createdAt: {
                        gte: lastMonth,
                        lt: thisMonth
                    }
                }
            }).catch(err => {
                console.error('Error counting last month customers:', err);
                return 0;
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
            }).catch(err => {
                console.error('Error getting service completion stats:', err);
                return [];
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
                            User: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    employee: {
                        include: {
                            User: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            }).catch(err => {
                console.error('Error fetching recent activity:', err);
                return [];
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
            }).catch(err => {
                console.error('Error getting payment stats:', err);
                return { _count: 0, _sum: { amount: 0 } };
            }),
            
            // Pending payments
            prisma.payment.count({
                where: {
                    status: 'PENDING'
                }
            }).catch(err => {
                console.error('Error counting pending payments:', err);
                return 0;
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
                    description = `Service completed for ${service.customer?.User?.name || 'Unknown Customer'}`;
                    break;
                case 'SCHEDULED':
                    type = 'service_scheduled';
                    description = `Service scheduled for ${service.customer?.User?.name || 'Unknown Customer'}`;
                    break;
                case 'IN_PROGRESS':
                    type = 'service_in_progress';
                    description = `Service in progress for ${service.customer?.User?.name || 'Unknown Customer'}`;
                    break;
                case 'PENDING':
                    type = 'service_pending';
                    description = `Service pending for ${service.customer?.User?.name || 'Unknown Customer'}`;
                    break;
                default:
                    type = 'service_updated';
                    description = `Service updated for ${service.customer?.User?.name || 'Unknown Customer'}`;
            }

            return {
                id: service.id,
                type,
                status: service.status === 'COMPLETED' ? 'success' : 'info',
                description,
                time: service.updatedAt
            };
        });

        // Generate system alerts based on actual data
        const alerts = [];
        
        if (pendingPayments > 5) {
            alerts.push({
                id: 'pending-payments',
                severity: 'high',
                message: `${pendingPayments} payments are pending review`,
                time: new Date().toISOString()
            });
        }

        // Check for services that need attention
        const pendingServices = serviceCompletion.find(s => s.status === 'PENDING')?._count || 0;
        if (pendingServices > 10) {
            alerts.push({
                id: 'pending-services',
                severity: 'medium',
                message: `${pendingServices} services are pending assignment`,
                time: new Date().toISOString()
            });
        }

        // Check for low employee count
        if (totalEmployees < 3) {
            alerts.push({
                id: 'low-employees',
                severity: 'high',
                message: 'Low employee count - consider hiring more staff',
                time: new Date().toISOString()
            });
        }

        const response = {
            success: true,
            stats: {
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
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        return NextResponse.json({ 
            success: false,
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