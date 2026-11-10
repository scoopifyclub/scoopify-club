'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function CheckoutButton({ planId, disabled, className, children }) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (loading) return;
        try {
            setLoading(true);
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.url) {
                throw new Error(data.error || 'Failed to create checkout session');
            }
            window.location.assign(data.url);
        }
        catch (error) {
            console.error('Checkout error:', error);
            alert('Something went wrong with the checkout process. Please try again.');
            setLoading(false);
        }
    };

    return (<Button className={className} onClick={handleCheckout} disabled={disabled || loading}>
      {loading ? 'Processing...' : children}
    </Button>);
}
