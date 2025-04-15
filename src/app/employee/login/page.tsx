'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function EmployeeLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Set secure cookies with proper attributes
        const cookieOptions = [
          `token=${data.token}`,
          'path=/',
          'max-age=604800', // 7 days
          'SameSite=Lax',
          'Secure',
          'HttpOnly'
        ].join('; ')
        
        document.cookie = cookieOptions
        document.cookie = `userType=employee; path=/; max-age=604800; SameSite=Lax; Secure`
        
        router.push('/employee/dashboard')
      } else {
        // Handle specific error messages
        switch (response.status) {
          case 401:
            setError('Invalid email or password')
            break
          case 403:
            setError('This account is not authorized for employee access')
            break
          case 404:
            setError('Employee record not found')
            break
          case 419: // Token expired
            setError('Your session has expired. Please log in again.')
            break
          default:
            setError(data.message || 'Login failed')
        }
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Employee Login</h1>
            <p className="text-neutral-600 mt-2">Access your employee dashboard</p>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'email-error' : undefined}
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
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'password-error' : undefined}
              />
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Not an employee?{' '}
              <a href="/login" className="text-brand-primary hover:underline">
                Customer Login
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 