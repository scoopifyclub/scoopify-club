import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import { reconcileStripePayments, getRecentReconciliationReports, getReconciliationReport } from '@/lib/payment-reconciliation';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

// GET: Get recent reconciliation reports
export async function GET(request) {
    var _a;
    try {
        // Verify admin permission
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        const { userId, role } = await validateUser(accessToken);
        if (role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const url = new URL(request.url);
        const reportId = url.searchParams.get('reportId');
        // If reportId is provided, get specific report details
        if (reportId) {
            const report = await getReconciliationReport(reportId);
            if (!report) {
                return NextResponse.json({ error: 'Report not found' }, { status: 404 });
            }
            return NextResponse.json(report);
        }
        // Otherwise, get recent reports
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const reports = await getRecentReconciliationReports(limit);
        return NextResponse.json(reports);
    }
    catch (error) {
        logger.error('Error getting reconciliation reports:', error);
        return NextResponse.json({ error: 'Failed to get reconciliation reports' }, { status: 500 });
    }
}

// POST: Run a new reconciliation
export async function POST(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { startDate, endDate } = await request.json();
        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            );
        }

        // Get all payments from Stripe for the date range
        const stripePayments = await stripe.paymentIntents.list({
            created: {
                gte: Math.floor(new Date(startDate).getTime() / 1000),
                lte: Math.floor(new Date(endDate).getTime() / 1000),
            },
            limit: 100,
        });

        // Get all payments from our database for the date range
        const dbPayments = await prisma.payment.findMany({
            where: {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
                status: 'PAID',
            },
            include: {
                service: {
                    include: {
                        customer: true,
                    },
                },
            },
        });

        // Compare payments
        const reconciliation = {
            stripePayments: stripePayments.data,
            dbPayments,
            discrepancies: [],
        };

        // Check for payments in Stripe but not in our database
        for (const stripePayment of stripePayments.data) {
            const dbPayment = dbPayments.find(
                (p) => p.stripePaymentIntentId === stripePayment.id
            );
            if (!dbPayment) {
                reconciliation.discrepancies.push({
                    type: 'MISSING_IN_DB',
                    stripePaymentId: stripePayment.id,
                    amount: stripePayment.amount / 100,
                    date: new Date(stripePayment.created * 1000),
                });
            }
        }

        // Check for payments in our database but not in Stripe
        for (const dbPayment of dbPayments) {
            if (dbPayment.paymentMethod === 'STRIPE') {
                const stripePayment = stripePayments.data.find(
                    (p) => p.id === dbPayment.stripePaymentIntentId
                );
                if (!stripePayment) {
                    reconciliation.discrepancies.push({
                        type: 'MISSING_IN_STRIPE',
                        dbPaymentId: dbPayment.id,
                        amount: dbPayment.amount,
                        date: dbPayment.createdAt,
                    });
                }
            }
        }

        return NextResponse.json(reconciliation);
    } catch (error) {
        console.error('Error reconciling payments:', error);
        return NextResponse.json(
            { error: 'Failed to reconcile payments' },
            { status: 500 }
        );
    }
}
