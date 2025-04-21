import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';

// Helper function to get token and validate
async function getTokenAndValidate(request: Request, role = 'CUSTOMER') {
  // Try header first
  let token = request.headers.get('authorization')?.split(' ')[1] || 
              request.headers.get('Authorization')?.split(' ')[1];
  
  // If no token in header, try cookies
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('accessToken')?.value || cookieStore.get('accessToken_client')?.value;
  }
  
  // Still no token
  if (!token) {
    console.log('No token found in request headers or cookies');
    throw new Error('Unauthorized');
  }
  
  // Validate the token
  try {
    return await validateUser(token, role);
  } catch (error) {
    console.error('Token validation error:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    console.log('Customer referral payments GET request received');
    
    // Get and validate token - this will include customer data
    const { userId, customerId, customer } = await getTokenAndValidate(request, 'CUSTOMER');
    console.log('Token validated, userId:', userId, 'customerId:', customerId);

    if (!customer) {
      return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
    }

    // Get referral payments for this customer
    const payments = await prisma.payment.findMany({
      where: { 
        customerId: customer.id,
        type: {
          in: ['REFERRAL', 'MONTHLY_REFERRAL']
        },
        status: 'COMPLETED'
      },
      include: {
        referred: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      date: payment.createdAt,
      referredName: payment.referred?.user?.name || 'Unknown',
      type: payment.type
    }));

    console.log(`Found ${formattedPayments.length} referral payments`);
    return NextResponse.json({ payments: formattedPayments });
  } catch (error) {
    console.error('Error getting referral payments:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Customer record not found') {
        return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
      }
      
      // Return detailed error message in development
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json(
          { 
            error: 'Failed to get referral payments', 
            message: error.message,
            stack: error.stack 
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to get referral payments' },
      { status: 500 }
    );
  }
} 