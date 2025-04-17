'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Analytics {
  revenue: {
    total: number;
    recurring: number;
    oneTime: number;
    dailyData: Array<{
      date: string;
      total: number;
      recurring: number;
      oneTime: number;
    }>;
  };
  customers: {
    total: number;
    active: number;
    churned: number;
    retentionRate: number;
    acquisitionData: Array<{
      date: string;
      new: number;
      churned: number;
    }>;
  };
  services: {
    total: number;
    completed: number;
    cancelled: number;
    dailyData: Array<{
      date: string;
      total: number;
      completed: number;
      cancelled: number;
      avgDuration: number;
    }>;
  };
  employees: {
    performance: Array<{
      name: string;
      completedJobs: number;
      avgDuration: number;
      rating: number;
      revenue: number;
    }>;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const router = useRouter();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `/api/admin/analytics?start=${dateRange.start}&end=${dateRange.end}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-500">{error || 'Failed to load analytics'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="mt-2 text-gray-600">Track business performance and metrics</p>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6 flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(analytics.revenue.total)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Customers</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{analytics.customers.active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Retention Rate</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{formatPercent(analytics.customers.retentionRate)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {formatPercent(analytics.services.completed / analytics.services.total)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.revenue.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Total Revenue" />
                  <Line type="monotone" dataKey="recurring" stroke="#10B981" name="Recurring Revenue" />
                  <Line type="monotone" dataKey="oneTime" stroke="#6366F1" name="One-time Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Acquisition Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Acquisition</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.customers.acquisitionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="new" fill="#10B981" name="New Customers" />
                  <Bar dataKey="churned" fill="#EF4444" name="Churned Customers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Service Performance Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Service Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.services.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" />
                  <Line type="monotone" dataKey="cancelled" stroke="#EF4444" name="Cancelled" />
                  <Line type="monotone" dataKey="avgDuration" stroke="#6366F1" name="Avg Duration (min)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Employee Performance Table */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Jobs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.employees.performance.map((employee, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.completedJobs}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.avgDuration} min</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.rating.toFixed(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(employee.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 