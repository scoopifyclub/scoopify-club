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
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/session', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch customer data');
        }

        const data = await response.json();
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!customerData) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <p>No customer data found</p>
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