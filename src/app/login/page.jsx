'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { signIn } from 'next-auth/react';
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
                        console.log('Existing session found, showing dashboard button...');
                        setDebugInfo('Session exists, click button to continue to dashboard');
                        
                        // Store the redirect path in session storage based on role
                        const role = data.user.role?.toUpperCase();
                        let redirectPath = '/dashboard';
                        
                        switch(role) {
                            case 'ADMIN':
                                redirectPath = '/admin/dashboard';
                                break;
                            case 'EMPLOYEE':
                                redirectPath = '/employee/dashboard';
                                break;
                            case 'CUSTOMER':
                            default:
                                redirectPath = '/dashboard';
                                break;
                        }
                        
                        // Store the path but don't redirect automatically
                        sessionStorage.setItem('dashboardRedirectPath', redirectPath);
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
                
                // Use window.location.href for redirect to ensure cookies are properly handled
                if (data.redirectTo) {
                    console.log('Redirecting to:', data.redirectTo);
                    window.location.href = data.redirectTo;
                } else if (data.user && data.user.role) {
                    const role = data.user.role.toUpperCase();
                    let redirectPath = '/dashboard';
                    switch(role) {
                        case 'ADMIN':
                            redirectPath = '/admin/dashboard';
                            break;
                        case 'EMPLOYEE':
                            redirectPath = '/employee/dashboard';
                            break;
                        case 'CUSTOMER':
                        default:
                            redirectPath = '/dashboard';
                            break;
                    }
                    console.log('Redirecting to:', redirectPath);
                    window.location.href = redirectPath;
                } else {
                    console.log('Redirecting to default dashboard');
                    window.location.href = '/dashboard';
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
    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await signIn('google', { 
                callbackUrl: '/dashboard',
                redirect: false 
            });
            
            if (result?.error) {
                setError('Google sign-in failed. Please try again.');
            } else if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            setError('Google sign-in failed. Please try again.');
            console.error('Google sign-in error:', error);
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

          {debugInfo && debugInfo.includes('Session exists') && (
            <div className="mt-4">
              <Button 
                onClick={continueToDashboard}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Continue to Dashboard
              </Button>
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
            {/* Google Sign-in Button */}
            <div className="space-y-3">
              <Button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                </div>
              </div>
            </div>

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

            <div className="text-sm text-gray-500 text-center">
              <p>Don't have an account? <Link href="/signup" className="text-blue-600 hover:text-blue-800">Sign up here</Link></p>
              <p>Forgot your password? <Link href="/reset-password" className="text-blue-600 hover:text-blue-800">Reset it here</Link></p>
            </div>
          </form>
        </div>
      </Card>
    </div>);
}
