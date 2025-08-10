import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/api-auth';
import { stripe } from '@/lib/stripe';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(req, { params }) {
    var _a;
    try {
        const user = await requireAuth(req);
        const { paymentId } = await params;
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                customer: {
                    include: {
                        user: true,
                    },
                },
                service: {
                    include: {
                        customer: {
                            include: {
                                user: true,
                            },
                        },
                        employee: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });
        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }
        // Check if user has access to this payment
        if (user.role === 'CUSTOMER' && payment.customerId !== user.customerId ||
            user.role === 'EMPLOYEE' && ((_a = payment.service) === null || _a === void 0 ? void 0 : _a.employeeId) !== user.employeeId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get payment status from Stripe
        if (payment.stripePaymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
            // Update payment status if it has changed
            if (payment.status !== paymentIntent.status.toUpperCase()) {
                const updatedPayment = await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: paymentIntent.status.toUpperCase(),
                    },
                    include: {
                        customer: {
                            include: {
                                user: true,
                            },
                        },
                        service: {
                            include: {
                                customer: {
                                    include: {
                                        user: true,
                                    },
                                },
                                employee: {
                                    include: {
                                        user: true,
                                    },
                                },
                            },
                        },
                    },
                });
                return NextResponse.json(updatedPayment);
            }
        }
        return NextResponse.json(payment);
    }
    catch (error) {
        console.error('Error checking payment status:', error);
        return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 });
    }
}
