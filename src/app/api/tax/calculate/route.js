import { NextResponse } from 'next/server';
import { calculateTaxes, getTaxRates, validateTaxCalculation } from '@/lib/tax-calculator';
import { logPaymentSuccess } from '@/lib/payment-logging';

export async function POST(request) {
  try {
    const { subtotal, serviceType, customerType, customerId } = await request.json();

    // Input validation
    if (!subtotal || subtotal < 0) {
      return NextResponse.json({ 
        error: 'Valid subtotal amount is required',
        code: 'invalid_subtotal'
      }, { status: 400 });
    }

    if (!serviceType || !['weekly', 'bi-weekly', 'monthly', 'one-time'].includes(serviceType)) {
      return NextResponse.json({ 
        error: 'Valid service type is required',
        code: 'invalid_service_type'
      }, { status: 400 });
    }

    if (!customerType || !['residential', 'commercial'].includes(customerType)) {
      return NextResponse.json({ 
        error: 'Valid customer type is required',
        code: 'invalid_customer_type'
      }, { status: 400 });
    }

    // Calculate taxes
    const taxResult = calculateTaxes(subtotal, serviceType, customerType);

    // Validate calculation
    try {
      validateTaxCalculation(taxResult);
    } catch (error) {
      console.error('Tax calculation validation failed:', error);
      return NextResponse.json({ 
        error: 'Tax calculation error',
        code: 'calculation_error'
      }, { status: 500 });
    }

    // Log tax calculation for audit trail
    if (customerId) {
      await logPaymentSuccess({
        customerId: customerId,
        amount: subtotal,
        currency: 'usd',
        paymentMethod: 'tax_calculation',
        stripePaymentIntentId: null,
        stripeCustomerId: null,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          serviceType: serviceType,
          customerType: customerType,
          taxAmount: taxResult.totalTax,
          taxRate: taxResult.taxRate,
          location: taxResult.location
        }
      });
    }

    return NextResponse.json({
      success: true,
      taxes: taxResult,
      rates: getTaxRates()
    });

  } catch (error) {
    console.error('Tax calculation error:', error);
    return NextResponse.json({ 
      error: 'Tax calculation failed',
      code: 'calculation_failed'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Return current tax rates
    const rates = getTaxRates();
    
    return NextResponse.json({
      success: true,
      rates: rates,
      location: 'Peyton, Colorado',
      effectiveDate: new Date().toISOString(),
      notes: [
        'Colorado State Sales Tax: 2.9%',
        'El Paso County Sales Tax: 1.0%',
        'Total Effective Tax Rate: 3.9%',
        'Rates are current as of 2024',
        'Consult with a tax professional for specific business requirements'
      ]
    });

  } catch (error) {
    console.error('Error fetching tax rates:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tax rates' 
    }, { status: 500 });
  }
} 