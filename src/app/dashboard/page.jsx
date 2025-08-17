'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CustomerDashboardLayout } from '@/components/layouts/CustomerDashboardLayout';
import { Calendar, Clock, DollarSign, MapPin } from 'lucide-react';
export default function CustomerDashboard() {
    const [customerData, setCustomerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const [services, setServices] = useState([]);
    const [payments, setPayments] = useState([]);
    const fetchServices = async () => {
        try {
            const response = await fetch('/api/customer/services', {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch services');
            }
            const data = await response.json();
            setServices(data.data || data.services || []);
        }
        catch (err) {
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
            setPayments(data.payments || data || []);
        }
        catch (err) {
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
                    }
                    else if (data.user.role === 'ADMIN') {
                        router.push('/admin/dashboard');
                    }
                    return;
                }
                // Set customer data
                setCustomerData(data.user);
                // Fetch additional data
                await Promise.all([
                    fetchServices(),
                    fetchPayments()
                ]);
            }
            catch (err) {
                console.error('Error fetching customer data:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                toast.error('Failed to load dashboard data');
            }
            finally {
                setLoading(false);
            }
        };
        fetchCustomerData();
    }, [router]);
    const handleSkipService = async (serviceId) => {
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
        }
        catch (error) {
            console.error('Error skipping service:', error);
            toast.error('Failed to skip service');
        }
    };
    if (loading) {
        return (<CustomerDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </CustomerDashboardLayout>);
    }
    if (error) {
        return (<CustomerDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
              Try Again
            </Button>
          </div>
        </div>
      </CustomerDashboardLayout>);
    }
    if (!customerData) {
        return (<CustomerDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
          <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700">
            <p className="font-medium">No customer data found</p>
            <button onClick={() => router.push('/login')} className="mt-4 text-sm text-yellow-600 hover:text-yellow-800">
              Return to Login
            </button>
          </div>
        </div>
      </CustomerDashboardLayout>);
    }
    // Dynamic metrics based on actual customer data
    const nextService = services.find(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS');
    const totalSpent = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    const metrics = [
        {
            title: "Next Service",
            value: nextService ? new Date(nextService.scheduledDate).toLocaleDateString() : "None",
            icon: Calendar,
            color: "text-brand-primary"
        },
        {
            title: "Total Services",
            value: services.length.toString(),
            icon: Clock,
            color: "text-accent-secondary"
        },
        {
            title: "Total Spent",
            value: `$${totalSpent.toFixed(2)}`,
            icon: DollarSign,
            color: "text-green-500"
        },
        {
            title: "Active Services",
            value: services.filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS').length.toString(),
            icon: MapPin,
            color: "text-blue-500"
        }
    ];
    return (<CustomerDashboardLayout>
      <div className="min-h-screen bg-neutral-50">
        <main className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome back, {customerData?.name || 'there'}!</h1>
            <p className="text-neutral-600 mt-2">Here's what's happening with your service</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric) => (<div key={metric.title} className="card group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{metric.title}</p>
                    <p className="text-2xl font-bold mt-1">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-${metric.color.split('-')[1]}/10`}>
                    <metric.icon className={`w-6 h-6 ${metric.color}`}/>
                  </div>
                </div>
              </div>))}
          </div>

          {/* Schedule Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upcoming Appointments */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-xl font-semibold mb-6">Upcoming Appointments</h2>
                <div className="space-y-4">
                  {services.length > 0 ? (
                    services.slice(0, 3).map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                        <div>
                          <p className="font-medium">
                            {service.scheduledDate ? new Date(service.scheduledDate).toLocaleDateString() : 'TBD'}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {service.servicePlan?.name || 'Standard Service'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            service.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                            service.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {service.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      <p>No upcoming services scheduled</p>
                      <Button 
                        className="mt-2" 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/dashboard/services')}
                      >
                        Schedule Your First Service
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="card">
                <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
                <div className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push('/dashboard/services')}
                  >
                    <Calendar className="w-4 h-4 mr-2"/>
                    Schedule New Cleanup
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push('/dashboard/services')}
                  >
                    <MapPin className="w-4 h-4 mr-2"/>
                    View Service History
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push('/dashboard/billing')}
                  >
                    <DollarSign className="w-4 h-4 mr-2"/>
                    View Billing History
                  </Button>
                </div>
              </div>

              {/* Service Status */}
              <div className="card mt-6">
                <h2 className="text-xl font-semibold mb-4">Service Status</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Total Services</span>
                    <span className="font-medium">{services.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Completed</span>
                    <span className="font-medium">
                      {services.filter(s => s.status === 'COMPLETED').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Pending</span>
                    <span className="font-medium">
                      {services.filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </CustomerDashboardLayout>);
}
