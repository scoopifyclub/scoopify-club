'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setError('Account created successfully! Please log in.')
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', formData)
    setLoading(true)
    setError(null)

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
        throw new Error(data.message || data.error || 'Failed to login')
      }

      console.log('Login successful, storing data...')
      // Store user data and token in localStorage
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)

      // Redirect based on role
      const redirectPath = data.user.role === 'CUSTOMER' 
        ? '/customer/dashboard'
        : data.user.role === 'EMPLOYEE'
          ? '/employee/dashboard'
          : '/admin/dashboard'

      console.log('Redirecting to:', redirectPath)
      router.push(redirectPath)
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during login')
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