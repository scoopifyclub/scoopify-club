'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Invalid credentials');
            }
            const data = await response.json();
            
            // Set the token in cookies and redirect
            toast.success('Login successful!');
            router.push('/admin/dashboard');
            router.refresh();
        }
        catch (error) {
            console.error('Login error:', error);
            toast.error(error instanceof Error ? error.message : 'Invalid email or password');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Enter your credentials to access the admin dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required/>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required/>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !email || !password}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-center text-sm text-neutral-600">
            <p>Contact your system administrator for access credentials</p>
          </div>
        </form>
      </div>
    </div>);
}
