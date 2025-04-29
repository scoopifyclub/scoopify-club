'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, UserIcon, CheckCircleIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline';
export default function JobsPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const router = useRouter();
    useEffect(() => {
        fetchServices();
    }, [selectedDate]);
    const fetchServices = async () => {
        try {
            const response = await fetch(`/api/admin/services?date=${selectedDate}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok)
                throw new Error('Failed to fetch services');
            const data = await response.json();
            setServices(data.services);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load services');
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'CLAIMED':
                return 'bg-blue-100 text-blue-800';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING':
                return <ClockIcon className="h-5 w-5"/>;
            case 'CLAIMED':
                return <UserIcon className="h-5 w-5"/>;
            case 'COMPLETED':
                return <CheckCircleIcon className="h-5 w-5"/>;
            default:
                return null;
        }
    };
    return (<div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Jobs & Scheduling</h1>
          <button onClick={() => router.push('/admin/jobs/new')} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <PlusIcon className="h-5 w-5 mr-2"/>
            Create New Job
          </button>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
        </div>

        {/* Services List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {loading ? (<li className="px-4 py-4">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              </li>) : error ? (<li className="px-4 py-4 text-red-500">{error}</li>) : services.length === 0 ? (<li className="px-4 py-4 text-gray-500 text-center">
                No services scheduled for this date
              </li>) : (services.map((service) => (<li key={service.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getStatusColor(service.status)}`}>
                          {getStatusIcon(service.status)}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {service.customer.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {service.customer.address}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(service.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {service.employee && (<div className="flex items-center text-sm text-gray-500">
                          <UserIcon className="h-5 w-5 mr-1"/>
                          {service.employee.name}
                        </div>)}
                      {service.completedAt && (<div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-5 w-5 mr-1"/>
                          {new Date(service.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>)}
                      <button onClick={() => router.push(`/admin/jobs/${service.id}`)} className="text-blue-600 hover:text-blue-800">
                        View Details
                      </button>
                    </div>
                  </div>
                </li>)))}
          </ul>
        </div>
      </div>
    </div>);
}
