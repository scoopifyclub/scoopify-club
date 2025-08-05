'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AutomationDashboard from '@/components/AutomationDashboard';

export default function AutomationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/me', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Not authenticated');
        }

        const data = await response.json();
        if (data.role !== 'ADMIN') {
          throw new Error('Not authorized');
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication check failed:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and control your self-running business automation systems
          </p>
        </div>
      </div>

      <AutomationDashboard />
    </div>
  );
} 