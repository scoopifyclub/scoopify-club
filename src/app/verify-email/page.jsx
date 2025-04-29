'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
export default function VerifyEmail() {
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/auth/verify-email?token=${token}`);
                if (!response.ok) {
                    throw new Error('Failed to verify email');
                }
                setVerified(true);
                toast.success('Email verified successfully!');
            }
            catch (error) {
                console.error('Email verification error:', error);
                toast.error('Failed to verify email');
            }
            finally {
                setLoading(false);
            }
        };
        verifyEmail();
    }, [token]);
    if (loading) {
        return (<div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              Verifying Email
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Please wait while we verify your email...
            </p>
          </div>
        </div>
      </div>);
    }
    if (!token) {
        return (<div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              Invalid Verification Link
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              The verification link is invalid or has expired.
            </p>
            <Button className="mt-4" onClick={() => router.push('/login')}>
              Return to Login
            </Button>
          </div>
        </div>
      </div>);
    }
    return (<div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            {verified ? 'Email Verified!' : 'Verification Failed'}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            {verified
            ? 'Your email has been verified successfully.'
            : 'We couldn\'t verify your email. The link may have expired.'}
          </p>
          <Button className="mt-4" onClick={() => router.push('/login')}>
            Return to Login
          </Button>
        </div>
      </div>
    </div>);
}
