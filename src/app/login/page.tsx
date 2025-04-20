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
    const checkAuth = async () => {
      // Check if we're coming from a logout
      const isFromLogout = sessionStorage.getItem('justLoggedOut');
      if (isFromLogout) {
        // Clear the flag
        sessionStorage.removeItem('justLoggedOut');
        setDebugInfo('Just logged out, showing login form');
        return;
      }

      const cookies = document.cookie.split(';');
      const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken=')) || 
                              cookies.find(cookie => cookie.trim().startsWith('accessToken_client='));
      
      if (accessTokenCookie) {
        // Verify the token is still valid
        try {
          console.log('Checking existing token validity...');
          const response = await fetch('/api/auth/session', {
            credentials: 'include'
          });
          
          if (!response.ok) {
            console.log('Token invalid, showing login form');
            setDebugInfo('Token invalid, please log in');
            return;
          }

          // Safely parse the JSON response
          let data;
          try {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
            console.log('Session data:', data);
          } catch (parseError) {
            console.error('Error parsing session response:', parseError);
            setDebugInfo('Error parsing session data, please log in');
            return;
          }

          console.log('User already has a valid token, redirecting to dashboard');
          
          // Determine redirect path based on user role
          let redirectPath = '/customer/dashboard'; // default
          if (data?.user?.role === 'EMPLOYEE') {
            redirectPath = '/employee/dashboard';
          } else if (data?.user?.role === 'ADMIN') {
            redirectPath = '/admin/dashboard';
          }
          
          setDebugInfo(`Found valid token for ${data?.user?.role || 'user'}, redirecting to ${redirectPath}`);
          
          // Store token in sessionStorage as a backup
          try {
            const tokenValue = accessTokenCookie.split('=')[1].trim();
            sessionStorage.setItem('accessToken', tokenValue);
          } catch (err) {
            console.error('Failed to store token in sessionStorage:', err);
          }
          
          // Use window location for hard redirect instead of router
          window.location.href = redirectPath;
        } catch (error) {
          console.error('Error verifying token:', error);
          setDebugInfo('Error verifying token, please log in');
        }
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
      // For admin login, only use NextAuth
      if (formData.email === 'admin@scoopify.club') {
        console.log('Admin login detected, attempting login')
        setDebugInfo('Admin login detected, attempting login')
        
        try {
          // First try the dedicated admin login endpoint
          const adminResponse = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            credentials: 'include',
          });
          
          if (adminResponse.ok) {
            const data = await adminResponse.json();
            console.log('Admin login successful via admin endpoint:', data);
            setDebugInfo('Admin login successful via admin endpoint');
            
            // Redirect to admin dashboard
            window.location.href = '/admin/dashboard';
            return;
          }
          
          console.log('Admin endpoint login failed, trying NextAuth');
          setDebugInfo('Admin endpoint login failed, trying NextAuth');
          
          // Fallback to NextAuth if admin login fails
          const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'
          const { signIn } = await import('next-auth/react')
          
          setDebugInfo('Signing in with NextAuth credentials provider...')
          const result = await signIn('credentials', {
            redirect: false,
            email: formData.email,
            password: formData.password,
            callbackUrl
          })
          
          console.log('NextAuth login result for admin:', result)
          
          if (result?.error) {
            console.error('Admin login failed:', result.error)
            setError('Invalid admin credentials')
            return
          }
          
          // Admin login successful
          console.log('Admin login successful, redirecting to:', result?.url)
          setDebugInfo('Admin login successful, redirecting to admin dashboard')
          
          // Use a slight delay to ensure NextAuth has time to set cookies
          setTimeout(() => {
            // Force a hard navigation to the admin dashboard
            window.location.href = result?.url || '/admin/dashboard'
          }, 500)
          return
        } catch (error) {
          console.error('Error during admin login:', error)
          setError('An error occurred during admin login. Please try again.')
          return
        }
      }
      
      // For non-admin users, first try custom endpoints
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
        // For admin users that somehow made it here instead of the NextAuth flow
        // Initialize NextAuth session before redirecting
        try {
          console.log('Admin user detected, initializing NextAuth session');
          const { signIn } = await import('next-auth/react');
          await signIn('credentials', {
            redirect: false,
            email: formData.email,
            password: formData.password
          });
        } catch (err) {
          console.error('Error initializing NextAuth session for admin:', err);
        }
        redirectPath = '/admin/dashboard'
      }
      
      console.log('Redirecting to:', redirectPath)
      
      // Force a hard navigation immediately
      window.location.href = redirectPath;
      
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