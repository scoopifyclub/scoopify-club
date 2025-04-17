'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  ClockIcon, 
  CheckCircleIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_JOB';
  currentJob?: {
    id: string;
    customerName: string;
    address: string;
    arrivedAt: string;
  };
  todayStats: {
    completed: number;
    totalTime: number;
    averageTime: number;
  };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchEmployees();
    const interval = setInterval(fetchEmployees, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/employees/activity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch employees');
      
      const data = await response.json();
      setEmployees(data.employees);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'ON_JOB':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employee Activity</h1>
          <p className="mt-2 text-gray-600">Track employee locations and job progress</p>
        </div>

        {/* Employee List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-500">{error}</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <li key={employee.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${getStatusColor(employee.status)}`}>
                          <UserIcon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {employee.name}
                          </h3>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {employee.email}
                            </div>
                            <div className="flex items-center">
                              <PhoneIcon className="h-4 w-4 mr-1" />
                              {employee.phone}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                    </div>
                  </div>

                  {/* Current Job Info */}
                  {employee.currentJob && (
                    <div className="mt-4 bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900">Current Job</h4>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div className="flex items-center text-sm text-blue-700">
                          <UserIcon className="h-4 w-4 mr-2" />
                          {employee.currentJob.customerName}
                        </div>
                        <div className="flex items-center text-sm text-blue-700">
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          {employee.currentJob.address}
                        </div>
                        <div className="flex items-center text-sm text-blue-700">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          Arrived: {new Date(employee.currentJob.arrivedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Today's Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-gray-500">Completed Today</span>
                      </div>
                      <p className="mt-1 text-2xl font-semibold">{employee.todayStats.completed}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-500">Total Time</span>
                      </div>
                      <p className="mt-1 text-2xl font-semibold">
                        {formatDuration(employee.todayStats.totalTime)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-purple-500 mr-2" />
                        <span className="text-sm text-gray-500">Average Time</span>
                      </div>
                      <p className="mt-1 text-2xl font-semibold">
                        {formatDuration(employee.todayStats.averageTime)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => router.push(`/admin/employees/${employee.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Full History
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 