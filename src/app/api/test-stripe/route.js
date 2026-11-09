import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { requireAdmin } from '@/lib/admin-auth';
export async function GET(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
        // Test the Stripe connection by listing products and prices
        const products = await stripe.products.list({ limit: 1 });
        const prices = await stripe.prices.list({ limit: 3 });
        return NextResponse.json({
            success: true,
            message: 'Stripe connection successful',
            products: products.data,
            prices: prices.data.map(price => ({
                id: price.id,
                unit_amount: price.unit_amount,
                currency: price.currency,
                recurring: price.recurring,
                product: price.product
            }))
        });
    }
    catch (error) {
        console.error('Stripe test error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to connect to Stripe',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
