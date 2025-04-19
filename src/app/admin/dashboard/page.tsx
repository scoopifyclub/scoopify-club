'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboardLayout } from '@/components/layouts/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface DashboardStats {
  totalCustomers: number;
  totalEmployees: number;
  activeServices: number;
  monthlyRevenue: number;
  serviceCompletion: {
    completed: number;
    total: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch admin data');
        }

        const data = await response.json();
        
        // Check if user is an admin
        if (data.user.role !== 'ADMIN') {
          // Redirect based on role
          if (data.user.role === 'CUSTOMER') {
            router.push('/dashboard');
          } else if (data.user.role === 'EMPLOYEE') {
            router.push('/employee/dashboard');
          }
          return;
        }

        // Fetch dashboard stats
        const statsResponse = await fetch('/api/admin/stats', {
          credentials: 'include'
        });
        
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [router]);

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (error) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalCustomers}</p>
          </CardContent>
        </Card>

        {/* Total Employees */}
        <Card>
          <CardHeader>
            <CardTitle>Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalEmployees}</p>
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card>
          <CardHeader>
            <CardTitle>Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.activeServices}</p>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${stats?.monthlyRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Service Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Service Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.serviceCompletion ? 
                Math.round((stats.serviceCompletion.completed / stats.serviceCompletion.total) * 100)
              : 0}%
            </p>
            <p className="text-sm text-gray-600">
              {stats?.serviceCompletion.completed} of {stats?.serviceCompletion.total} services completed
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
} 