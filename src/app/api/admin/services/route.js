import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
export async function GET(request) {
    var _a;
    try {
        const token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        const services = await prisma.service.findMany({
            where: {
                scheduledDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        },
                        address: true
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
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        });
        const formattedServices = services.map(service => ({
            id: service.id,
            scheduledFor: service.scheduledDate,
            status: service.status,
            customer: {
                name: service.customer.user.name,
                address: service.customer.address.street
            },
            employee: service.employee ? {
                name: service.employee.user.name
            } : undefined,
            completedAt: service.completedDate
        }));
        return NextResponse.json({ services: formattedServices });
    }
    catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}
