import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { rateLimit } from '@/lib/auth-rate-limit';
import { calculateTaxes } from '@/lib/tax-calculator';

export async function POST(request) {
    if (typeof window !== 'undefined') {
        return NextResponse.json({ error: 'This endpoint is server-side only' }, { status: 403 });
    }

    try {
        // Rate limiting for payment requests
        const identifier = request.headers.get('x-forwarded-for') || 'unknown';
        const { success } = await rateLimit(identifier, 10, '5 m'); // 10 requests per 5 minutes
        
        if (!success) {
            return NextResponse.json({ 
                error: 'Too many payment requests',
                code: 'rate_limit_exceeded'
            }, { status: 429 });
        }

        const { priceId, isOneTime, customerId, serviceType, customerType, subtotal } = await request.json();

        // Validate the price ID
        if (!priceId) {
            return NextResponse.json({
                error: 'Price ID is required',
                code: 'missing_price_id'
            }, { status: 400 });
        }

        // Validate price ID format
        if (!priceId.startsWith('price_')) {
            return NextResponse.json({ 
                error: 'Invalid price ID format',
                code: 'invalid_price_format'
            }, { status: 400 });
        }

        // Validate customer ID if provided
        if (customerId && !customerId.startsWith('cus_')) {
            return NextResponse.json({ 
                error: 'Invalid customer ID format',
                code: 'invalid_customer_format'
            }, { status: 400 });
        }

        // Validate boolean flag
        if (typeof isOneTime !== 'boolean') {
            return NextResponse.json({ 
                error: 'Invalid payment type',
                code: 'invalid_payment_type'
            }, { status: 400 });
        }

        // Calculate taxes if subtotal is provided
        let taxAmount = 0;
        let totalAmount = 0;
        
        if (subtotal && serviceType && customerType) {
            const taxResult = calculateTaxes(subtotal, serviceType, customerType);
            taxAmount = taxResult.totalTax;
            totalAmount = taxResult.total;
        }

        // Check if Stripe is properly configured
        if (!stripe) {
            return NextResponse.json({ 
                error: 'Stripe is not properly configured',
                code: 'stripe_not_configured'
            }, { status: 500 });
        }
        // Get the absolute URL for success and cancel URLs
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
                // Add tax line item if taxes were calculated
                ...(taxAmount > 0 ? [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Sales Tax (Peyton, CO)',
                            description: 'Colorado State (2.9%) + El Paso County (1.0%)',
                        },
                        unit_amount: Math.round(taxAmount * 100), // Convert to cents
                    },
                    quantity: 1,
                }] : [])
            ],
            mode: isOneTime ? 'payment' : 'subscription',
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
            metadata: {
                isOneTime: isOneTime ? 'true' : 'false',
                subtotal: subtotal ? subtotal.toString() : '',
                taxAmount: taxAmount.toString(),
                totalAmount: totalAmount.toString(),
                serviceType: serviceType || '',
                customerType: customerType || '',
                location: 'Peyton, Colorado'
            }
        });
        return NextResponse.json({ sessionId: session.id });
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        
        // Categorize Stripe errors for better user experience
        if (error.type === 'StripeCardError') {
            return NextResponse.json({ 
                error: 'Payment method was declined',
                code: 'card_declined'
            }, { status: 400 });
        }
        
        if (error.type === 'StripeInvalidRequestError') {
            return NextResponse.json({ 
                error: 'Invalid payment request',
                code: 'invalid_request'
            }, { status: 400 });
        }
        
        if (error.type === 'StripeAPIError') {
            return NextResponse.json({ 
                error: 'Payment service temporarily unavailable',
                code: 'service_unavailable'
            }, { status: 503 });
        }
        
        if (error.type === 'StripeRateLimitError') {
            return NextResponse.json({ 
                error: 'Too many requests to payment service',
                code: 'rate_limit_exceeded'
            }, { status: 429 });
        }
        
        // Generic error for unknown issues
        return NextResponse.json({ 
            error: 'Payment processing error',
            code: 'processing_error'
        }, { status: 500 });
    }
}
