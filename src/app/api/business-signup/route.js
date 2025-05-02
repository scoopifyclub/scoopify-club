import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBusinessSignupEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

function generateReferralCode() {
  return 'BIZ-' + uuidv4().split('-')[0].toUpperCase();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      businessName,
      contactFirstName,
      contactLastName,
      phone,
      email,
      payoutMethod,
      stripeAccountId,
      cashAppUsername,
    } = body;

    if (!businessName || !contactFirstName || !contactLastName || !phone || !email || !payoutMethod) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    // Create business partner
    const business = await prisma.businessPartner.create({
      data: {
        businessName,
        contactFirstName,
        contactLastName,
        phone,
        email,
        payoutMethod,
        stripeAccountId: payoutMethod === 'STRIPE' ? stripeAccountId : null,
        cashAppUsername: payoutMethod === 'CASH_APP' ? cashAppUsername : null,
      },
    });

    // Generate referral code
    const code = generateReferralCode();
    await prisma.referralCode.create({
      data: {
        code,
        type: 'BUSINESS',
        businessPartnerId: business.id,
      },
    });

    // Send email with all info and code
    await sendBusinessSignupEmail({
      to: email,
      businessName,
      contactFirstName,
      contactLastName,
      phone,
      payoutMethod,
      stripeAccountId,
      cashAppUsername,
      code,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Signup failed. Please try again.' }, { status: 500 });
  }
}
