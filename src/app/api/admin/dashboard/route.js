import { NextResponse } from 'next/server';
import { withAdminDatabase } from "@/lib/prisma";
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        
        if (!token) {
            console.log('No access token found in cookies');
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        
        const decoded = await validateUserToken(token);
        console.log('Token verification result:', decoded ? 'success' : 'failed');
        
        if (!decoded || decoded.role !== 'ADMIN') {
            console.log('Invalid token or not admin:', decoded?.role);
            return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
        }

        // Use the admin database helper for proper connection management
        const dashboardData = await withAdminDatabase(async (prisma) => {
            console.log('📊 Fetching admin dashboard data...');
            
            // Get current date ranges
            const today = new Date();
            const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            // Handle recent activity with fallback approach
            let recentActivity = [];
            try {
                // Try the direct relationship approach first
                recentActivity = await prisma.service.findMany({
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
                });
                
                console.log('✅ Recent activity direct query successful');
                
            } catch (relationError) {
                console.error('❌ Direct relationship query failed, using fallback:', relationError);
                
                try {
                    // Fallback: Get services first, then related data separately
                    const basicServices = await prisma.service.findMany({
                        take: 5,
                        orderBy: {
                            updatedAt: 'desc'
                        },
                        select: {
                            id: true,
                            status: true,
                            customerId: true,
                            employeeId: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    });
                    
                    const customerIds = basicServices.map(s => s.customerId).filter(Boolean);
                    const employeeIds = basicServices.map(s => s.employeeId).filter(Boolean);
                    
                    const [customers, employees] = await Promise.all([
                        customerIds.length > 0 ? prisma.customer.findMany({
                            where: { id: { in: customerIds } },
                            include: {
                                user: {
                                    select: { name: true, email: true }
                                }
                            }
                        }) : [],
                        employeeIds.length > 0 ? prisma.employee.findMany({
                            where: { id: { in: employeeIds } },
                            include: {
                                user: {
                                    select: { name: true }
                                }
                            }
                        }) : []
                    ]);
                    
                    const customerMap = new Map(customers.map(c => [c.id, c]));
                    const employeeMap = new Map(employees.map(e => [e.id, e]));
                    
                    recentActivity = basicServices.map(service => ({
                        ...service,
                        customer: customerMap.get(service.customerId) || null,
                        employee: employeeMap.get(service.employeeId) || null
                    }));
                    
                    console.log('✅ Fallback recent activity successful');
                    
                } catch (fallbackError) {
                    console.error('❌ Fallback approach also failed:', fallbackError);
                    recentActivity = [];
                }
            }

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
            const revenueChange = lastMonthRevenue._sum.amount ? 
                ((thisMonthRevenue._sum.amount - lastMonthRevenue._sum.amount) / lastMonthRevenue._sum.amount * 100).toFixed(1) : 
                thisMonthRevenue._sum.amount > 0 ? 100 : 0;

            const customerGrowth = lastMonthCustomers ? 
                ((thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers * 100).toFixed(1) : 
                thisMonthCustomers > 0 ? 100 : 0;

            // Calculate service completion rate
            const totalServicesThisMonth = serviceCompletion.reduce((sum, group) => sum + group._count, 0);
            const completedServicesThisMonth = serviceCompletion.find(group => group.status === 'COMPLETED')?._count || 0;
            const completionRate = totalServicesThisMonth > 0 ? 
                ((completedServicesThisMonth / totalServicesThisMonth) * 100).toFixed(1) : 0;

            // Format recent activity for response
            const formattedRecentActivity = recentActivity.map(service => ({
                id: service.id,
                type: 'service',
                status: service.status,
                customerName: service.customer?.user?.name || 'Unknown',
                employeeName: service.employee?.user?.name || 'Unassigned',
                date: service.createdAt,
                updatedAt: service.updatedAt
            }));

            console.log('✅ Dashboard data fetched successfully');

            return {
                overview: {
                    totalCustomers,
                    totalEmployees,
                    activeServices,
                    monthlyRevenue: thisMonthRevenue._sum.amount || 0,
                    revenueChange: Number(revenueChange),
                    customerGrowth: Number(customerGrowth),
                    completionRate: Number(completionRate)
                },
                thisMonth: {
                    revenue: thisMonthRevenue._sum.amount || 0,
                    customers: thisMonthCustomers,
                    payments: payments._count || 0,
                    totalPaymentAmount: payments._sum.amount || 0
                },
                lastMonth: {
                    revenue: lastMonthRevenue._sum.amount || 0,
                    customers: lastMonthCustomers
                },
                services: {
                    total: totalServicesThisMonth,
                    completed: completedServicesThisMonth,
                    pending: pendingPayments,
                    byStatus: serviceCompletion
                },
                recentActivity: formattedRecentActivity
            };
        });

        console.log('📊 Admin dashboard data generated successfully');
        
        const response = NextResponse.json({
            success: true,
            stats: dashboardData
        });
        
        // Add CORS headers
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return response;
        
    } catch (error) {
        console.error('❌ Admin dashboard API error:', error);
        
        // Specific error handling for connection issues
        if (error.code === 'P2024') {
            return NextResponse.json({ 
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ 
            error: 'Failed to fetch admin dashboard data',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
} 