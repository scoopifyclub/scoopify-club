'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
export default function Payment() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const plan = searchParams.get('plan');
    const numberOfDogs = parseInt(searchParams.get('dogs') || '1');
    const preferredDay = searchParams.get('day') || 'MONDAY';
    // If present, show a warning that the initial cleanup date was bumped
    const wasBumped = searchParams.get('bumped') === 'true';

    // Calculate prices based on service type and number of dogs
    const getPrices = () => {
        const isOneTime = plan?.startsWith('one-time');
        const basePrices = {
            'weekly-1': 55.00,
            'weekly-2': 70.00,
            'weekly-3': 100.00,
            'one-time-1': 75.00,
            'one-time-2': 90.00,
            'one-time-3': 120.00
        };

        const monthlyAmount = isOneTime ? 0 : basePrices[plan] || 55.00;
        const fullCleanupFee = isOneTime ? basePrices[plan] || 75.00 : 69.00;
        const discountedCleanupFee = isOneTime ? 0 : Math.round(fullCleanupFee * 0.5 * 100) / 100; // 50% off for subscription customers

        return {
            monthlyAmount,
            fullCleanupFee,
            discountedCleanupFee,
            total: monthlyAmount + discountedCleanupFee
        };
    };

    const prices = getPrices();

    useEffect(() => {
        if (!plan || !numberOfDogs) {
            router.push('/signup');
        }
    }, [plan, numberOfDogs, router]);
    const handlePayment = async () => {
        setLoading(true);
        setError('');
        try {
            const stripe = await stripePromise;
            if (!stripe)
                throw new Error('Stripe failed to initialize');
            // Create a checkout session
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan,
                    numberOfDogs,
                    preferredDay,
                    price: prices.total,
                }),
            });
            const session = await response.json();
            // Redirect to Stripe Checkout
            const result = await stripe.redirectToCheckout({
                sessionId: session.id,
            });
            if (result.error) {
                throw new Error(result.error.message);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setLoading(false);
        }
    };
    return (<main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Complete Your Signup</h1>
          <p className="mt-2 text-gray-600">
            Review your order and proceed to payment
          </p>
        </div>

        <div className="space-y-6">
          {/* Order Summary */}
          {wasBumped && (
            <div className="rounded-md bg-yellow-50 p-4 mb-4">
              <div className="text-sm text-yellow-800 font-semibold">
                Heads up! Your requested initial cleanup date was less than 3 days away, so we bumped it to the same day next week to ensure proper scheduling. You'll receive a confirmation email with the new date.
              </div>
            </div>
          )}
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <div className="mt-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Plan</span>
                <span className="font-medium">
                  {plan === 'weekly' ? 'Weekly Service' : 'One-Time Cleanup'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Number of Dogs</span>
                <span className="font-medium">{numberOfDogs}</span>
              </div>
              {plan === 'weekly' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Preferred Day</span>
                  <span className="font-medium">{preferredDay}</span>
                </div>
              )}
              {/* Show initial cleanup fee with discount */}
              <div className="flex justify-between">
                <span className="text-gray-600">Initial Cleanup Fee (50% off)</span>
                <span className="font-medium">${prices.discountedCleanupFee.toFixed(2)} <span className="line-through text-gray-400 ml-1 text-xs">${prices.fullCleanupFee.toFixed(2)}</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">First Month Subscription</span>
                <span className="font-medium">${prices.monthlyAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-4">
                <span className="text-lg font-semibold">Total Due Today</span>
                <span className="text-lg font-semibold">${prices.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {error && (<div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>)}

          <Button className="w-full" size="lg" onClick={handlePayment} disabled={loading}>
            {loading ? (<>
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Processing...
              </>) : ('Pay Now')}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </main>);
}
