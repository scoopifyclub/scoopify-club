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
        const status = searchParams.get('status');
        // Remove date filter, optionally filter by status
        const where = {};
        if (status) where.status = status;
        const services = await prisma.service.findMany({
            where,
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
        // For each service, get payout and referral status
        const formattedServices = await Promise.all(services.map(async service => {
            // Get payout status from Earning
            const earning = await prisma.earning.findFirst({ where: { serviceId: service.id } });
            // Get referral status from Referral
            let referralStatus = 'N/A';
            if (service.customerId) {
                const referral = await prisma.referral.findFirst({ where: { referredId: service.customerId } });
                if (referral) referralStatus = referral.payoutStatus || 'Pending';
            }
            return {
                id: service.id,
                scheduledFor: service.scheduledDate,
                status: service.status,
                payoutStatus: earning ? earning.status : 'Pending',
                referralStatus,
                customer: {
                    name: service.customer.user.name,
                    address: service.customer.address.street
                },
                employee: service.employee ? {
                    name: service.employee.user.name
                } : undefined,
                completedAt: service.completedDate
            };
        }));
        return NextResponse.json(formattedServices);
    }
    catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}
