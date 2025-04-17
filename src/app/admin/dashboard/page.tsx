'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  MapIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  PhotoIcon, 
  ClipboardDocumentCheckIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import ServiceHistory from '@/components/ServiceHistory';
import { 
  Mail, Phone, Clock, CheckCircle, XCircle, Calendar, Users, DollarSign, 
  BarChart2, TrendingUp, Star, AlertCircle, ArrowRight, MapPin 
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
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { format } from 'date-fns';

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

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

interface Service {
  id: string;
  status: string;
  scheduledFor: string;
  claimedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  customer: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    gateCode: string | null;
  };
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

interface Customer {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  serviceDay: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const center = {
  lat: 37.7749,
  lng: -122.4194,
};

const getMarkerColor = (status: string) => {
  switch (status) {
    case 'SCHEDULED':
      return 'blue';
    case 'CLAIMED':
      return 'yellow';
    case 'COMPLETED':
      return 'green';
    case 'EXPIRED':
      return 'red';
    default:
      return 'gray';
  }
};

export default function AdminDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/admin/login');
            return;
          }
          throw new Error('Failed to fetch session data');
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

        // If authenticated as admin, fetch dashboard data
        fetchEmployees();
        fetchMetrics();
        fetchServiceOverview();
        fetchAnalytics();
        fetchFailedPayments();
        fetchStats();
        fetchServices();
        fetchCustomers();
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error checking auth:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      } else {
        throw new Error('Failed to fetch services');
      }
    } catch (err) {
      setError('Failed to load services');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch customers');
      
      const data = await response.json();
      setCustomers(data.customers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
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
    document.cookie = 'userType=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/admin/login')
  }

  const getDayColor = (day: string) => {
    const colors: { [key: string]: string } = {
      'Monday': 'blue',
      'Tuesday': 'green',
      'Wednesday': 'yellow',
      'Thursday': 'orange',
      'Friday': 'red',
      'Saturday': 'purple',
      'Sunday': 'pink'
    };
    return colors[day] || 'gray';
  };

  const filteredCustomers = selectedDay 
    ? customers.filter(c => c.serviceDay === selectedDay)
    : customers;

  const markers = filteredCustomers.map(customer => ({
    position: customer.coordinates,
    title: customer.name,
    description: `${customer.address} - Service Day: ${customer.serviceDay}`,
    color: getDayColor(customer.serviceDay)
  }));

  const navigationItems = [
    { name: 'Map Overview', icon: MapIcon, href: '/admin/dashboard' },
    { name: 'Jobs & Scheduling', icon: CalendarIcon, href: '/admin/jobs' },
    { name: 'Employee Activity', icon: UserGroupIcon, href: '/admin/employees' },
    { name: 'Photos & Checklists', icon: PhotoIcon, href: '/admin/photos' },
    { name: 'Customer Management', icon: UserIcon, href: '/admin/customers' },
    { name: 'Analytics & Reporting', icon: ChartBarIcon, href: '/admin/analytics' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="bg-red-50 p-4 rounded-lg text-red-700">
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => router.push('/admin/login')}
            className="mt-4 text-sm text-red-600 hover:text-red-800"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className="flex items-center w-full p-2 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Map Overview</h2>
          <p className="text-gray-600">View all subscribers by service day</p>
        </div>

        {/* Day Filter */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setSelectedDay(null)}
            className={`px-4 py-2 rounded-lg ${
              !selectedDay ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All Days
          </button>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg ${
                selectedDay === day ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          {loading ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[600px] text-red-500">
              {error}
            </div>
          ) : (
            <div className="h-[600px]">
              <Map
                center={[37.7749, -122.4194]} // Default to SF
                zoom={12}
                markers={markers}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800">Total Subscribers</h3>
            <p className="text-3xl font-bold text-blue-500">{customers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800">Active Jobs Today</h3>
            <p className="text-3xl font-bold text-green-500">
              {customers.filter(c => c.serviceDay === new Date().toLocaleDateString('en-US', { weekday: 'long' })).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800">Employees Active</h3>
            <p className="text-3xl font-bold text-purple-500">0</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
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

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-4">
              <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={12}
                >
                  {services.map((service) => {
                    if (!service.location) return null;
                    
                    return (
                      <Marker
                        key={service.id}
                        position={{
                          lat: service.location.latitude,
                          lng: service.location.longitude,
                        }}
                        icon={{
                          path: 'M10 0C4.48 0 0 4.48 0 10s10 22 10 22 10-17.52 10-22S15.52 0 10 0zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
                          fillColor: getMarkerColor(service.status),
                          fillOpacity: 1,
                          strokeWeight: 0,
                          scale: 1,
                        }}
                        onClick={() => setSelectedService(service)}
                      />
                    );
                  })}

                  {selectedService && selectedService.location && (
                    <InfoWindow
                      position={{
                        lat: selectedService.location.latitude,
                        lng: selectedService.location.longitude,
                      }}
                      onCloseClick={() => setSelectedService(null)}
                    >
                      <div className="p-2">
                        <h3 className="font-semibold">
                          {format(new Date(selectedService.scheduledFor), 'MMMM d, yyyy')}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedService.customer.address.street}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: {selectedService.status}
                        </p>
                        {selectedService.customer.gateCode && (
                          <p className="text-sm text-gray-600">
                            Gate Code: {selectedService.customer.gateCode}
                          </p>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            </Card>
          </div>

          <div>
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">Service Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Services</span>
                  <span className="font-semibold">{services.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Scheduled</span>
                  <span className="font-semibold">
                    {services.filter(s => s.status === 'SCHEDULED').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Claimed</span>
                  <span className="font-semibold">
                    {services.filter(s => s.status === 'CLAIMED').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-semibold">
                    {services.filter(s => s.status === 'COMPLETED').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Expired</span>
                  <span className="font-semibold">
                    {services.filter(s => s.status === 'EXPIRED').length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 