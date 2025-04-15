'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

interface EmployeeData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  serviceAreas: Array<{
    id: string;
    zipCode: string;
  }>;
}

export default function EmployeeDashboard() {
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          router.push('/employee/login');
          return;
        }

        const response = await fetch('/api/auth/session', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/employee/login');
            return;
          }
          throw new Error('Failed to fetch employee data');
        }

        const data = await response.json();
        setEmployeeData(data.user.employee);
      } catch (err) {
        setError('Failed to load employee data');
        console.error('Error fetching employee data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
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

  if (!employeeData) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <p>No employee data found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome, {employeeData.name}!</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {employeeData.email}</p>
              <p><span className="font-medium">Phone:</span> {employeeData.phone}</p>
              <p><span className="font-medium">Status:</span> {employeeData.status}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Service Areas</h2>
            <div className="space-y-2">
              {employeeData.serviceAreas.map(area => (
                <p key={area.id}>ZIP Code: {area.zipCode}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 