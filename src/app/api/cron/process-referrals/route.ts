import { NextResponse } from 'next/server';
import { processMonthlyReferralPayments } from '@/lib/payment';

export async function POST(request: Request) {
  try {
    // Validate API key for security
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process monthly referral payments
    const results = await processMonthlyReferralPayments();

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processedCount} referral payments totaling $${results.totalAmount.toFixed(2)}`,
      results
    });
  } catch (error) {
    console.error('Error processing monthly referral payments:', error);
    return NextResponse.json(
      { error: 'Failed to process referral payments' },
      { status: 500 }
    );
  }
} 