'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

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

export default function CustomerDashboard() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  if (!customerData) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome, {customerData.name}!</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {customerData.email}</p>
              <p><span className="font-medium">Phone:</span> {customerData.phone}</p>
              <p><span className="font-medium">Status:</span> {customerData.status}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Service Address</h2>
            <div className="space-y-2">
              <p>{customerData.address.street}</p>
              <p>{customerData.address.city}, {customerData.address.state} {customerData.address.zipCode}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 