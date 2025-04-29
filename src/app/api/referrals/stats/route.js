import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';
export async function GET(req) {
    var _a, _b, _c;
    try {
        const token = (_a = req.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const customer = await prisma.customer.findUnique({
            where: { userId: decoded.id },
            include: {
                referrals: {
                    include: {
                        customer: {
                            include: {
                                user: true,
                            },
                        },
                        reward: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                referrer: {
                    include: {
                        code: true,
                    },
                },
            },
        });
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        const stats = {
            totalReferrals: customer.referrals.length,
            pendingRewards: customer.referrals
                .filter(r => { var _a; return ((_a = r.reward) === null || _a === void 0 ? void 0 : _a.status) === 'PENDING'; })
                .reduce((sum, r) => { var _a; return sum + (((_a = r.reward) === null || _a === void 0 ? void 0 : _a.amount) || 0); }, 0),
            totalEarned: customer.referrals
                .filter(r => { var _a; return ((_a = r.reward) === null || _a === void 0 ? void 0 : _a.status) === 'PAID'; })
                .reduce((sum, r) => { var _a; return sum + (((_a = r.reward) === null || _a === void 0 ? void 0 : _a.amount) || 0); }, 0),
            referralCode: ((_b = customer.referrer) === null || _b === void 0 ? void 0 : _b.code) || '',
            shareUrl: ((_c = customer.referrer) === null || _c === void 0 ? void 0 : _c.code)
                ? `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${customer.referrer.code}`
                : '',
        };
        return NextResponse.json({
            stats,
            referrals: customer.referrals,
        });
    }
    catch (error) {
        console.error('Error fetching referral stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
