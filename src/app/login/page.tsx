'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function LoginPage() {
  const [isEmployee, setIsEmployee] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          isEmployee,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Store the token in localStorage or cookies
        localStorage.setItem('token', data.token)
        localStorage.setItem('userType', isEmployee ? 'employee' : 'customer')
        
        // Redirect based on user type
        if (isEmployee) {
          router.push('/employee/dashboard')
        } else {
          router.push('/dashboard')
        }
      } else {
        const data = await response.json()
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred during login')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Welcome to Scoopify</h1>
            <p className="text-neutral-600 mt-2">Please sign in to continue</p>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant={!isEmployee ? 'default' : 'outline'}
              onClick={() => setIsEmployee(false)}
            >
              Customer Login
            </Button>
            <Button
              variant={isEmployee ? 'default' : 'outline'}
              onClick={() => setIsEmployee(true)}
            >
              Employee Login
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Don't have an account?{' '}
              <a href="/signup" className="text-brand-primary hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 