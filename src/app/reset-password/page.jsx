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
    const [email, setEmail] = useState('');
    const [requested, setRequested] = useState(false);
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
                const details = Array.isArray(data.details) ? ` ${data.details.join('. ')}` : '';
                throw new Error(`${data.error || 'Failed to reset password'}${details}`);
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
    const handleRequest = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to request a reset link');
            }
            setRequested(true);
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to request a reset link');
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
              Forgot Password
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              {requested
                ? 'If an account exists for that email, a password reset link has been sent. The link expires in 1 hour.'
                : 'Enter your email and we will send you a link to reset your password.'}
            </p>
          </div>

          {requested ? (<Button className="w-full" onClick={() => router.push('/login')}>
              Return to Login
            </Button>) : (<form className="mt-8 space-y-6" onSubmit={handleRequest}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required/>
              </div>
              <Button type="submit" className="w-full" disabled={loading || !email}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>)}
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
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={12}/>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={12}/>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !password || !confirmPassword}>
            {loading ? 'Resetting password...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>);
}
