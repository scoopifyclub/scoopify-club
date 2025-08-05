import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { paymentId } = await request.json();
        if (!paymentId) {
            return NextResponse.json(
                { error: 'Payment ID is required' },
                { status: 400 }
            );
        }

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                service: {
                    include: {
                        customer: {
                            include: {
                                user: true,
                            },
                        }
                    }
                }
            }
        });

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        if (payment.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Payment is not in pending status' },
                { status: 400 }
            );
        }

        let result;
        if (payment.paymentMethod === 'STRIPE' && payment.service?.customer?.stripeCustomerId) {
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(payment.amount * 100),
                    currency: 'usd',
                    customer: payment.service.customer.stripeCustomerId,
                    payment_method: payment.service.customer.defaultPaymentMethodId,
                    off_session: true,
                    confirm: true,
                });

                await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: 'PAID',
                        stripePaymentIntentId: paymentIntent.id,
                        paidAt: new Date(),
                    }
                });

                result = {
                    status: 'success',
                    stripePaymentIntentId: paymentIntent.id,
                };
            } catch (stripeError) {
                console.error('Stripe payment failed:', stripeError);
                await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: 'FAILED',
                        error: stripeError.message,
                    }
                });

                result = {
                    status: 'error',
                    error: stripeError.message,
                };
            }
        } else {
            result = {
                status: 'skipped',
                reason: 'Not a Stripe payment or missing customer info',
            };
        }

        return NextResponse.json({
            paymentId,
            ...result,
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        return NextResponse.json(
            { error: 'Failed to process payment' },
            { status: 500 }
        );
    }
}
