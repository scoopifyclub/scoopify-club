'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

// Helper function to generate a stable fingerprint for the device
function getDeviceFingerprint() {
  // Check if we already have a fingerprint in localStorage
  const existingFingerprint = localStorage.getItem('deviceFingerprint');
  if (existingFingerprint) {
    return existingFingerprint;
  }
  
  // Generate a new fingerprint and save it
  const newFingerprint = 'web-' + Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
  localStorage.setItem('deviceFingerprint', newFingerprint);
  return newFingerprint;
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

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
        setDebugInfo('Checking for existing session...');
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        
        setDebugInfo(`Session check response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          setDebugInfo(`Session data: ${JSON.stringify(data)}`);
          
          if (data.user) {
            // Don't redirect automatically if we have a callbackUrl query param
            // This prevents redirect loops if the destination page has auth issues
            const callbackUrl = searchParams.get('callbackUrl');
            
            if (callbackUrl) {
              setDebugInfo(`Found active session, but not redirecting automatically because callbackUrl=${callbackUrl} is present. This prevents redirect loops.`);
              return;
            }
            
            // Determine redirect path based on user role
            let redirectPath = '/customer/dashboard';
            if (data.user.role === 'EMPLOYEE') {
              redirectPath = '/employee/dashboard';
            } else if (data.user.role === 'ADMIN') {
              redirectPath = '/admin/dashboard';
            }
            
            // Create a debugging button instead of automatic redirect
            setDebugInfo(`Found active session for ${data.user.email} (${data.user.role}). You can click "Continue to Dashboard" to proceed.`);
            
            // Add a continue button that users can click
            document.getElementById('continue-button')?.classList.remove('hidden');
            
            // Store the redirect path for the continue button to use
            sessionStorage.setItem('dashboardRedirectPath', redirectPath);
          } else {
            setDebugInfo('Session exists but no user data found, showing login form');
          }
        } else {
          setDebugInfo(`Session check failed with status ${response.status}, showing login form`);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setDebugInfo(`Error checking session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    checkSession();

    if (searchParams.get('signup') === 'success') {
      setError('Account created successfully! Please log in.')
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setDebugInfo('Attempting login...')

    try {
      // Get consistent device fingerprint
      const deviceFingerprint = getDeviceFingerprint();
      setDebugInfo(`Using device fingerprint: ${deviceFingerprint.substring(0, 8)}...`);
      
      // For admin login, use NextAuth
      if (formData.email === 'admin@scoopify.club') {
        setDebugInfo('Admin login detected, using NextAuth...');
        const { signIn } = await import('next-auth/react')
        const result = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
          callbackUrl: '/admin/dashboard'
        })

        if (result?.error) {
          setError('Invalid admin credentials')
          setDebugInfo(`Admin login failed: ${result.error}`);
          return
        }

        setDebugInfo('Admin login successful, redirecting...');
        window.location.href = '/admin/dashboard'
        return
      }

      // For regular users, use the signin endpoint
      setDebugInfo(`Regular login for ${formData.email}, using signin endpoint...`);
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          deviceFingerprint
        }),
        credentials: 'include',
      })

      setDebugInfo(`Signin response status: ${response.status}`);
      
      if (!response.ok) {
        const data = await response.json()
        if (response.status === 429) {
          setError('Too many login attempts. Please try again later.')
          setDebugInfo('Rate limit exceeded');
        } else {
          setError(data.error || 'Invalid email or password')
          setDebugInfo(`Login error: ${data.error || 'Unknown error'}`);
        }
        return
      }

      const data = await response.json()
      setDebugInfo(`Login successful for user: ${data.user.email} (${data.user.role})`);
      
      // Determine redirect path based on user role
      let redirectPath = '/customer/dashboard'
      if (data.user.role === 'EMPLOYEE') {
        redirectPath = '/employee/dashboard'
      } else if (data.user.role === 'ADMIN') {
        redirectPath = '/admin/dashboard'
      }

      setDebugInfo(`Redirecting to ${redirectPath}...`);
      window.location.href = redirectPath
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred during login. Please try again.')
      setDebugInfo(`Login exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false)
    }
  }

  // Add a continue to dashboard handler 
  const continueToDashboard = () => {
    const redirectPath = sessionStorage.getItem('dashboardRedirectPath') || '/customer/dashboard';
    setDebugInfo(`Manually continuing to ${redirectPath}...`);
    window.location.href = redirectPath;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div 
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {debugInfo && (
              <div 
                className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">Debug: {debugInfo}</span>
              </div>
            )}

            <div id="continue-button" className="hidden">
              <Button
                type="button"
                onClick={continueToDashboard}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Continue to Dashboard
              </Button>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
      </div>
    </div>
  )
} 