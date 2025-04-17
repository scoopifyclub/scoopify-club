'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CameraIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface Service {
  id: string;
  scheduledFor: string;
  customer: {
    name: string;
    address: string;
  };
  employee?: {
    name: string;
  };
  photos: Array<{
    id: string;
    url: string;
    type: 'PRE_CLEAN' | 'POST_CLEAN';
    createdAt: string;
  }>;
  checklist: {
    gatesClosed: boolean;
    gatesLocked: boolean;
    gatesSecured: boolean;
    gatesChecked: boolean;
    gatesVerified: boolean;
    gatesConfirmed: boolean;
    gatesInspected: boolean;
    gatesValidated: boolean;
    gatesApproved: boolean;
    gatesCompleted: boolean;
  };
}

export default function PhotosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchServices();
  }, [selectedDate]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/admin/services/photos?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch services');
      
      const data = await response.json();
      setServices(data.services);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Photos & Checklists</h1>
          <p className="mt-2 text-gray-600">View service documentation and completion status</p>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Services List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-500">{error}</div>
          ) : services.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No services found for this date
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {services.map((service) => (
                <li key={service.id} className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleService(service.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CalendarIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {service.customer.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {service.customer.address}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(service.scheduledFor).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedService === service.id ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {expandedService === service.id && (
                    <div className="mt-4">
                      {/* Employee Info */}
                      {service.employee && (
                        <div className="mb-4 flex items-center text-sm text-gray-500">
                          <UserIcon className="h-5 w-5 mr-2" />
                          Completed by: {service.employee.name}
                        </div>
                      )}

                      {/* Photos */}
                      <div className="mb-6">
                        <h4 className="text-lg font-medium mb-4">Service Photos</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Before</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {service.photos
                                .filter(photo => photo.type === 'PRE_CLEAN')
                                .map(photo => (
                                  <div key={photo.id} className="relative">
                                    <img
                                      src={photo.url}
                                      alt="Pre-clean"
                                      className="w-full h-32 object-cover rounded-lg"
                                    />
                                    <span className="absolute bottom-1 right-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                                      {new Date(photo.createdAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">After</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {service.photos
                                .filter(photo => photo.type === 'POST_CLEAN')
                                .map(photo => (
                                  <div key={photo.id} className="relative">
                                    <img
                                      src={photo.url}
                                      alt="Post-clean"
                                      className="w-full h-32 object-cover rounded-lg"
                                    />
                                    <span className="absolute bottom-1 right-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                                      {new Date(photo.createdAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Checklist */}
                      <div>
                        <h4 className="text-lg font-medium mb-4">Service Checklist</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(service.checklist).map(([key, value]) => (
                            <div key={key} className="flex items-center">
                              {value ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                              ) : (
                                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                              )}
                              <span className="text-sm text-gray-700">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 