'use client';

import { useState, useEffect } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, useRouter } from 'next/navigation';
import ServiceHistory from '@/components/ServiceHistory';
import { 
  Mail, Phone, Clock, CheckCircle, XCircle, Calendar, Users, DollarSign, 
  BarChart2, TrendingUp, Star, AlertCircle, ArrowRight 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  BarChart, Bar, ResponsiveContainer 
} from 'recharts';
import ServiceAreaManager from '@/components/ServiceAreaManager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface PerformanceMetrics {
  totalServices: number;
  completedServices: number;
  averageTime: number;
  timeExtensions: number;
  cancellations: number;
}

interface ServiceOverview {
  today: number;
  upcoming: number;
  completed: number;
  pending: number;
}

interface AnalyticsData {
  dailyTrends: Array<{
    date: string;
    total: number;
    completed: number;
    cancelled: number;
    revenue: number;
    timeExtensions: number;
  }>;
  employeePerformance: Array<{
    name: string;
    totalServices: number;
    completedServices: number;
    totalRevenue: number;
    averageRating: number;
    timeExtensions: number;
  }>;
  totalRevenue: number;
  totalServices: number;
  completedServices: number;
  cancelledServices: number;
}

interface FailedPaymentSummary {
  count: number;
  totalAmount: number;
  recentPayments: Array<{
    id: string;
    customerName: string;
    amount: number;
    date: string;
  }>;
}

interface DashboardStats {
  totalCustomers: number;
  totalEmployees: number;
  activeSubscriptions: number;
  pendingServices: number;
}

export default function AdminDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [serviceOverview, setServiceOverview] = useState<ServiceOverview | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [failedPayments, setFailedPayments] = useState<FailedPaymentSummary | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchEmployees();
    fetchMetrics();
    fetchServiceOverview();
    fetchAnalytics();
    fetchFailedPayments();
    fetchStats();
  }, [selectedEmployeeId, dateRange]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/employees');
      const data = await response.json();
      setEmployees(data);
      if (data.length > 0) {
        setSelectedEmployeeId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    if (!selectedEmployeeId) return;
    try {
      const response = await fetch(`/api/admin/employees/${selectedEmployeeId}/metrics`);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchServiceOverview = async () => {
    try {
      const response = await fetch('/api/admin/services/overview');
      const data = await response.json();
      setServiceOverview(data);
    } catch (error) {
      console.error('Error fetching service overview:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `/api/admin/analytics?startDate=${dateRange.start}&endDate=${dateRange.end}&employeeId=${selectedEmployeeId}`
      );
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchFailedPayments = async () => {
    try {
      const response = await fetch('/api/admin/failed-payments/summary');
      const data = await response.json();
      setFailedPayments(data);
    } catch (error) {
      console.error('Error fetching failed payments summary:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage) return;

    setSendingEmail(true);
    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      if (response.ok) {
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailMessage('');
        alert('Email sent successfully!');
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/admin/login')
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Date Range Selector */}
        <div className="mb-8 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Service Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Today's Services</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{serviceOverview?.today || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold">Upcoming</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{serviceOverview?.upcoming || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Completed</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{serviceOverview?.completed || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Pending</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{serviceOverview?.pending || 0}</p>
          </div>
        </div>

        {/* Analytics Charts */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Service Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#22c55e" name="Completed" />
                  <Line type="monotone" dataKey="cancelled" stroke="#ef4444" name="Cancelled" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Employee Performance Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Employee Activity History</h2>
              <div className="flex items-center gap-4">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.phone})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </button>
              </div>
            </div>

            {/* Performance Metrics */}
            {metrics && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Completion Rate</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {Math.round((metrics.completedServices / metrics.totalServices) * 100)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Avg. Time</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{metrics.averageTime} min</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Time Extensions</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{metrics.timeExtensions}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Cancellations</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{metrics.cancellations}</p>
                </div>
              </div>
            )}

            <ServiceHistory employeeId={selectedEmployeeId} />
          </div>

          {/* Quick Stats Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span>Total Active Employees: {employees.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span>Total Revenue: ${analytics?.totalRevenue.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-purple-500" />
                <span>Total Services: {analytics?.totalServices || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                <span>Completion Rate: {analytics ? Math.round((analytics.completedServices / analytics.totalServices) * 100) : 0}%</span>
              </div>
            </div>

            {/* Employee Performance Table */}
            {analytics && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Employee Performance</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.employeePerformance.map((emp) => (
                        <tr key={emp.name}>
                          <td className="px-6 py-4 whitespace-nowrap">{emp.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {emp.completedServices}/{emp.totalServices}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">${emp.totalRevenue.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 mr-1" />
                              {emp.averageRating.toFixed(1)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Area Management Section */}
        <div className="mt-8">
          <ServiceAreaManager />
        </div>

        {/* Failed Payments Summary Card */}
        <Card className="p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-semibold">Failed Payments</h2>
            </div>
            <Link href="/admin/failed-payments">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : failedPayments ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Failed Payments</p>
                  <p className="text-2xl font-bold">{failedPayments.count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ${failedPayments.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {failedPayments.recentPayments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Recent Failed Payments</h3>
                  <div className="space-y-2">
                    {failedPayments.recentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex justify-between items-center py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{payment.customerName}</p>
                          <p className="text-sm text-gray-500">
                            ${payment.amount.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">No failed payments</div>
          )}
        </Card>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-neutral-600">Total Customers</h3>
            <p className="mt-2 text-3xl font-bold text-neutral-900">
              {stats?.totalCustomers || 0}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-neutral-600">Total Employees</h3>
            <p className="mt-2 text-3xl font-bold text-neutral-900">
              {stats?.totalEmployees || 0}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-neutral-600">Active Subscriptions</h3>
            <p className="mt-2 text-3xl font-bold text-neutral-900">
              {stats?.activeSubscriptions || 0}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-neutral-600">Pending Services</h3>
            <p className="mt-2 text-3xl font-bold text-neutral-900">
              {stats?.pendingServices || 0}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-neutral-900">Demo Accounts</h3>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-medium">Admin</h4>
                <p className="text-sm text-neutral-600">Email: admin@scoopify.com</p>
                <p className="text-sm text-neutral-600">Password: admin123</p>
              </div>
              <div>
                <h4 className="font-medium">Employee</h4>
                <p className="text-sm text-neutral-600">Email: employee@scoopify.com</p>
                <p className="text-sm text-neutral-600">Password: employee123</p>
              </div>
              <div>
                <h4 className="font-medium">Customer</h4>
                <p className="text-sm text-neutral-600">Email: customer@scoopify.com</p>
                <p className="text-sm text-neutral-600">Password: customer123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Send Email</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter email subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter your message"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !emailSubject || !emailMessage}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 