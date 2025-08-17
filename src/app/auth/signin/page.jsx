'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { generateDeviceFingerprint } from '@/lib/fingerprint';

// Helper function for conditional logging
const log = (message, data = null) => {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_AUTH === 'true') {
        if (data) {
            console.log(`🔐 SIGNIN: ${message}`, data);
        } else {
            console.log(`🔐 SIGNIN: ${message}`);
        }
    }
};

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            log('Starting login process...');
            
            // Generate device fingerprint for security
            let deviceFingerprint;
            try {
                deviceFingerprint = generateDeviceFingerprint();
                log('Device fingerprint generated:', deviceFingerprint);
            } catch (error) {
                log('Error generating device fingerprint:', error);
                deviceFingerprint = `fallback_${Date.now()}`;
                log('Using fallback fingerprint:', deviceFingerprint);
            }

            log('Sending login request with:', { email, hasPassword: !!password });
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    deviceFingerprint,
                }),
            });

            log('Login response status:', { status: response.status, statusText: response.statusText });
            
            const data = await response.json();
            log('Login response data:', data);

            if (data.success && data.user) {
                log('Login successful, user role:', data.role);
                
                // Redirect based on user role
                let redirectPath;
                switch (data.user.role) {
                    case 'ADMIN':
                        redirectPath = '/admin/dashboard';
                        break;
                    case 'EMPLOYEE':
                        redirectPath = '/employee/dashboard';
                        break;
                    case 'CUSTOMER':
                        redirectPath = '/customer/dashboard';
                        break;
                    default:
                        redirectPath = '/dashboard';
                }
                
                log('Redirecting to:', redirectPath);
                router.push(redirectPath);
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (error) {
            log('Login error:', error);
            setError('An error occurred during login');
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
