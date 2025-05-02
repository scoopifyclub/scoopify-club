import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';
export async function GET(request) {
    var _a, _b;
    try {
        const cookieStore = await cookies();
        const token = (_a = cookieStore.get('adminToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!token) {
            console.log('No admin token found in cookies');
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        console.log('Token verification result:', decoded);
        if (!decoded || decoded.role !== 'ADMIN') {
            console.log('Invalid token or not admin:', decoded === null || decoded === void 0 ? void 0 : decoded.role);
            return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
        }
        // Fetch all stats in parallel
        const [totalCustomers, totalEmployees, activeServices, monthlyRevenue, serviceCompletion, recentActivity, paymentStats, employees] = await Promise.all([
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
            // Recent Activity
            prisma.service.findMany({
                take: 5,
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            userId: true,
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    employee: {
                        select: {
                            id: true,
                            userId: true,
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
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
        const completedServices = ((_b = serviceCompletion.find(s => s.status === 'COMPLETED')) === null || _b === void 0 ? void 0 : _b._count) || 0;
        const totalServices = serviceCompletion.reduce((acc, curr) => acc + curr._count, 0);
        // Calculate average rating
        const averageRating = employees.length > 0
            ? employees.reduce((acc, emp) => acc + (emp.rating || 0), 0) / employees.length
            : 0;
        const response = NextResponse.json({
            totalCustomers,
            totalEmployees,
            activeServices,
            monthlyRevenue: monthlyRevenue._sum.amount || 0,
            serviceCompletion: {
                completed: completedServices,
                total: totalServices
            },
            recentActivity: recentActivity.map(service => {
                var _a, _b, _c, _d;
                return ({
                    id: service.id,
                    type: 'service',
                    status: service.status,
                    customerName: ((_b = (_a = service.customer) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                    employeeName: ((_d = (_c = service.employee) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.name) || 'Unassigned',
                    date: service.createdAt
                });
            }),
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
