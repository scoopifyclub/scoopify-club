import { NextResponse } from 'next/server';
import { getPricingPlans } from '@/lib/pricing.server';

export async function GET() {
    try {
        const plans = await getPricingPlans({ includeInitialCleanup: true });
        return NextResponse.json({ plans });
    }
    catch (error) {
        console.error('Error in prices API:', error);
        return NextResponse.json({ error: 'Unable to load pricing' }, { status: 500 });
    }
}
