'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Map, Calendar, Users, CheckCircle, XCircle, MapPin, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { EmployeeServiceCard } from '@/components/EmployeeServiceCard';

interface Service {
  id: string;
  address: string;
  preferredDay: string;
  status: 'PENDING' | 'CLAIMED' | 'COMPLETED' | 'LATE';
  paymentAmount: number;
  createdAt: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export default function EmployeeDashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'time'>('time');

  useEffect(() => {
    // Get user's location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Fetch services
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services/available');
      const data = await response.json();
      
      // Process services to add status and sort
      const processedServices = data.map((service: Service) => {
        const serviceDate = new Date(service.preferredDay);
        const now = new Date();
        const hoursUntilService = (serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        return {
          ...service,
          status: hoursUntilService < 0 ? 'LATE' : service.status,
          isAvailable: hoursUntilService <= 24 && hoursUntilService >= 0,
        };
      });

      // Sort services
      const sortedServices = sortServices(processedServices);
      setServices(sortedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortServices = (services: Service[]) => {
    if (sortBy === 'distance' && userLocation) {
      return services.sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0;
        const distanceA = calculateDistance(userLocation, a.coordinates);
        const distanceB = calculateDistance(userLocation, b.coordinates);
        return distanceA - distanceB;
      });
    } else {
      // Sort by time (oldest first)
      return services.sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    }
  };

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
    const dLon = (point2.lng - point1.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * (Math.PI / 180)) *
        Math.cos(point2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleClaim = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/claim`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to claim service');
      fetchServices(); // Refresh the list
    } catch (error) {
      console.error('Error claiming service:', error);
    }
  };

  const handleComplete = async (serviceId: string, data: any) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to complete service');
      fetchServices(); // Refresh the list
    } catch (error) {
      console.error('Error completing service:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Available Services</h1>
          <div className="flex items-center space-x-4">
            <Button
              variant={sortBy === 'distance' ? 'default' : 'outline'}
              onClick={() => setSortBy('distance')}
              disabled={!userLocation}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Sort by Distance
            </Button>
            <Button
              variant={sortBy === 'time' ? 'default' : 'outline'}
              onClick={() => setSortBy('time')}
            >
              <Clock className="mr-2 h-4 w-4" />
              Sort by Time
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{service.address}</h3>
                  {service.status === 'LATE' && (
                    <span className="flex items-center text-sm text-red-600">
                      <AlertCircle className="mr-1 h-4 w-4" />
                      Late
                    </span>
                  )}
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center text-sm text-neutral-600">
                    <Clock className="mr-2 h-4 w-4" />
                    {service.preferredDay}
                  </div>
                  <div className="flex items-center text-sm text-neutral-600">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Earnings: ${(service.paymentAmount * 0.75).toFixed(2)}
                  </div>
                </div>

                <EmployeeServiceCard
                  service={service}
                  employeeId="current-user-id" // Replace with actual user ID
                  onClaim={handleClaim}
                  onComplete={handleComplete}
                />
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
} 