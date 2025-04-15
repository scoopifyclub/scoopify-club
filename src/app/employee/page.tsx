'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, XCircle, LogOut, MapPin, Phone, Mail, MessageSquare } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface Service {
  id: string;
  customerName: string;
  address: string;
  numberOfDogs: number;
  date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  customerEmail?: string;
  customerPhone?: string;
  latitude?: number;
  longitude?: number;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    fetchServices();
  }, [selectedDate, viewMode]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      
      if (viewMode === 'weekly') {
        // Set to start of week (Sunday)
        startDate.setDate(startDate.getDate() - startDate.getDay());
        // Set to end of week (Saturday)
        endDate.setDate(startDate.getDate() + 6);
      } else {
        // Set to start and end of day
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const response = await fetch(
        `/api/services?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'COMPLETED',
          notes: completionNotes 
        }),
      });

      if (!response.ok) throw new Error('Failed to update service');

      const updatedService = await response.json();
      setServices(services.map(service => 
        service.id === serviceId ? updatedService : service
      ));
      setSelectedService(null);
      setCompletionNotes('');
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleMarkCancelled = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (!response.ok) throw new Error('Failed to update service');

      const updatedService = await response.json();
      setServices(services.map(service => 
        service.id === serviceId ? updatedService : service
      ));
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl font-semibold">Loading...</div>
          <div className="text-gray-600">Please wait while we load the schedule</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <Button variant="outline" onClick={() => router.push('/')}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-4 flex space-x-2">
          <Button
            variant={viewMode === 'daily' ? 'default' : 'outline'}
            onClick={() => setViewMode('daily')}
          >
            Daily View
          </Button>
          <Button
            variant={viewMode === 'weekly' ? 'default' : 'outline'}
            onClick={() => setViewMode('weekly')}
          >
            Weekly View
          </Button>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">
            {viewMode === 'daily' ? 'Select Date' : 'Select Week'}
          </h2>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="rounded-lg border border-gray-300 p-2"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Service List */}
          <div className="space-y-4">
            {services.length === 0 ? (
              <div className="rounded-lg bg-white p-6 text-center">
                <p className="text-gray-600">No services scheduled for this {viewMode}</p>
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-lg bg-white p-6 shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{service.customerName}</h3>
                      <div className="mt-2 space-y-1">
                        <p className="flex items-center text-gray-600">
                          <MapPin className="mr-2 h-4 w-4" />
                          {service.address}
                        </p>
                        <p className="flex items-center text-gray-600">
                          <Phone className="mr-2 h-4 w-4" />
                          {service.customerPhone || 'No phone provided'}
                        </p>
                        <p className="flex items-center text-gray-600">
                          <Mail className="mr-2 h-4 w-4" />
                          {service.customerEmail || 'No email provided'}
                        </p>
                      </div>
                      <p className="mt-2 text-gray-600">
                        {service.numberOfDogs} dog{service.numberOfDogs !== 1 ? 's' : ''}
                      </p>
                      <p className="text-gray-600">
                        {new Date(service.date).toLocaleDateString()} at{' '}
                        {new Date(service.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {service.notes && (
                        <p className="mt-2 flex items-start text-sm text-gray-600">
                          <MessageSquare className="mr-2 mt-1 h-4 w-4 flex-shrink-0" />
                          {service.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {service.status === 'SCHEDULED' && (
                        <>
                          <Button
                            variant="outline"
                            className="text-green-600"
                            onClick={() => setSelectedService(service)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark Complete
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleMarkCancelled(service.id)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Mark Cancelled
                          </Button>
                        </>
                      )}
                      {service.status === 'COMPLETED' && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                          Completed
                        </span>
                      )}
                      {service.status === 'CANCELLED' && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Map View */}
          <div className="h-[600px] rounded-lg bg-white p-4 shadow">
            <h2 className="mb-4 text-xl font-semibold">Service Locations</h2>
            <Map services={services} />
          </div>
        </div>
      </div>

      {/* Completion Notes Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Complete Service</h2>
            <p className="mb-4 text-gray-600">
              Add any notes about the service completion for {selectedService.customerName}
            </p>
            <textarea
              className="mb-4 w-full rounded-lg border border-gray-300 p-2"
              rows={4}
              placeholder="Enter completion notes..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedService(null);
                  setCompletionNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleMarkComplete(selectedService.id)}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Mark Complete
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 