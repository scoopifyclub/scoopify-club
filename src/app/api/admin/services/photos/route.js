import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { toPhotoView } from '@/lib/service-photos';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    var _a;
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
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
                                firstName: true,
                                lastName: true
                            }
                        },
                        address: true
                    }
                },
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
        const fullName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || null;
        const earnings = await prisma.earning.findMany({ where: { serviceId: { in: services.map(s => s.id) } } });
        const earningByService = new Map(earnings.map(e => [e.serviceId, e]));
        const formattedServices = await Promise.all(services.map(async (service) => ({
            id: service.id,
            scheduledFor: service.scheduledDate,
            completedDate: service.completedDate,
            customer: {
                name: fullName(service.customer.user),
                address: service.customer.address?.street ?? null
            },
            employee: service.employee ? {
                id: service.employee.id,
                name: fullName(service.employee.user)
            } : undefined,
            photos: await Promise.all(service.photos.map(photo => toPhotoView(photo))),
            checklist: service.checklist,
            earning: earningByService.get(service.id) ?? null
        })));
        return NextResponse.json({ services: formattedServices }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch (error) {
        console.error('Error fetching service photos:', error);
        return NextResponse.json({ error: 'Failed to fetch service photos' }, { status: 500 });
    }
}
