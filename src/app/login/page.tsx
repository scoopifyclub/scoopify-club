'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

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
    // Add debug info to check existing cookies
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken=')) || 
                              cookies.find(cookie => cookie.trim().startsWith('accessToken_client='));
      
      if (accessTokenCookie) {
        console.log('User already has an access token, redirecting to dashboard');
        setDebugInfo('Found token, redirecting to /customer/dashboard');
        
        // Store token in sessionStorage as a backup
        try {
          const tokenValue = accessTokenCookie.split('=')[1].trim();
          sessionStorage.setItem('accessToken', tokenValue);
        } catch (err) {
          console.error('Failed to store token in sessionStorage:', err);
        }
        
        // Use window location for hard redirect instead of router
        window.location.href = '/customer/dashboard';
      } else {
        setDebugInfo('No access token found, showing login form');
      }
    };
    
    checkAuth();

    if (searchParams.get('signup') === 'success') {
      setError('Account created successfully! Please log in.')
    }
  }, [searchParams, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', formData)
    setLoading(true)
    setError(null)
    setDebugInfo('Attempting login...')

    try {
      console.log('Attempting customer login...')
      // Try customer login first
      let response = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include', // Important for cookies
      }).catch(err => {
        console.error('Fetch error:', err)
        throw new Error('Network error occurred')
      })

      if (!response) {
        throw new Error('No response from server')
      }

      let data = await response.json().catch(err => {
        console.error('JSON parse error:', err)
        throw new Error('Failed to parse server response')
      })
      
      console.log('Customer login response:', { status: response.status, data })
      setDebugInfo(`Login response: ${response.status}, checking cookies...`)

      // If customer login fails with 403, try employee login
      if (response.status === 403) {
        console.log('Not a customer, trying employee login...')
        response = await fetch('/api/auth/employee-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
          credentials: 'include', // Important for cookies
        }).catch(err => {
          console.error('Employee login fetch error:', err)
          throw new Error('Network error occurred during employee login')
        })

        if (!response) {
          throw new Error('No response from server during employee login')
        }

        data = await response.json().catch(err => {
          console.error('Employee login JSON parse error:', err)
          throw new Error('Failed to parse server response during employee login')
        })
        console.log('Employee login response:', { status: response.status, data })
      }

      if (!response.ok) {
        console.error('Login failed:', data)
        if (response.status === 429) {
          setError('Too many login attempts. Please try again later.')
        } else {
          setError(data.message || data.error || 'Invalid email or password')
        }
        return
      }

      console.log('Login successful, response data:', data)
      
      // Display cookie info for debugging
      const cookies = document.cookie.split(';');
      const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken=')) ||
                              cookies.find(cookie => cookie.trim().startsWith('accessToken_client='));
      const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('refreshToken=')) ||
                              cookies.find(cookie => cookie.trim().startsWith('refreshToken_client='));
      
      setDebugInfo(`Login successful. Token present: ${!!accessTokenCookie}. Cookie values: ${cookies.map(c => c.trim()).join(', ')}. Setting redirect...`)

      // Check if we have the necessary data
      if (!data.user || !data.user.role) {
        console.error('Missing user data or role:', data)
        setError('Invalid server response')
        return
      }

      console.log('User role:', data.user.role)
      
      // Manually set cookies if they're in the response but not set automatically
      if (data.accessToken && !accessTokenCookie) {
        console.log('Manually setting accessToken cookie');
        document.cookie = `accessToken_client=${data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        
        // Also store in sessionStorage as a fallback
        try {
          sessionStorage.setItem('accessToken', data.accessToken);
          console.log('Token stored in sessionStorage');
        } catch (err) {
          console.error('Failed to store token in sessionStorage:', err);
        }
      }
      
      if (data.refreshToken && !refreshTokenCookie) {
        console.log('Manually setting refreshToken cookie');
        document.cookie = `refreshToken_client=${data.refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        
        // Also store in sessionStorage as a fallback
        try {
          sessionStorage.setItem('refreshToken', data.refreshToken);
          console.log('Refresh token stored in sessionStorage');
        } catch (err) {
          console.error('Failed to store refresh token in sessionStorage:', err);
        }
      }
      
      // Determine redirect path with updated paths
      let redirectPath = '/customer/dashboard' // default for customers
      if (data.user.role === 'EMPLOYEE') {
        redirectPath = '/employee/dashboard'
      } else if (data.user.role === 'ADMIN') {
        redirectPath = '/admin/dashboard'
      }
      
      console.log('Redirecting to:', redirectPath)
      
      // Add slight delay before redirect to make sure cookies are set
      setTimeout(() => {
        // Check cookies again before redirecting
        const finalCookies = document.cookie.split(';');
        const finalAccessToken = finalCookies.find(cookie => cookie.trim().startsWith('accessToken=')) ||
                               finalCookies.find(cookie => cookie.trim().startsWith('accessToken_client='));
        console.log('Final cookie check before redirect:', finalCookies.map(c => c.trim()).join(', '));
        
        let hasToken = !!finalAccessToken;
        
        // Also check sessionStorage as a fallback
        if (!hasToken) {
          try {
            hasToken = !!sessionStorage.getItem('accessToken');
            console.log('Token found in sessionStorage:', hasToken);
          } catch (err) {
            console.error('Error checking sessionStorage:', err);
          }
        }
        
        if (!hasToken) {
          setError('Failed to set authentication token. Please try again.');
          setDebugInfo('No access token cookie found after login attempt');
          return;
        }
        
        // Force a hard navigation
        window.location.href = redirectPath;
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred during login')
      setDebugInfo(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

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

            <div className="text-sm text-center mt-4">
              <p>Test Accounts:</p>
              <p>Customer: demo@example.com / demo123</p>
              <p>Employee: employee@scoopify.com / demo123</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 