import { NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/security-middleware';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function handler(req) {
    try {
        if (req.method === 'POST') {
            // Create new scooper referral
            const { scooperId, customerEmail, customerName, referralCode } = await req.json();
            
            if (!scooperId || !customerEmail || !customerName) {
                return NextResponse.json({ error: 'Scooper ID, customer email, and name are required' }, { status: 400 });
            }

            // Check if customer already exists
            const existingCustomer = await prisma.customer.findFirst({
                where: { 
                    user: { 
                        email: customerEmail 
                    } 
                }
            });

            if (existingCustomer) {
                return NextResponse.json({ error: 'Customer already exists' }, { status: 400 });
            }

            // Create referral record
            const referral = await prisma.referral.create({
                data: {
                    referrerId: scooperId,
                    referredEmail: customerEmail,
                    referredName: customerName,
                    referralCode: referralCode || `SCOOPER_${scooperId}_${Date.now()}`,
                    type: 'SCOOPER',
                    status: 'PENDING',
                    commissionAmount: 25.00, // $25 commission for scooper referrals
                    commissionPercentage: 10 // 10% of first month
                }
            });

            return NextResponse.json({ success: true, referral }, { status: 201 });

        } else if (req.method === 'GET') {
            // Get scooper referrals
            const { scooperId, status } = req.nextUrl.searchParams;
            
            const where = { type: 'SCOOPER' };
            if (scooperId) where.referrerId = scooperId;
            if (status) where.status = status;

            const referrals = await prisma.referral.findMany({
                where,
                include: {
                    referrer: {
                        include: { user: true }
                    },
                    payout: true
                },
                orderBy: { createdAt: 'desc' }
            });

            return NextResponse.json({ success: true, referrals });

        } else {
            return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
        }

    } catch (error) {
        console.error('Scooper referral error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = withApiSecurity(handler, { requireAuth: true });
export const POST = withApiSecurity(handler, { requireAuth: true }); 