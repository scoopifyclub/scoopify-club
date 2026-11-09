import { NextResponse } from 'next/server';
import { withAdminDatabase } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const formattedServices = await withAdminDatabase(async (prisma) => {
            console.log('📊 Fetching admin services list...');

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
                                        name: true,
                                        email: true,
                                    },
                                },
                                address: true
                            }
                        },
                                            employee: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                    },
                                }
                            }
                        }
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            console.log(`✅ Found ${services.length} services`);

            // For each service, get payout and referral status using batch queries to reduce connections
            const serviceIds = services.map(s => s.id);
            const customerIds = services.map(s => s.customerId).filter(Boolean);

            const [earnings, referrals] = await Promise.all([
                // Batch fetch all earnings
                prisma.earning.findMany({ 
                    where: { serviceId: { in: serviceIds } },
                    select: { serviceId: true, status: true }
                }),
                // Batch fetch all referrals
                customerIds.length > 0 ? prisma.referral.findMany({ 
                    where: { referredId: { in: customerIds } },
                    select: { referredId: true, payoutStatus: true }
                }) : []
            ]);

            // Create lookup maps for better performance
            const earningsMap = new Map(earnings.map(e => [e.serviceId, e]));
            const referralsMap = new Map(referrals.map(r => [r.referredId, r]));

            // Format services with cached data
            const formattedServices = services.map(service => {
                const earning = earningsMap.get(service.id);
                const referral = referralsMap.get(service.customerId);

                return {
                    id: service.id,
                    scheduledFor: service.scheduledDate,
                    status: service.status,
                    payoutStatus: earning ? earning.status : 'Pending',
                    referralStatus: referral ? (referral.payoutStatus || 'Pending') : 'N/A',
                    customer: {
                        name: service.customer.user.name,
                        address: service.customer.address.street
                    },
                    employee: service.employee ? {
                        name: service.employee.user.name
                    } : undefined,
                    completedAt: service.completedDate
                };
            });

            console.log('✅ Services formatted successfully');
            return formattedServices;
        });

        return NextResponse.json(formattedServices);
    }
    catch (error) {
        console.error('❌ Error fetching services:', error);
        
        if (error.code === 'P2024') {
            return NextResponse.json({ 
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}
