import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
export async function GET() {
    try {
        const prices = await stripe.prices.list({
            expand: ['data.product'],
            active: true,
        });
        const plans = prices.data.map((price) => {
            var _a, _b;
            return ({
                id: price.id,
                name: price.product.name,
                description: price.product.description,
                price: price.unit_amount,
                currency: price.currency,
                interval: (_a = price.recurring) === null || _a === void 0 ? void 0 : _a.interval,
                intervalCount: (_b = price.recurring) === null || _b === void 0 ? void 0 : _b.interval_count,
            });
        });
        return NextResponse.json(plans);
    }
    catch (error) {
        console.error('Plans error:', error);
        return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }
}
