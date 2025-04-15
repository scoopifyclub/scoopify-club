'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Here you would typically verify the payment with your backend
      // For now, we'll just show success
      setStatus('success');
    } else {
      setStatus('error');
    }
  }, [sessionId]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="animate-pulse">
            <div className="h-12 w-12 bg-primary-200 rounded-full mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Processing your payment...</h1>
          </div>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-accent-600 mb-8">
              Thank you for choosing Scoopify. Your subscription has been activated.
            </p>
            <Button asChild>
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-16 w-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h1 className="text-2xl font-bold mb-4">Payment Error</h1>
            <p className="text-accent-600 mb-8">
              There was an issue processing your payment. Please try again.
            </p>
            <Button asChild>
              <a href="/pricing">Back to Pricing</a>
            </Button>
          </>
        )}
      </div>
    </main>
  );
} 