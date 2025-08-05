import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/api-auth';
export async function POST(request) {
    var _a;
    try {
        // Only admins can process referrals manually
        const token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Process all pending referrals
        const pendingReferrals = await prisma.referral.findMany({
            where: {
                status: 'PENDING',
                customer: {
                    subscription: {
                        status: 'ACTIVE'
                    }
                }
            },
            include: {
                referrer: true,
                customer: true
            }
        });
        const results = await Promise.all(pendingReferrals.map(async (referral) => {
            // Mark as processed
            const updated = await prisma.referral.update({
                where: { id: referral.id },
                data: {
                    status: 'PROCESSED',
                    processedAt: new Date()
                }
            });
            // Credit the referrer
            if (referral.referrerId) {
                await prisma.referralCredit.create({
                    data: {
                        referrerId: referral.referrerId,
                        referralId: referral.id,
                        amount: 25.00, // Standard referral amount
                        status: 'PENDING'
                    }
                });
            }
            return updated;
        }));
        return NextResponse.json({
            processed: results.length,
            referrals: results
        });
    }
    catch (error) {
        console.error('Error processing referrals:', error);
        return NextResponse.json({ error: 'Failed to process referrals' }, { status: 500 });
    }
}
