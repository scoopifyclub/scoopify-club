import { NextResponse } from 'next/server';
import { withAdminDatabase } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

                       const decoded = await validateUserToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30days';

        const reports = await withAdminDatabase(async (prisma) => {
            console.log('📊 Fetching admin reports...');

            // Calculate date range
            const now = new Date();
            let startDate;
            switch (range) {
                case '7days':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30days':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '90days':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            // Get revenue by day
            const revenueByDay = await prisma.$queryRaw`
                SELECT 
                    DATE(created_at) as date,
                    SUM(amount) as amount
                FROM "Payment" 
                WHERE created_at >= ${startDate} 
                AND status = 'successful'
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `;

            // Get services by type
            const servicesByType = await prisma.service.groupBy({
                by: ['type'],
                where: {
                    createdAt: { gte: startDate }
                },
                _count: {
                    id: true
                }
            });

            // Get services by region (using customer addresses)
            const servicesByRegion = await prisma.$queryRaw`
                SELECT 
                    c.address->>'city' as region,
                    COUNT(s.id) as count
                FROM "Service" s
                JOIN "Customer" c ON s.customer_id = c.id
                WHERE s.created_at >= ${startDate}
                GROUP BY c.address->>'city'
                ORDER BY count DESC
                LIMIT 10
            `;

            // Get top employees
            const topEmployees = await prisma.employee.findMany({
                where: {
                    services: {
                        some: {
                            createdAt: { gte: startDate },
                            status: 'completed'
                        }
                    }
                },
                include: {
                    User: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    services: {
                        where: {
                            createdAt: { gte: startDate },
                            status: 'completed'
                        },
                        select: {
                            id: true,
                            price: true
                        }
                    }
                }
            });

            // Calculate employee metrics
            const topEmployeesWithMetrics = topEmployees.map(employee => ({
                ...employee,
                completedServices: employee.services.length,
                revenue: employee.services.reduce((sum, service) => sum + (service.price || 0), 0),
                rating: 4.5 // Placeholder - would need to implement rating system
            }));

            return {
                revenueByDay: revenueByDay.map(item => ({
                    date: item.date,
                    amount: parseFloat(item.amount) || 0
                })),
                servicesByType: servicesByType.map(item => ({
                    type: item.type || 'Unknown',
                    count: item._count.id
                })),
                servicesByRegion: servicesByRegion.map(item => ({
                    region: item.region || 'Unknown',
                    count: parseInt(item.count) || 0
                })),
                topEmployees: topEmployeesWithMetrics
                    .sort((a, b) => b.completedServices - a.completedServices)
                    .slice(0, 10)
            };
        });

        return NextResponse.json({
            success: true,
            reports: reports
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to fetch reports' 
        }, { status: 500 });
    }
}
