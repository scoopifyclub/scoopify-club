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
            // Create new business referral
            const { businessId, customerEmail, customerName, businessName, referralCode } = await req.json();
            
            if (!businessId || !customerEmail || !customerName || !businessName) {
                return NextResponse.json({ error: 'Business ID, customer email, name, and business name are required' }, { status: 400 });
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
                    referrerId: businessId,
                    referredEmail: customerEmail,
                    referredName: customerName,
                    referralCode: referralCode || `BUSINESS_${businessId}_${Date.now()}`,
                    type: 'BUSINESS',
                    status: 'PENDING',
                    commissionAmount: 50.00, // $50 commission for business referrals
                    commissionPercentage: 15, // 15% of first month
                    businessName: businessName
                }
            });

            return NextResponse.json({ success: true, referral }, { status: 201 });

        } else if (req.method === 'GET') {
            // Get business referrals
            const { businessId, status } = req.nextUrl.searchParams;
            
            const where = { type: 'BUSINESS' };
            if (businessId) where.referrerId = businessId;
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
        console.error('Business referral error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = withApiSecurity(handler, { requireAuth: true });
export const POST = withApiSecurity(handler, { requireAuth: true }); 