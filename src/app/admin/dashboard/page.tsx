'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboardLayout } from '@/components/layouts/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  UsersIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalCustomers: number;
  totalEmployees: number;
  activeServices: number;
  monthlyRevenue: number;
  serviceCompletion: {
    completed: number;
    total: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    status: string;
    customerName: string;
    employeeName: string;
    date: string;
  }>;
  paymentStats: {
    total: number;
    amount: number;
  };
  employeeStats: {
    averageRating: number;
    total: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.text();
      console.log('Stats Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized, redirecting to login');
          router.push('/admin/login');
          return;
        }
        
        let errorMessage;
        try {
          const errorData = JSON.parse(data);
          errorMessage = errorData.error || 'Failed to fetch dashboard stats';
        } catch (e) {
          errorMessage = data || 'Failed to fetch dashboard stats';
        }
        throw new Error(errorMessage);
      }
      
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed dashboard stats:', jsonData);
        setStats(jsonData);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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
            <Button 
              onClick={fetchDashboardStats}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (!stats) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center text-gray-600">
            <p>No data available</p>
            <Button 
              onClick={fetchDashboardStats}
              className="mt-4"
            >
              Refresh
            </Button>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const completionRate = stats.serviceCompletion.total > 0
    ? Math.round((stats.serviceCompletion.completed / stats.serviceCompletion.total) * 100)
    : 0;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Active customers this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                Average rating: {stats.employeeStats.averageRating.toFixed(1)}/5
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.paymentStats.total} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Completion</CardTitle>
              <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.serviceCompletion.completed} of {stats.serviceCompletion.total} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.type === 'service' ? 'Service' : 'Payment'} for {activity.customerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Assigned to {activity.employeeName}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={() => router.push('/admin/customers')}
            className="w-full"
          >
            Manage Customers
          </Button>
          <Button
            onClick={() => router.push('/admin/employees')}
            className="w-full"
          >
            Manage Employees
          </Button>
          <Button
            onClick={() => router.push('/admin/services')}
            className="w-full"
          >
            Schedule Services
          </Button>
          <Button
            onClick={() => router.push('/admin/payments')}
            className="w-full"
          >
            View Payments
          </Button>
        </div>
      </div>
    </AdminDashboardLayout>
  );
} 