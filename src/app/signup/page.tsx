'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SignupPage() {
  const [isEmployee, setIsEmployee] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!isEmployee && !phoneRegex.test(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          isEmployee,
          phone: !isEmployee ? phone : undefined,
          address: !isEmployee ? address : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
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
        document.cookie = `userType=${isEmployee ? 'employee' : 'customer'}; path=/; max-age=604800; SameSite=Lax; Secure`
        
        // Redirect based on user type
        if (isEmployee) {
          router.push('/employee/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        const data = await response.json();
        // Handle specific error messages
        switch (response.status) {
          case 400:
            setError(data.message || 'Invalid input data')
            break
          case 409:
            setError('An account with this email already exists')
            break
          case 419:
            setError('Your session has expired. Please try again.')
            break
          default:
            setError(data.message || 'Signup failed')
        }
      }
    } catch (err) {
      setError('An error occurred during signup. Please try again.')
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Create an Account</h1>
            <p className="text-neutral-600 mt-2">Join Scoopify today</p>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant={!isEmployee ? 'default' : 'outline'}
              onClick={() => setIsEmployee(false)}
            >
              Customer Signup
            </Button>
            <Button
              variant={isEmployee ? 'default' : 'outline'}
              onClick={() => setIsEmployee(true)}
            >
              Employee Signup
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            {!isEmployee && (
              <>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., +1234567890"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address, City, State, ZIP"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 8 chars with uppercase, lowercase, number, and special char"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 