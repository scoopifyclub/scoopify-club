'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { INITIAL_CLEANUP, findPlan } from '@/lib/pricing-catalog';

const money = (amount) => `$${Number(amount).toFixed(2)}`;

function newAttemptId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function PaymentStep() {
    const searchParams = useSearchParams();
    const plan = findPlan(searchParams.get('plan'));
    const startDate = searchParams.get('start') || '';
    const serviceDay = searchParams.get('day') || '';
    const wasBumped = searchParams.get('bumped') === 'true';
    const isSubscription = plan?.kind === 'subscription';

    // One id per visit to this page: a double-clicked "Pay Now" reuses the
    // same Stripe Checkout session instead of opening a second one.
    const attemptId = useRef(null);
    if (!attemptId.current) attemptId.current = newAttemptId();

    const [prices, setPrices] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!plan) return;
        fetch('/api/prices')
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Prices request failed: ${res.status}`))))
            .then((data) => setPrices(Object.fromEntries(data.plans.map((p) => [p.id, p]))))
            .catch((err) => {
                console.error(err);
                setError('Unable to load pricing. Please refresh the page.');
            });
    }, [plan]);

    if (!plan) {
        return (<div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">No plan selected</h1>
        <p className="text-gray-600">Choose a plan to finish signing up.</p>
        <div className="flex justify-center gap-4">
          <Button asChild><a href="/pricing">View plans</a></Button>
          <Button asChild variant="outline"><a href="/signup">Back to signup</a></Button>
        </div>
      </div>);
    }

    const planPrice = prices?.[plan.id];
    const cleanup = prices?.[INITIAL_CLEANUP.id];
    const planAmount = planPrice?.price ?? null;
    const cleanupAmount = isSubscription ? (cleanup?.price ?? INITIAL_CLEANUP.fallbackChargeCents / 100) : 0;
    const unavailable = planPrice && (!planPrice.available || planAmount == null);
    const total = planAmount != null ? planAmount + cleanupAmount : null;

    const handlePayment = async () => {
        if (loading) return;
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    includeInitialCleanup: isSubscription,
                    startDate,
                    attemptId: attemptId.current,
                    cancelPath: `/signup/payment?${searchParams.toString()}`,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (data.code === 'already_subscribed') {
                throw new Error('You already have an active subscription. Manage it from your dashboard.');
            }
            if (!response.ok || !data.url) {
                throw new Error(data.error || 'Could not start checkout');
            }
            window.location.assign(data.url);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }
    };

    return (<div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Complete Your Signup</h1>
        <p className="mt-2 text-gray-600">Review your order and proceed to payment</p>
      </div>

      <div className="space-y-6">
        {wasBumped && (<div className="rounded-md bg-yellow-50 p-4 mb-4">
            <div className="text-sm text-yellow-800 font-semibold">
              Heads up! Your requested initial cleanup date was less than 3 days away, so we bumped it to the same day next week to ensure proper scheduling. You&apos;ll receive a confirmation email with the new date.
            </div>
          </div>)}
        <div className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Service Plan</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            {isSubscription && serviceDay && (<div className="flex justify-between">
                <span className="text-gray-600">Preferred Day</span>
                <span className="font-medium capitalize">{serviceDay}</span>
              </div>)}
            {startDate && (<div className="flex justify-between">
                <span className="text-gray-600">{isSubscription ? 'First Visit' : 'Visit Date'}</span>
                <span className="font-medium">{startDate}</span>
              </div>)}
            <div className="flex justify-between">
              <span className="text-gray-600">{isSubscription ? 'First Month' : 'One-Time Cleanup'}</span>
              <span className="font-medium">{planAmount != null ? money(planAmount) : '…'}</span>
            </div>
            {isSubscription && (<div className="flex justify-between">
                <span className="text-gray-600">{INITIAL_CLEANUP.name}</span>
                <span className="font-medium">{money(cleanupAmount)}</span>
              </div>)}
            <div className="flex justify-between border-t border-gray-200 pt-4">
              <span className="text-lg font-semibold">Total Due Today</span>
              <span className="text-lg font-semibold">{total != null ? money(total) : '…'}</span>
            </div>
            {isSubscription && planAmount != null && (<p className="text-sm text-gray-500">
                Today: your first month plus the one-time catch-up cleanup. Then {money(planAmount)} per month. Cancel anytime.
              </p>)}
            {!isSubscription && (<p className="text-sm text-gray-500">
                Starting price for a standard yard; large or neglected yards may be quoted separately.
              </p>)}
          </div>
        </div>

        {unavailable && (<div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
            This plan is not available yet. Please choose another plan.
          </div>)}
        {error && (<div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>)}

        <Button className="w-full" size="lg" onClick={handlePayment} disabled={loading || !planPrice || unavailable}>
          {loading ? (<>
              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              Redirecting to secure checkout...
            </>) : ('Pay Now')}
        </Button>

        <p className="text-center text-sm text-gray-600">
          Secure payment powered by Stripe
        </p>
      </div>
    </div>);
}

export default function Payment() {
    return (<main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<Loader2 className="mx-auto h-6 w-6 animate-spin"/>}>
          <PaymentStep />
        </Suspense>
      </div>
    </main>);
}
