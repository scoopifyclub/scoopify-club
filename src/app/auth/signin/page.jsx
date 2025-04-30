'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { generateDeviceFingerprint } from '@/lib/fingerprint';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Generate device fingerprint with error handling
            let deviceFingerprint;
            try {
                deviceFingerprint = await generateDeviceFingerprint();
            } catch (error) {
                console.error('Error generating device fingerprint:', error);
                deviceFingerprint = `fallback-${Math.random().toString(36).substring(2)}`;
            }

            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    password,
                    deviceFingerprint
                }),
                credentials: 'include',
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to sign in');
            }

            // Show success message if user just registered
            if (searchParams.get('registered') === 'true') {
                toast.success('Account created successfully!');
            }

            // Redirect based on role
            const redirectPath = data.user.role === 'CUSTOMER'
                ? '/customer/dashboard'
                : data.user.role === 'EMPLOYEE'
                    ? '/employee/dashboard'
                    : '/admin/dashboard';

            router.push(redirectPath);
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error instanceof Error ? error.message : 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-neutral-600">
                        Or{' '}
                        <button
                            onClick={() => router.push('/auth/signup')}
                            className="font-medium text-primary hover:text-primary/80"
                        >
                            create a new account
                        </button>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => router.push('/auth/forgot-password')}
                            className="text-sm font-medium text-primary hover:text-primary/80"
                        >
                            Forgot your password?
                        </button>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
