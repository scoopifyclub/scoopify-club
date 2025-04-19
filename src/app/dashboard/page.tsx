'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CustomerDashboardLayout } from '@/components/layouts/CustomerDashboardLayout';
import { Calendar, CreditCard } from 'lucide-react';

interface CustomerData {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  subscription?: {
    id: string;
    status: string;
    startDate: string;
    endDate?: string;
    plan: {
      name: string;
      price: number;
      duration: number;
    };
  };
}

interface Service {
  id: string;
  status: string;
  scheduledDate: string;
  servicePlan: {
    name: string;
    price: number;
    duration: number;
  };
  employee?: {
    user: {
      name: string;
      email: string;
      image?: string;
    };
  };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
  service?: {
    id: string;
    status: string;
    scheduledDate: string;
    servicePlan: {
      name: string;
      price: number;
    };
  };
}

export default function CustomerDashboard() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/customer/services', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const data = await response.json();
      setServices(data.services);
    } catch (err) {
      console.error('Error fetching services:', err);
      toast.error('Failed to load services');
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/customer/payments', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      const data = await response.json();
      setPayments(data.payments);
    } catch (err) {
      console.error('Error fetching payments:', err);
      toast.error('Failed to load payments');
    }
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
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
          throw new Error('Failed to fetch customer data');
        }

        const data = await response.json();
        console.log('Session data:', data); // Debug log
        
        // Check if user is a customer
        if (data.user.role !== 'CUSTOMER') {
          // Redirect based on role
          if (data.user.role === 'EMPLOYEE') {
            router.push('/employee/dashboard');
          } else if (data.user.role === 'ADMIN') {
            router.push('/admin/dashboard');
          }
          return;
        }

        // Set customer data
        setCustomerData(data.user.customer);
        
        // Fetch additional data
        await Promise.all([
          fetchServices(),
          fetchPayments()
        ]);
      } catch (err) {
        console.error('Error fetching customer data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [router]);

  const handleSkipService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to skip this service? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/customer/services/${serviceId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to skip service');
      }

      toast.success('Service skipped successfully');
      fetchServices();
    } catch (error) {
      console.error('Error skipping service:', error);
      toast.error('Failed to skip service');
    }
  };

  if (loading) {
    return (
      <CustomerDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </CustomerDashboardLayout>
    );
  }

  if (error) {
    return (
      <CustomerDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
            >
              Try Again
            </Button>
          </div>
        </div>
      </CustomerDashboardLayout>
    );
  }

  if (!customerData) {
    return (
      <CustomerDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
          <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700">
            <p className="font-medium">No customer data found</p>
            <button 
              onClick={() => router.push('/login')}
              className="mt-4 text-sm text-yellow-600 hover:text-yellow-800"
            >
              Return to Login
            </button>
          </div>
        </div>
      </CustomerDashboardLayout>
    );
  }

  return (
    <CustomerDashboardLayout>
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
            <p className="text-gray-600">Here's what's happening with your cleaning services</p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard/services/schedule')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
          >
            Schedule Service
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-blue-100">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{services.filter(s => s.status === 'SCHEDULED').length}</div>
            <p className="text-blue-100 text-sm mt-1">Scheduled cleanings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-purple-100">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
            </div>
            <p className="text-purple-100 text-sm mt-1">Lifetime value</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-green-100">Completed Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{services.filter(s => s.status === 'COMPLETED').length}</div>
            <p className="text-green-100 text-sm mt-1">Successfully completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-orange-100">Next Service</CardTitle>
          </CardHeader>
          <CardContent>
            {services.find(s => s.status === 'SCHEDULED') ? (
              <>
                <div className="text-3xl font-bold">
                  {format(new Date(services.find(s => s.status === 'SCHEDULED')!.scheduledDate), 'MMM d')}
                </div>
                <p className="text-orange-100 text-sm mt-1">Upcoming cleaning</p>
              </>
            ) : (
              <>
                <div className="text-xl font-bold">No services scheduled</div>
                <p className="text-orange-100 text-sm mt-1">Schedule now</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Services */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Services</h2>
        <div className="space-y-4">
          {services.slice(0, 3).map((service) => (
            <div 
              key={service.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  service.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                  service.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{service.servicePlan.name}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(service.scheduledDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  service.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  service.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {service.status}
                </span>
                <span className="font-semibold text-gray-800">
                  ${service.servicePlan.price}
                </span>
              </div>
            </div>
          ))}
        </div>
        {services.length > 3 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/services')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All Services
            </Button>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Payments</h2>
        <div className="space-y-4">
          {payments.slice(0, 3).map((payment) => (
            <div 
              key={payment.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  payment.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{payment.type}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(payment.createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {payment.status}
                </span>
                <span className="font-semibold text-gray-800">
                  ${payment.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
        {payments.length > 3 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/billing')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All Payments
            </Button>
          </div>
        )}
      </div>
    </CustomerDashboardLayout>
  );
} 