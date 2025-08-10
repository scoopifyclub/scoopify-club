import { NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/security-middleware';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function handler(req) {
    try {
        if (req.method !== 'POST') {
            return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
        }

        const { customerId, serviceId } = await req.json();
        
        if (!customerId || !serviceId) {
            return NextResponse.json({ error: 'Customer ID and Service ID are required' }, { status: 400 });
        }

        // Find the referral for this customer
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { user: true }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const referral = await prisma.referral.findFirst({
            where: {
                referredEmail: customer.user.email,
                status: 'PENDING'
            },
            include: {
                referrer: {
                    include: { user: true }
                }
            }
        });

        if (!referral) {
            return NextResponse.json({ error: 'No pending referral found' }, { status: 404 });
        }

        // Get the referrer's Stripe account
        let stripeAccountId;
        if (referral.type === 'SCOOPER') {
            const employee = await prisma.employee.findUnique({
                where: { id: referral.referrerId }
            });
            stripeAccountId = employee?.stripeConnectAccountId;
        } else if (referral.type === 'BUSINESS') {
            const businessPartner = await prisma.businessPartner.findUnique({
                where: { id: referral.referrerId }
            });
            stripeAccountId = businessPartner?.stripeAccountId;
        }

        if (!stripeAccountId) {
            return NextResponse.json({ error: 'Referrer does not have Stripe account set up' }, { status: 400 });
        }

        // Process the payment
        try {
            // Create a transfer to the referrer's Stripe account
            const transfer = await stripe.transfers.create({
                amount: Math.round(referral.commissionAmount * 100), // Convert to cents
                currency: 'usd',
                destination: stripeAccountId,
                description: `Referral commission for ${referral.referredName}`,
                metadata: {
                    referralId: referral.id,
                    customerId: customerId,
                    serviceId: serviceId,
                    type: referral.type
                }
            });

            // Update referral status and create payout record
            await prisma.$transaction([
                prisma.referral.update({
                    where: { id: referral.id },
                    data: { 
                        status: 'PAID',
                        paidAt: new Date()
                    }
                }),
                prisma.referralPayout.create({
                    data: {
                        referralId: referral.id,
                        amount: referral.commissionAmount,
                        stripeTransferId: transfer.id,
                        status: 'COMPLETED',
                        processedAt: new Date()
                    }
                })
            ]);

            // Send email notification to referrer
            await sendReferralPaymentEmail(referral, transfer.id);

            return NextResponse.json({
                success: true,
                message: 'Referral payment processed successfully',
                transferId: transfer.id,
                amount: referral.commissionAmount
            });

        } catch (stripeError) {
            console.error('Stripe payment error:', stripeError);
            
            // Update referral status to failed
            await prisma.referral.update({
                where: { id: referral.id },
                data: { 
                    status: 'FAILED',
                    errorMessage: stripeError.message
                }
            });

            return NextResponse.json({ 
                error: 'Payment processing failed',
                details: stripeError.message 
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Referral payment processing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function sendReferralPaymentEmail(referral, transferId) {
    try {
        const emailData = {
            to: referral.referrer.user.email,
            subject: '🎉 Referral Payment Processed!',
            template: 'referral-payment',
            data: {
                referrerName: referral.referrer.user.name,
                referredName: referral.referredName,
                amount: referral.commissionAmount,
                transferId: transferId,
                type: referral.type
            }
        };

        // Send email using your email service
        await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });

    } catch (error) {
        console.error('Error sending referral payment email:', error);
    }
}

export const POST = withApiSecurity(handler, { requireAuth: true }); 