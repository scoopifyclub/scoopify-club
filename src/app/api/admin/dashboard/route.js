import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        console.log('🔍 Admin dashboard API called');
        
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        console.log('📊 Fetching admin dashboard data...');
        
        // Get current date ranges
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Get basic counts with error handling
        let totalCustomers = 0;
        let totalEmployees = 0;
        let totalServices = 0;
        let totalRevenue = 0;
        
        try {
            [totalCustomers, totalEmployees, totalServices] = await Promise.all([
                prisma.customer.count(),
                prisma.employee.count(),
                prisma.service.count()
            ]);
        } catch (error) {
            console.error('❌ Error getting basic counts:', error);
        }

        // Get active services (services scheduled for today or future)
        let activeServices = 0;
        try {
            activeServices = await prisma.service.count({
                where: {
                    scheduledDate: {
                        gte: today
                    },
                    status: {
                        in: ['SCHEDULED', 'IN_PROGRESS', 'ARRIVED']
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error counting active services:', error);
        }

        // Get pending services
        let pendingServices = 0;
        try {
            pendingServices = await prisma.service.count({
                where: {
                    status: 'SCHEDULED',
                    employeeId: null
                }
            });
        } catch (error) {
            console.error('❌ Error counting pending services:', error);
        }

        // Get completed services this month
        let completedServices = 0;
        try {
            completedServices = await prisma.service.count({
                where: {
                    status: 'COMPLETED',
                    updatedAt: {
                        gte: thisMonth
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error counting completed services:', error);
        }

        // Get this month's data
        let thisMonthData = {
            newCustomers: 0,
            newServices: 0,
            revenue: 0
        };
        
        try {
            thisMonthData = await Promise.all([
                prisma.customer.count({
                    where: {
                        createdAt: { gte: thisMonth }
                    }
                }),
                prisma.service.count({
                    where: {
                        createdAt: { gte: thisMonth }
                    }
                }),
                prisma.payment.aggregate({
                    where: {
                        createdAt: { gte: thisMonth },
                        status: 'SUCCEEDED'
                    },
                    _sum: {
                        amount: true
                    }
                })
            ]);
            
            thisMonthData = {
                newCustomers: thisMonthData[0],
                newServices: thisMonthData[1],
                revenue: thisMonthData[2]._sum.amount || 0
            };
        } catch (error) {
            console.error('❌ Error getting this month data:', error);
        }

        // Build dashboard data
        const dashboardData = {
            overview: {
                totalCustomers,
                totalEmployees,
                totalServices,
                totalRevenue,
                activeServices,
                pendingServices,
                completedServices
            },
            thisMonth: thisMonthData
        };

        console.log('✅ Dashboard data prepared successfully');
        console.log('📊 Data summary:', {
            customers: totalCustomers,
            employees: totalEmployees,
            services: totalServices,
            activeServices,
            pendingServices
        });

        return NextResponse.json(dashboardData);

    } catch (error) {
        console.error('❌ Admin dashboard API error:', error);
        
        // Return a more detailed error response
        return NextResponse.json({
            error: 'Failed to load dashboard data',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
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