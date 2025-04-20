import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createStripeConnectAccount, createStripeConnectAccountLink } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user email
    const email = session.user.email;

    // Find employee
    const employee = await prisma.employee.findFirst({
      where: { 
        user: { 
          email 
        } 
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Create a Stripe Connect account if one doesn't exist
    let stripeAccountId = employee.stripeAccountId;
    
    if (!stripeAccountId) {
      const account = await createStripeConnectAccount(
        email!,
        employee.user.name || 'Scoopify Employee'
      );
      
      // Save the account ID to the employee record
      await prisma.employee.update({
        where: { id: employee.id },
        data: { stripeAccountId: account.id }
      });
      
      stripeAccountId = account.id;
    }

    // Generate account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const accountLink = await createStripeConnectAccountLink(
      stripeAccountId,
      `${baseUrl}/employee/dashboard/profile?refresh=true`,
      `${baseUrl}/employee/dashboard/profile?success=true`
    );

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 