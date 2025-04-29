'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            toast.error('Invalid reset link');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        try {
            setLoading(true);
            const response = await fetch('/api/auth/reset-password/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to reset password');
            }
            toast.success('Password reset successful!');
            router.push('/login');
        }
        catch (error) {
            console.error('Reset password error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to reset password');
        }
        finally {
            setLoading(false);
        }
    };
    if (!token) {
        return (<div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              The password reset link is invalid or has expired.
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
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8}/>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={8}/>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !password || !confirmPassword}>
            {loading ? 'Resetting password...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>);
}
