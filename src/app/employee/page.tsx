'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Map, History, Download } from 'lucide-react';
import { ServiceStatus } from '@prisma/client';
import { ServiceMap } from '@/components/ServiceMap';
import { ServiceDetails } from '@/components/ServiceDetails';

interface Service {
  id: string;
  status: ServiceStatus;
  scheduledDate: string;
  completedDate?: string;
  customer: {
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    } | null;
  };
  servicePlan: {
    name: string;
    duration: number;
  } | null;
  notes: string | null;
  latitude?: number;
  longitude?: number;
}

interface PerformanceMetrics {
  totalJobs: number;
  averageDuration: string;
  onTimeRate: number;
  totalHours: number;
}

export default function EmployeeDashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalJobs: 0,
    averageDuration: '0h 0m',
    onTimeRate: 0,
    totalHours: 0
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/employee/services?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      setServices(data.services);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [selectedDate]);

  const handleClaimJob = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/employee/services/${serviceId}/claim`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to claim service');
      }

      fetchServices();
      setSelectedService(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim service');
    }
  };

  const handleArrive = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/employee/services/${serviceId}/arrive`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark as arrived');
      }

      fetchServices();
      setSelectedService(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as arrived');
    }
  };

  const handleComplete = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/employee/services/${serviceId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to complete service');
      }

      fetchServices();
      setSelectedService(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete service');
    }
  };

  const availableServices = services.filter(s => s.status === 'SCHEDULED');
  const inProgressServices = services.filter(s => 
    ['CLAIMED', 'ARRIVED', 'IN_PROGRESS'].includes(s.status)
  );
  const completedServices = services.filter(s => s.status === 'COMPLETED');

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const hasInProgressJob = inProgressServices.length > 0;

  const renderServiceCard = (service: Service) => (
    <Card key={service.id}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{service.servicePlan?.name || 'Service'}</span>
          <span className="text-sm font-normal">
            {formatDateTime(service.scheduledDate)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>{service.customer.email}</span>
          </div>
          {service.customer.address && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {service.customer.address.street}
              </span>
            </div>
          )}
          {service.servicePlan && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {formatDuration(service.scheduledDate, service.completedDate || '')}
              </span>
            </div>
          )}
          {service.completedDate && (
            <div className="flex items-center space-x-2 text-green-600">
              <History className="w-4 h-4" />
              <span className="text-sm">
                Completed: {formatDateTime(service.completedDate)}
              </span>
            </div>
          )}
          {service.notes && (
            <p className="text-sm text-gray-500">{service.notes}</p>
          )}
          <Button
            onClick={() => setSelectedService(service)}
            variant="outline"
            className="w-full"
            disabled={service.status === 'SCHEDULED' && hasInProgressJob}
          >
            {service.status === 'SCHEDULED' && hasInProgressJob
              ? 'Complete Current Job First'
              : 'View Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderHistoryCard = (service: Service) => (
    <Card key={service.id} className="hover:bg-gray-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{service.servicePlan?.name || 'Service'}</span>
          <span className="text-sm font-normal">
            {formatDateTime(service.scheduledDate)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>{service.customer.email}</span>
          </div>
          {service.customer.address && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {service.customer.address.street}
              </span>
            </div>
          )}
          {service.servicePlan && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {formatDuration(service.scheduledDate, service.completedDate || '')}
              </span>
            </div>
          )}
          {service.completedDate && (
            <div className="flex items-center space-x-2 text-green-600">
              <History className="w-4 h-4" />
              <span className="text-sm">
                Completed: {formatDateTime(service.completedDate)}
              </span>
            </div>
          )}
          {service.notes && (
            <p className="text-sm text-gray-500">{service.notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const calculateMetrics = (services: Service[]) => {
    const completedServices = services.filter(s => s.status === 'COMPLETED' && s.completedDate);
    const totalJobs = completedServices.length;
    
    if (totalJobs === 0) {
      return {
        totalJobs: 0,
        averageDuration: '0h 0m',
        onTimeRate: 0,
        totalHours: 0
      };
    }

    let totalDuration = 0;
    let onTimeJobs = 0;

    completedServices.forEach(service => {
      if (service.completedDate && service.servicePlan) {
        const start = new Date(service.scheduledDate);
        const end = new Date(service.completedDate);
        const duration = end.getTime() - start.getTime();
        totalDuration += duration;

        // Check if completed within planned duration
        const plannedDuration = service.servicePlan.duration * 60 * 1000; // Convert minutes to milliseconds
        if (duration <= plannedDuration) {
          onTimeJobs++;
        }
      }
    });

    const averageDurationMs = totalDuration / totalJobs;
    const hours = Math.floor(averageDurationMs / (60 * 60 * 1000));
    const minutes = Math.floor((averageDurationMs % (60 * 60 * 1000)) / (60 * 1000));

    return {
      totalJobs,
      averageDuration: `${hours}h ${minutes}m`,
      onTimeRate: (onTimeJobs / totalJobs) * 100,
      totalHours: Math.floor(totalDuration / (60 * 60 * 1000))
    };
  };

  const exportJobHistory = () => {
    const csvContent = [
      ['Service ID', 'Service Type', 'Customer', 'Address', 'Scheduled Date', 'Completed Date', 'Duration', 'Notes'],
      ...completedServices.map(service => [
        service.id,
        service.servicePlan?.name || 'N/A',
        service.customer.email,
        service.customer.address?.street || 'N/A',
        formatDateTime(service.scheduledDate),
        service.completedDate ? formatDateTime(service.completedDate) : 'N/A',
        formatDuration(service.scheduledDate, service.completedDate || ''),
        service.notes || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `job_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (completedServices.length > 0) {
      setMetrics(calculateMetrics(completedServices));
    }
  }, [completedServices]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Jobs</h1>
          {hasInProgressJob && (
            <p className="text-sm text-yellow-600 mt-1">
              You have a job in progress. Complete it before claiming a new one.
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
          >
            Map View
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {viewMode === 'map' ? (
        <div className="mb-6">
          <ServiceMap
            services={[...availableServices, ...inProgressServices]}
            onServiceClick={setSelectedService}
          />
        </div>
      ) : (
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">
              Available ({availableServices.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({inProgressServices.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedServices.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableServices.map(renderServiceCard)}
            </div>
          </TabsContent>

          <TabsContent value="in-progress">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressServices.map(renderServiceCard)}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedServices.map(renderServiceCard)}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Job History</h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  />
                  <Button
                    onClick={exportJobHistory}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Total Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{metrics.totalJobs}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Average Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{metrics.averageDuration}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">On-Time Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{metrics.onTimeRate.toFixed(1)}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-500">Total Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{metrics.totalHours}h</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedServices
                  .sort((a, b) => 
                    new Date(b.completedDate || '').getTime() - 
                    new Date(a.completedDate || '').getTime()
                  )
                  .map(renderHistoryCard)}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <ServiceDetails
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onClaim={selectedService?.status === 'SCHEDULED' && !hasInProgressJob ? 
          () => handleClaimJob(selectedService.id) : undefined}
        onArrive={selectedService?.status === 'CLAIMED' ? 
          () => handleArrive(selectedService.id) : undefined}
        onComplete={selectedService?.status === 'ARRIVED' ? 
          () => handleComplete(selectedService.id) : undefined}
        hasInProgressJob={hasInProgressJob}
      />
    </div>
  );
} 