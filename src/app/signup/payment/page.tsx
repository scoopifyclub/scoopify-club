'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function Payment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plan = searchParams.get('plan');
  const numberOfDogs = parseInt(searchParams.get('dogs') || '1');
  const preferredDay = searchParams.get('day') || 'MONDAY';
  const price = parseFloat(searchParams.get('price') || '0');

  useEffect(() => {
    if (!plan || !numberOfDogs || !price) {
      router.push('/signup');
    }
  }, [plan, numberOfDogs, price, router]);

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

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
          price,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Complete Your Signup</h1>
          <p className="mt-2 text-gray-600">
            Review your order and proceed to payment
          </p>
        </div>

        <div className="space-y-6">
          {/* Order Summary */}
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
              <div className="flex justify-between border-t border-gray-200 pt-4">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-semibold">
                  ${price}
                  {plan === 'weekly' && '/month'}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay Now'
            )}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </main>
  );
} 