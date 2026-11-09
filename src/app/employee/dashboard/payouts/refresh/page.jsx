"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Stripe sends the scooper here when an onboarding link expired or was
// already used; account links are single-use, so fetch a fresh one.
export default function PayoutSetupRefreshPage() {
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/employee/stripe-connect', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'onboarding-link' }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok || !data.url) throw new Error(data.error || 'Could not restart Stripe setup');
                window.location.href = data.url;
            })
            .catch((err) => setError(err.message));
    }, []);

    return (
        <div className="p-6 max-w-xl">
            <h1 className="text-2xl font-bold mb-4">Payout setup</h1>
            <Card>
                <CardContent className="p-6 space-y-4">
                    {error ? <p className="text-red-600">{error}</p> : <p className="text-gray-600">Reopening Stripe…</p>}
                    {error && (
                        <Button asChild>
                            <Link href="/employee/dashboard/earnings">Back to Earnings</Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
