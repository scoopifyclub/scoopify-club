import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/api-auth';
import { generateReferralCode } from '@/lib/utils';
// GET endpoint to fetch referral stats for a customer
export async function GET(request) {
    var _a;
    try {
        const token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const customer = await prisma.customer.findFirst({
            where: {
                userId: decoded.userId
            },
            include: {
                referralsGiven: {
                    include: {
                        referred: {
                            include: {
                                user: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                referralPayments: true
            }
        });
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        // Generate referral code if not exists
        if (!customer.referralCode) {
            const referralCode = await generateReferralCode();
            await prisma.customer.update({
                where: { id: customer.id },
                data: { referralCode }
            });
            customer.referralCode = referralCode;
        }
        const activeReferrals = customer.referralsGiven.filter(ref => ref.status === 'ACTIVE');
        const pendingReferrals = customer.referralsGiven.filter(ref => ref.status === 'PENDING');
        const totalEarned = customer.referralPayments.reduce((sum, payment) => sum + payment.amount, 0);
        return NextResponse.json({
            referralCode: customer.referralCode,
            cashAppTag: customer.cashAppTag,
            stats: {
                activeReferrals: activeReferrals.length,
                pendingReferrals: pendingReferrals.length,
                totalEarned
            },
            referrals: customer.referralsGiven.map(ref => ({
                id: ref.id,
                status: ref.status,
                customerName: ref.referred.user.name,
                createdAt: ref.createdAt,
                paidAt: ref.paidAt
            }))
        });
    }
    catch (error) {
        console.error('Error fetching referral stats:', error);
        return NextResponse.json({ error: 'Failed to fetch referral stats' }, { status: 500 });
    }
}
// POST endpoint to update Cash App tag
export async function POST(request) {
    var _a;
    try {
        const token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { cashAppTag } = await request.json();
        if (!cashAppTag) {
            return NextResponse.json({ error: 'Cash App tag is required' }, { status: 400 });
        }
        const customer = await prisma.customer.findFirst({
            where: {
                userId: decoded.userId
            }
        });
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        await prisma.customer.update({
            where: { id: customer.id },
            data: { cashAppTag }
        });
        return NextResponse.json({ message: 'Cash App tag updated successfully' });
    }
    catch (error) {
        console.error('Error updating Cash App tag:', error);
        return NextResponse.json({ error: 'Failed to update Cash App tag' }, { status: 500 });
    }
}
