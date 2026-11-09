import { NextResponse } from 'next/server';
import { requireCronOrAdmin } from '@/lib/cron-auth';
import { processMonthlyReferralPayments } from '@/lib/payment';
export async function POST(request) {
    try {
        const auth = await requireCronOrAdmin(request);
        if (!auth.ok) return auth.response;
        // Process monthly referral payments
        const results = await processMonthlyReferralPayments();
        return NextResponse.json({
            success: true,
            message: `Processed ${results.processedCount} referral payments totaling $${results.totalAmount.toFixed(2)}`,
            results
        });
    }
    catch (error) {
        console.error('Error processing monthly referral payments:', error);
        return NextResponse.json({ error: 'Failed to process referral payments' }, { status: 500 });
    }
}
