"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Stripe sends the scooper here after Express onboarding. Leaving onboarding
// does not mean it is complete, so re-read the account from Stripe.
export default function PayoutSetupReturnPage() {
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/employee/stripe-connect', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'refresh-status' }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Could not check your Stripe account');
                setStatus(data);
            })
            .catch((err) => setError(err.message));
    }, []);

    const ready = status?.payoutsEnabled && status?.stripeAccountStatus === 'ACTIVE';

    return (
        <div className="p-6 max-w-xl">
            <h1 className="text-2xl font-bold mb-4">Payout setup</h1>
            <Card>
                <CardContent className="p-6 space-y-4">
                    {error && <p className="text-red-600">{error}</p>}
                    {!error && !status && <p className="text-gray-600">Checking your Stripe account…</p>}
                    {status && ready && (
                        <p>You are all set. Verified jobs are paid to your bank every Friday.</p>
                    )}
                    {status && !ready && status.detailsSubmitted && (
                        <p>Stripe has your details and is verifying them. This page and your Earnings page update once Stripe enables payouts.</p>
                    )}
                    {status && !ready && !status.detailsSubmitted && (
                        <p>Your payout setup is not finished yet. Continue on the Earnings page whenever you are ready.</p>
                    )}
                    <Button asChild>
                        <Link href="/employee/dashboard/earnings">Go to Earnings</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
