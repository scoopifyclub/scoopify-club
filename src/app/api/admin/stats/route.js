import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';

// Helper function for diagnostic logging
async function logDiagnostics() {
    try {
        // Check if we can get any service at all
        const service = await prisma.service.findFirst({
            select: { id: true }
        });
        console.log('Diagnostic - service query result:', service);
        
        // Log the current Prisma model structure
        console.log('Diagnostic - available prisma models:', 
            Object.keys(prisma).filter(key => !key.startsWith('_')));
        
        if (prisma.service) {
            console.log('Diagnostic - service model exists');
            
            // Try to get a service without relations
            const basicService = await prisma.service.findFirst();
            console.log('Diagnostic - basic service query result:', 
                basicService ? 'Found service' : 'No service found');
            
            if (basicService) {
                console.log('Diagnostic - service properties available:', 
                    Object.keys(basicService));
            }
        }
    } catch (error) {
        console.error('Diagnostic queries failed:', error);
    }
}

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

        // Run diagnostics first
        await logDiagnostics();
        
        let recentActivity = [];
        try {
            // Query services with the correct relationship names from schema
            recentActivity = await prisma.service.findMany({
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
            });
            
            console.log('Recent activity query successful, found:', recentActivity.length);
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            // Log the full error details for debugging
            console.error('Full error details:', {
                name: error.name,
                message: error.message,
                code: error.code,
                meta: error.meta
            });
            // Continue with other stats if this one fails
            recentActivity = [];
        }
        
        // Fetch all stats in parallel (except recent activity which we already attempted)
        const [totalCustomers, totalEmployees, activeServices, monthlyRevenue, serviceCompletion, paymentStats, employees] = await Promise.all([
            // Total Customers
            prisma.customer.count(),
            // Total Employees
            prisma.employee.count(),
            // Active Services
            prisma.service.count({
                where: {
                    status: 'SCHEDULED'
                }
            }),
            // Monthly Revenue
            prisma.payment.aggregate({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setDate(1)), // First day of current month
                        lt: new Date(new Date().setMonth(new Date().getMonth() + 1)) // First day of next month
                    },
                    status: 'PAID'
                },
                _sum: {
                    amount: true
                }
            }),
            // Service Completion
            prisma.service.groupBy({
                by: ['status'],
                where: {
                    createdAt: {
                        gte: new Date(new Date().setDate(1))
                    }
                },
                _count: true
            }),
            // Payment Stats
            prisma.payment.aggregate({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setDate(1))
                    }
                },
                _count: true,
                _sum: {
                    amount: true
                }
            }),
            // Employee Stats - fetch all employees with ratings
            prisma.employee.findMany({
                select: {
                    rating: true
                }
            })
        ]);
        
        // Calculate completed services
        const completedServices = serviceCompletion.find(s => s.status === 'COMPLETED')?._count || 0;
        const totalServices = serviceCompletion.reduce((acc, curr) => acc + curr._count, 0);
        
        // Calculate average rating
        const averageRating = employees.length > 0
            ? employees.reduce((acc, emp) => acc + (emp.rating || 0), 0) / employees.length
            : 0;
            
        const recentActivityData = recentActivity.map(service => ({
            id: service.id,
            type: 'service',
            status: service.status,
            customerName: service.customer?.User?.name || 'Unknown',
            employeeName: service.employee?.User?.name || 'Unassigned',
            date: service.createdAt
        }));
        
        const response = NextResponse.json({
            totalCustomers,
            totalEmployees,
            activeServices,
            monthlyRevenue: monthlyRevenue._sum.amount || 0,
            serviceCompletion: {
                completed: completedServices,
                total: totalServices
            },
            recentActivity: recentActivityData,
            paymentStats: {
                total: paymentStats._count,
                amount: paymentStats._sum.amount || 0
            },
            employeeStats: {
                averageRating: Number(averageRating.toFixed(2)),
                total: totalEmployees
            }
        });
        
        // Add CORS headers
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return response;
    }
    catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
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
