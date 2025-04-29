import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
export async function POST(req) {
    var _a;
    try {
        // Verify admin authorization
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        const { userId, role } = await validateUser(accessToken);
        if (role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const { employeeId, earningIds } = await req.json();
        if (!employeeId || !earningIds || !Array.isArray(earningIds)) {
            return new NextResponse('Invalid request data', { status: 400 });
        }
        // Get employee details
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                user: true
            }
        });
        if (!employee) {
            return new NextResponse('Employee not found', { status: 404 });
        }
        // Get approved earnings to be paid
        const earnings = await prisma.earning.findMany({
            where: {
                id: { in: earningIds },
                employeeId: employeeId,
                status: 'APPROVED'
            },
            include: {
                service: true
            }
        });
        if (earnings.length === 0) {
            return new NextResponse('No approved earnings found', { status: 400 });
        }
        // Verify all services are completed and approved
        for (const earning of earnings) {
            if (earning.service.status !== 'COMPLETED' || earning.service.paymentStatus !== 'APPROVED') {
                return new NextResponse(`Service ${earning.service.id} must be completed and approved before payment`, { status: 400 });
            }
        }
        const totalAmount = earnings.reduce((sum, earning) => sum + earning.amount, 0);
        try {
            if (employee.cashAppUsername) {
                // For Cash App payments, we'll just mark it as PAID since it needs to be done manually
                await prisma.$transaction([
                    prisma.earning.updateMany({
                        where: {
                            id: { in: earningIds },
                            status: 'APPROVED'
                        },
                        data: {
                            status: 'PAID',
                            paidVia: 'CASH_APP',
                            paidAt: new Date()
                        }
                    }),
                    prisma.service.updateMany({
                        where: {
                            id: { in: earnings.map(e => e.service.id) }
                        },
                        data: {
                            paymentStatus: 'PAID'
                        }
                    })
                ]);
                return NextResponse.json({
                    message: 'Earnings marked for Cash App payment',
                    cashApp: employee.cashAppUsername,
                    amount: totalAmount,
                    services: earnings.map(e => e.service.id)
                });
            }
            else {
                // For Stripe payments
                // First check if employee has a Stripe account
                let stripeAccountId = employee.stripeAccountId;
                if (!stripeAccountId) {
                    // Create a Stripe Connect account for the employee
                    const account = await stripe.accounts.create({
                        type: 'express',
                        country: 'US',
                        email: employee.user.email,
                        capabilities: {
                            transfers: { requested: true },
                        },
                    });
                    // Update employee with Stripe account ID
                    await prisma.employee.update({
                        where: { id: employeeId },
                        data: { stripeAccountId: account.id }
                    });
                    stripeAccountId = account.id;
                }
                // Create a transfer to the employee's Stripe account
                const transfer = await stripe.transfers.create({
                    amount: Math.round(totalAmount * 100), // Convert to cents
                    currency: 'usd',
                    destination: stripeAccountId,
                    description: `Earnings payout for ${earnings.length} completed services`
                });
                // Update earnings and services as paid
                await prisma.$transaction([
                    prisma.earning.updateMany({
                        where: {
                            id: { in: earningIds },
                            status: 'APPROVED'
                        },
                        data: {
                            status: 'PAID',
                            paidVia: 'STRIPE',
                            paidAt: new Date(),
                            stripeTransferId: transfer.id
                        }
                    }),
                    prisma.service.updateMany({
                        where: {
                            id: { in: earnings.map(e => e.service.id) }
                        },
                        data: {
                            paymentStatus: 'PAID'
                        }
                    })
                ]);
                return NextResponse.json({
                    message: 'Earnings paid via Stripe',
                    transferId: transfer.id,
                    amount: totalAmount,
                    services: earnings.map(e => e.service.id)
                });
            }
        }
        catch (error) {
            // Mark earnings as failed if payment fails
            await prisma.earning.updateMany({
                where: {
                    id: { in: earningIds },
                    status: 'APPROVED'
                },
                data: {
                    status: 'FAILED',
                    errorMessage: error.message
                }
            });
            throw error;
        }
    }
    catch (error) {
        console.error('Payout error:', error);
        return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 });
    }
}
