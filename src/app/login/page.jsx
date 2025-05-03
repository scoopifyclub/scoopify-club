'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
// Helper function to generate a stable fingerprint for the device
function getDeviceFingerprint() {
    // Check if we already have a fingerprint in localStorage
    const existingFingerprint = localStorage.getItem('deviceFingerprint');
    if (existingFingerprint) {
        return existingFingerprint;
    }
    // Generate a new fingerprint and save it
    // Use a more stable format that includes domain to make it more consistent
    const newFingerprint = 'scoopifyclub-' +
        Math.random().toString(36).substring(2, 10) +
        '-' + Date.now().toString(36);
    localStorage.setItem('deviceFingerprint', newFingerprint);
    return newFingerprint;
}

export default function LoginPage() {
    const [hasStaleCookie, setHasStaleCookie] = useState(false);

    useEffect(() => {
        // Check for stale cookies
        const cookies = document.cookie.split(';').map(c => c.trim());
        const hasToken = cookies.some(c => c.startsWith('token='));
        const hasAdminToken = cookies.some(c => c.startsWith('adminToken='));
        setHasStaleCookie(hasToken || hasAdminToken);
    }, []);

    const handleClearCookies = () => {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.reload();
    };

    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    useEffect(() => {
        // Check if we're coming from a logout
        const isFromLogout = sessionStorage.getItem('justLoggedOut');
        if (isFromLogout) {
            sessionStorage.removeItem('justLoggedOut');
            setDebugInfo('Just logged out, showing login form');
            return;
        }
        // Check for existing session
        const checkSession = async () => {
            try {
                console.log('Checking for existing session...');
                const response = await fetch('/api/auth/session', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                });

                console.log('Session check response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.authenticated && data.user) {
                        console.log('Existing session found, redirecting to dashboard...');
                        setDebugInfo('Session exists, redirecting to dashboard');
                        
                        // Check user role to determine where to redirect
                        const role = data.user.role?.toUpperCase();
                        switch(role) {
                            case 'ADMIN':
                                router.push('/admin/dashboard');
                                break;
                            case 'EMPLOYEE':
                                router.push('/employee/dashboard');
                                break;
                            case 'CUSTOMER':
                            default:
                                router.push('/dashboard');
                                break;
                        }
                    } else {
                        setDebugInfo('Session exists but no user data found, showing login form');
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    setDebugInfo(`Session check failed with status ${response.status}: ${errorData.error || 'Unknown error'}, showing login form`);
                }
            } catch (error) {
                console.error('Error checking session:', error);
                setDebugInfo(`Error checking session: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };
        checkSession();
        if (searchParams.get('signup') === 'success') {
            setError('Account created successfully! Please log in.');
        }
    }, [searchParams, router]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            console.log('Submitting login form...');
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email, password: formData.password }),
                credentials: 'include'
            });

            const data = await response.json();
            console.log('Login response status:', response.status);
            
            if (response.ok) {
                console.log('Login successful, redirecting...');
                
                // After successful login, check if cookies are set correctly
                const cookieCheck = document.cookie;
                console.log('Cookies after login:', cookieCheck ? 'Present' : 'None');
                
                // Redirect based on user role
                if (data.user && data.user.role) {
                    const role = data.user.role.toUpperCase();
                    switch(role) {
                        case 'ADMIN':
                            router.push('/admin/dashboard');
                            break;
                        case 'EMPLOYEE':
                            router.push('/employee/dashboard');
                            break;
                        case 'CUSTOMER':
                        default:
                            router.push('/dashboard');
                            break;
                    }
                } else {
                    router.push('/dashboard');
                }
            } else {
                console.error('Login failed:', data.error);
                setError(data.error || 'Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('An error occurred during login. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    // Add a continue to dashboard handler 
    const continueToDashboard = () => {
        const redirectPath = sessionStorage.getItem('dashboardRedirectPath') || '/customer/dashboard';
        setDebugInfo(`Manually continuing to ${redirectPath}...`);
        window.location.href = redirectPath;
    };
    return (<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <Card className="max-w-md w-full p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Scoopify</h1>
            <p className="text-sm text-gray-500 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {debugInfo && (
            <div className="bg-blue-50 text-blue-600 p-3 rounded-md text-sm">
              Debug: {debugInfo}
            </div>
          )}

          {hasStaleCookie && (
            <div className="p-4 mb-4 bg-red-100 border border-red-300 text-red-700 rounded">
                <p>
                    We detected a stuck session. Click below to clear your session and try logging in again.
                </p>
                <button
                    onClick={handleClearCookies}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    type="button"
                >
                    Clear Session & Retry
                </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-1">
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  autoComplete="email" 
                  required 
                  value={formData.email} 
                  onChange={handleChange} 
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-1">
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  autoComplete="current-password" 
                  required 
                  value={formData.password} 
                  onChange={handleChange} 
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              <p>Test Accounts:</p>
              <p>Admin: admin@scoopify.club / admin123</p>
              <p>Customer: demo@example.com / demo123</p>
              <p>Employee: employee@scoopify.club / employee123</p>
            </div>
          </form>
        </div>
      </Card>
    </div>);
}
