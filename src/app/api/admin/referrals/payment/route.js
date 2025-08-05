import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
export async function POST(request) {
    var _a;
    try {
        // Verify admin authorization
        const token = (_a = request.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const payload = await verifyToken(token);
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const { referralId, amount, cashAppPaymentId } = await request.json();
        if (!referralId || !amount || !cashAppPaymentId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        // Create payment record and update referral status
        const payment = await prisma.$transaction(async (tx) => {
            // Create payment record
            const payment = await tx.payment.create({
                data: {
                    amount,
                    type: 'REFERRAL',
                    status: 'PAID',
                    paymentMethod: 'CASH_APP',
                    notes: cashAppPaymentId,
                    paidAt: new Date(),
                    // Add any other required fields for the payment model
                },
            });
            // Update referral status to PAID
            await tx.referral.update({
                where: { id: referralId },
                data: { status: 'PAID' },
            });
            return payment;
        });
        // Fetch updated referral with related data
        const updatedReferral = await prisma.referral.findUnique({
            where: { id: referralId },
            include: {
                referrer: {
                    select: {
                        id: true,
                        cashAppName: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                            }
                        }
                    },
                },
                referred: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                            }
                        },
                        subscription: {
                            select: {
                                status: true,
                            },
                        },
                    },
                },
            },
        });
        return NextResponse.json({
            payment,
            referral: updatedReferral
        });
    }
    catch (error) {
        console.error('Error processing referral payment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
