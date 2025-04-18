'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface Service {
  id: string;
  servicePlanId: string;
  status: string;
  scheduledDate: string;
  servicePlan: {
    name: string;
    price: number;
    duration: number;
  };
}

export default function CustomerDashboard() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetch('/api/auth/session');

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch customer data');
        }

        const data = await response.json();
        
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

        setCustomerData(data.user.customer);
      } catch (err) {
        setError('Failed to load customer data');
        console.error('Error fetching customer data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [router]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/customer/services', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    }
  };

  const handleSkipService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to skip this service? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/customer/services/${serviceId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
        <div className="bg-red-50 p-4 rounded-lg text-red-700">
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 text-sm text-red-600 hover:text-red-800"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Services</h1>
      
      <div className="grid gap-6">
        {services.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No upcoming services scheduled</p>
            </CardContent>
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{service.servicePlan.name}</span>
                  <span className="text-sm font-normal">
                    {format(new Date(service.scheduledDate), 'MMM d, yyyy h:mm a')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">
                      Duration: {service.servicePlan.duration} minutes
                    </p>
                    <p className="text-sm text-gray-500">
                      Price: ${service.servicePlan.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSkipService(service.id)}
                      disabled={new Date(service.scheduledDate) < new Date()}
                    >
                      Skip Service
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 