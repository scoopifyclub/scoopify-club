'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { MapPinIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

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
    name: string;
  };
}

interface Employee {
  id: string;
  phone: string | null;
  address: string | null;
  cashAppUsername: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Earnings {
  monthlyEarnings: number;
  pendingPayments: number;
  completedServices: number;
  services: {
    amount: number;
    completedAt: string;
  }[];
  pendingPaymentsList: {
    amount: number;
    createdAt: string;
  }[];
}

export default function EmployeeDashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    cashAppUsername: ''
  });
  const [availableJobs, setAvailableJobs] = useState<Service[]>([]);
  const [claimedJobs, setClaimedJobs] = useState<Service[]>([]);
  const [jobHistory, setJobHistory] = useState<Service[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch employee profile
        const profileRes = await fetch('/api/employee/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!profileRes.ok) throw new Error('Failed to fetch profile');
        const profileData = await profileRes.json();
        setEmployee(profileData);
        setFormData({
          firstName: profileData.user.firstName,
          lastName: profileData.user.lastName,
          phone: profileData.phone || '',
          address: profileData.address || '',
          cashAppUsername: profileData.cashAppUsername || ''
        });

        // Fetch earnings
        const earningsRes = await fetch('/api/employee/earnings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!earningsRes.ok) throw new Error('Failed to fetch earnings');
        const earningsData = await earningsRes.json();
        setEarnings(earningsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    fetchJobs();
    fetchHistory();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/employee/services', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      const data = await response.json();
      setAvailableJobs(data.filter((job: Service) => job.status === 'SCHEDULED'));
      setClaimedJobs(data.filter((job: Service) => ['CLAIMED', 'ARRIVED', 'IN_PROGRESS'].includes(job.status)));
      setError(null);
    } catch (err) {
      setError('Failed to load jobs');
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/employee/services/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      setJobHistory(data);
      setError(null);
    } catch (err) {
      setError('Failed to load job history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/employee/services/${jobId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to claim job');
      
      router.push(`/employee/service/${jobId}`);
    } catch (err) {
      setError('Failed to claim job');
      console.error(err);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      const updatedEmployee = await response.json();
      setEmployee(updatedEmployee);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Employee Dashboard</h1>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Profile Information</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-blue-600 hover:text-blue-800"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cash App Username</label>
                <input
                  type="text"
                  value={formData.cashAppUsername}
                  onChange={(e) => setFormData({ ...formData, cashAppUsername: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{employee?.user.firstName} {employee?.user.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{employee?.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{employee?.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{employee?.address || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cash App Username</p>
              <p className="font-medium">{employee?.cashAppUsername || 'Not set'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Earnings Section */}
      {earnings && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Earnings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Monthly Earnings</p>
              <p className="text-2xl font-bold">${earnings.monthlyEarnings.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold">${earnings.pendingPayments.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Completed Services</p>
              <p className="text-2xl font-bold">{earnings.completedServices}</p>
            </div>
          </div>

          {/* Recent Services */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Recent Services</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {earnings.services.map((service, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(service.completedAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${service.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Payments */}
          <div>
            <h3 className="text-lg font-medium mb-2">Pending Payments</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {earnings.pendingPaymentsList.map((payment, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${payment.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Scooping Mode Button */}
      <div className="flex justify-center">
        <button
          onClick={() => router.push('/employee/scooping')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700"
        >
          Enter Scooping Mode
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6 mt-8">Available Services</h1>
      
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {/* Available Jobs Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Available Jobs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-start mb-2">
                <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
                <div>
                  <p className="font-semibold">{job.customer.name}</p>
                  <p className="text-sm text-gray-600">{job.customer.address.street}</p>
                  <p className="text-sm text-gray-600">
                    {job.customer.address.city}, {job.customer.address.state} {job.customer.address.zipCode}
                  </p>
                </div>
              </div>
              <div className="flex items-center mb-4">
                <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                <p className="text-sm text-gray-600">
                  {new Date(job.scheduledFor).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleClaimJob(job.id)}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Claim Job
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Claimed Jobs Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">My Active Jobs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {claimedJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-start mb-2">
                <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
                <div>
                  <p className="font-semibold">{job.customer.name}</p>
                  <p className="text-sm text-gray-600">{job.customer.address.street}</p>
                  <p className="text-sm text-gray-600">
                    {job.customer.address.city}, {job.customer.address.state} {job.customer.address.zipCode}
                  </p>
                </div>
              </div>
              <div className="flex items-center mb-4">
                <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                <p className="text-sm text-gray-600">
                  {new Date(job.scheduledFor).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => router.push(`/employee/service/${job.id}`)}
                className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors"
              >
                Continue Job
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Job History Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Recent History</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobHistory.map((job) => (
                <tr key={job.id} onClick={() => router.push(`/employee/service/${job.id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{job.customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {job.customer.address.street}, {job.customer.address.city}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(job.scheduledFor).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {job.status === 'COMPLETED' ? (
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 mr-1" />
                      )}
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
} 