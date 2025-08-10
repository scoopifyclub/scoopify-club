import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

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
                },
                status: 'COMPLETED'
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
                },
                photos: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                checklist: true
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        });
        const formattedServices = services.map(service => ({
            id: service.id,
            scheduledFor: service.scheduledDate,
            customer: {
                name: service.customer.user.name,
                address: service.customer.address.street
            },
            employee: service.employee ? {
                name: service.employee.user.name
            } : undefined,
            photos: service.photos.map(photo => ({
                id: photo.id,
                url: photo.url,
                type: photo.type,
                createdAt: photo.createdAt
            })),
            checklist: service.checklist || {
                gatesClosed: false,
                gatesLocked: false,
                gatesSecured: false,
                gatesChecked: false,
                gatesVerified: false,
                gatesConfirmed: false,
                gatesInspected: false,
                gatesValidated: false,
                gatesApproved: false,
                gatesCompleted: false
            }
        }));
        return NextResponse.json({ services: formattedServices });
    }
    catch (error) {
        console.error('Error fetching service photos:', error);
        return NextResponse.json({ error: 'Failed to fetch service photos' }, { status: 500 });
    }
}
