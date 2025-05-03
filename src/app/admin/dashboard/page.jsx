'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BusinessPartnerManagement from '@/components/admin/BusinessPartnerManagement';
import ServiceAreaManagement from '@/components/admin/ServiceAreaManagement';
import { AdminDashboardLayout } from '@/components/layouts/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UsersIcon, UserGroupIcon, CurrencyDollarIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import ScooperOnboardingTable from './ScooperOnboardingTable';
import CoverageTable from './CoverageTable';
import CoverageMap from './CoverageMap';
import CoveragePriorityTable from './CoveragePriorityTable';
import CoverageAnalytics from './CoverageAnalytics';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import AdminRatings from '@/components/AdminRatings';

function NotifyAtRiskCustomersButton() {
  const [loading, setLoading] = useState(false);
  const handleNotify = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notify-at-risk-customers', { method: 'POST' });
      const data = await res.json();
      if (data.notified > 0) {
        toast.success('Customers Notified', { description: `${data.notified} at-risk customers emailed.` });
      } else {
        toast('No at-risk customers to notify.');
      }
    } catch (e) {
      toast.error('Error notifying customers');
    }
    setLoading(false);
  };
  return (
    <div className="mb-4 flex justify-end">
      <Button onClick={handleNotify} disabled={loading} variant="secondary">
        {loading ? 'Notifying...' : 'Notify At-Risk Customers'}
      </Button>
    </div>
  );
}


function CoverageRiskCheckButton() {
  const [loading, setLoading] = useState(false);
  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/monitor-coverage-risk', { method: 'POST' });
      const data = await res.json();
      if (data.atRiskZips && data.atRiskZips.length > 0) {
        toast.error('Coverage Risk!', { description: `At-risk zips: ${data.atRiskZips.join(', ')}` });
      } else {
        toast.success('All covered!', { description: 'No at-risk zips detected.' });
      }
    } catch (e) {
      toast.error('Error checking coverage risk');
    }
    setLoading(false);
  };
  return (
    <div className="mb-4 flex justify-end">
      <Button onClick={handleCheck} disabled={loading} variant="destructive">
        {loading ? 'Checking...' : 'Check Coverage Risk Now'}
      </Button>
    </div>
  );
}


export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    useEffect(() => {
        fetchDashboardStats();
        const interval = setInterval(fetchDashboardStats, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Admin verify fallback: check /api/admin/verify and handle 401
    useEffect(() => {
        const checkAdminVerify = async () => {
            try {
                const res = await fetch('/api/admin/verify', { credentials: 'include' });
                if (res.status === 401) {
                    setError('Session issue detected. Click below to reset your session and continue.');
                }
            } catch (e) {
                setError('Session verification error.');
            }
        };
        checkAdminVerify();
    }, []);

    const handleSessionReset = () => {
        // Expire both adminToken and token cookies for all paths
        document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.reload();
    };

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
                }
                catch (e) {
                    errorMessage = data || 'Failed to fetch dashboard stats';
                }
                throw new Error(errorMessage);
            }
            try {
                const jsonData = JSON.parse(data);
                console.log('Parsed dashboard stats:', jsonData);
                setStats(jsonData);
            }
            catch (e) {
                console.error('Error parsing JSON:', e);
                throw new Error('Invalid response format');
            }
        }
        catch (err) {
            console.error('Error fetching admin data:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            toast.error('Failed to load dashboard data');
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600">
                {error}<br />
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }
    if (!stats) {
        return (<AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center text-gray-600">
            <p>No data available</p>
            <Button onClick={fetchDashboardStats} className="mt-4">
              Refresh
            </Button>
          </div>
        </div>
      </AdminDashboardLayout>);
    }
    const completionRate = stats.serviceCompletion.total > 0
        ? Math.round((stats.serviceCompletion.completed / stats.serviceCompletion.total) * 100)
        : 0;
    return (<AdminDashboardLayout>
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground"/>
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
              <UserGroupIcon className="h-4 w-4 text-muted-foreground"/>
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
              <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground"/>
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
              <ChartBarIcon className="h-4 w-4 text-muted-foreground"/>
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
              {stats.recentActivity.map((activity) => (<div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <ClockIcon className="h-4 w-4 text-gray-500"/>
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
                </div>))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Ratings Overview */}
        <AdminRatings />

        {/* Scooper Onboarding Table */}
        <ScooperOnboardingTable />

        {/* Manual Coverage Risk Check */}
        <CoverageRiskCheckButton />

        {/* Coverage Analytics */}
        <CoverageAnalytics />

        {/* Notify At-Risk Customers */}
        <NotifyAtRiskCustomersButton />

        {/* Coverage Table */}
        <CoverageTable />

        {/* Coverage Map */}
        <CoverageMap />

        {/* Coverage Priority Table */}
        <CoveragePriorityTable />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button onClick={() => router.push('/admin/customers')} className="w-full">
            Manage Customers
          </Button>
          <Button onClick={() => router.push('/admin/employees')} className="w-full">
            Manage Employees
          </Button>
          <Button onClick={() => router.push('/admin/services')} className="w-full">
            Schedule Services
          </Button>
          <Button onClick={() => router.push('/admin/payments')} className="w-full">
            View Payments
          </Button>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-medium">Documentation</h3>
          <ul className="mt-2 space-y-2">
            <li>
              <Link href="/docs/payment-batches.md" className="text-primary hover:underline">
                Payment Batch System
              </Link>
            </li>
            {/* Other documentation links */}
          </ul>
        </div>
      </div>
    </AdminDashboardLayout>);
}
