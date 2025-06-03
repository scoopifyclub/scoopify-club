import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
export async function GET(req) {
    var _a;
    try {
        const token = (_a = req.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const referrals = await prisma.referral.findMany({
            include: {
                referrer: {
                    include: {
                        User: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                referred: {
                    include: {
                        User: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const formattedReferrals = referrals.map(referral => ({
            ...referral,
            referrerName: referral.referrer?.User?.name || 'Unknown Referrer',
            referredName: referral.referred?.User?.name || 'Unknown Referred',
        }));
        const stats = {
            totalReferrals: referrals.length,
            pendingRewards: 0,
            totalPaid: 0,
            totalAmount: 0,
        };
        return NextResponse.json({
            referrals: formattedReferrals,
            stats,
        });
    }
    catch (error) {
        console.error('Error fetching referrals:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function PATCH(req) {
    var _a;
    try {
        const token = (_a = req.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { referralId, status, cashAppTransactionId } = await req.json();
        if (!referralId || !status) {
            return NextResponse.json({ error: 'Referral ID and status are required' }, { status: 400 });
        }
        const referral = await prisma.referral.update({
            where: { id: referralId },
            data: {
                status,
            },
            include: {
                referrer: {
                    include: {
                        User: true,
                    },
                },
                referred: {
                    include: {
                        User: true,
                    },
                },
            },
        });
        // If marking as paid, create a payment and notification
        if (status === 'PAID') {
            // Create a payment record for the referral
            const payment = await prisma.payment.create({
                data: {
                    amount: 10.00, // Define referral amount
                    type: 'REFERRAL',
                    status: 'PAID',
                    paymentMethod: 'CASH_APP',
                    notes: cashAppTransactionId,
                    paidAt: new Date(),
                },
            });
            // Create a notification for the referrer
            await prisma.notification.create({
                data: {
                    userId: referral.referrer.User.id,
                    type: 'REFERRAL_PAID',
                    title: 'Referral Reward Paid',
                    message: `Your referral reward of $10.00 has been paid out via Cash App. Transaction ID: ${cashAppTransactionId || 'N/A'}`
                }
            });
        }
        return NextResponse.json(referral);
    }
    catch (error) {
        console.error('Error updating referral:', error);
        return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
    }
}
